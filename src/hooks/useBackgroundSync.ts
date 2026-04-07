import { useEffect, useState } from 'react';
import {
  backgroundSyncService,
  type BackgroundSyncState,
} from '../services/backgroundSync';

export function useBackgroundSync(): Pick<BackgroundSyncState, 'isSyncing' | 'lastSyncedAt'> {
  const [state, setState] = useState<BackgroundSyncState>(backgroundSyncService.getSnapshot());

  useEffect(() => {
    backgroundSyncService.start();
    const unsubscribe = backgroundSyncService.subscribe(setState);

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    isSyncing: state.isSyncing,
    lastSyncedAt: state.lastSyncedAt,
  };
}
