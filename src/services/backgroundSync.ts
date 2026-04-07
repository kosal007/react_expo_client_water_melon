import NetInfo, { type NetInfoSubscription } from '@react-native-community/netinfo';
import { getPendingProductChanges } from '../database/pendingChanges';
import { syncPushOnlyPending } from '../database/sync';
import { hasPendingChanges } from '../utils/hasPendingChanges';

export type BackgroundSyncState = {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
};

type BackgroundSyncListener = (state: BackgroundSyncState) => void;

class BackgroundSyncService {
  private state: BackgroundSyncState = {
    isOnline: false,
    isSyncing: false,
    lastSyncedAt: null,
  };

  private listeners = new Set<BackgroundSyncListener>();
  private unsubscribeNetInfo: NetInfoSubscription | null = null;

  public start() {
    if (this.unsubscribeNetInfo) {
      return;
    }

    void this.bootstrap();

    this.unsubscribeNetInfo = NetInfo.addEventListener((nextState) => {
      const isOnline = nextState.isConnected === true && nextState.isInternetReachable === true;
      const wasOnline = this.state.isOnline;

      this.setState({ isOnline });

      if (!wasOnline && isOnline) {
        this.schedulePushSync();
      }
    });
  }

  public stop() {
    if (!this.unsubscribeNetInfo) {
      return;
    }

    this.unsubscribeNetInfo();
    this.unsubscribeNetInfo = null;
  }

  public subscribe(listener: BackgroundSyncListener): () => void {
    this.listeners.add(listener);
    listener(this.state);

    return () => {
      this.listeners.delete(listener);
    };
  }

  public getSnapshot(): BackgroundSyncState {
    return this.state;
  }

  private async bootstrap() {
    try {
      const initialState = await NetInfo.fetch();
      const isOnline = initialState.isConnected === true && initialState.isInternetReachable === true;

      this.setState({ isOnline });

      if (isOnline) {
        this.schedulePushSync();
      }
    } catch (error) {
      console.warn('Background sync bootstrap failed:', error);
    }
  }

  private schedulePushSync() {
    setTimeout(() => {
      void this.pushPendingInBackground();
    }, 0);
  }

  private async pushPendingInBackground() {
    if (!this.state.isOnline || this.state.isSyncing) {
      return;
    }

    try {
      const pending = hasPendingChanges(await getPendingProductChanges());
      if (!pending) {
        return;
      }

      this.setState({ isSyncing: true });

      const result = await syncPushOnlyPending({ isOnline: true });
      if ((result as { success?: boolean })?.success) {
        this.setState({ lastSyncedAt: new Date() });
      }
    } catch (error) {
      console.warn('Background push sync failed:', error);
    } finally {
      this.setState({ isSyncing: false });
    }
  }

  private setState(next: Partial<BackgroundSyncState>) {
    this.state = {
      ...this.state,
      ...next,
    };

    this.listeners.forEach((listener) => listener(this.state));
  }
}

export const backgroundSyncService = new BackgroundSyncService();
