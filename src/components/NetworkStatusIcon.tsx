import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { useBackgroundSync, useNetworkStatus } from '../hooks';

export default function NetworkStatusIcon() {
  const { isOnline } = useNetworkStatus();
  const { isSyncing } = useBackgroundSync();

  const color = !isOnline ? '#dc2626' : isSyncing ? '#eab308' : '#16a34a';
  const label = !isOnline
    ? 'Network offline'
    : isSyncing
      ? 'Network online, sync in progress'
      : 'Network online, synced';

  return (
    <View accessibilityLabel={label}>
      <Ionicons
        name="ellipse"
        size={20}
        color={color}
      />
    </View>
  );
}
