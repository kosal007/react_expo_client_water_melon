import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useLanguage } from '../../contexts';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useMemo } from 'react';
import { logout } from '../../hooks/useAuth';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const user = route.params?.user;

  const handleLogout = async () => {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const nativeModuleLoadError = useMemo(() => {
    if (!user) {
      return null;
    }

    if (user.role === 'ROLE_B') {
      try {
        require('../../components/RoleBTracker');
        return null;
      } catch (error) {
        return 'Location module is not in the iOS build yet. Rebuild the dev client.';
      }
    }

    if (user.role === 'ROLE_A') {
      try {
        require('../../components/RoleAViewer');
        return null;
      } catch (error) {
        return 'Map module is not in the iOS build yet. Rebuild the dev client.';
      }
    }

    return null;
  }, [user]);

  if (nativeModuleLoadError) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackTitle}>Native module missing</Text>
        <Text style={styles.fallbackText}>{nativeModuleLoadError}</Text>
      </View>
    );
  }

  if (user?.role === 'ROLE_B') {
    const RoleBTracker = require('../../components/RoleBTracker').default as (
      props: { userId: string }
    ) => React.JSX.Element;
    return (
      <View style={styles.roleContainer}>
        <Pressable style={[styles.logoutButton, { top: insets.top + 10 }]} onPress={() => void handleLogout()}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Pressable>
        <RoleBTracker userId={user.id} />
      </View>
    );
  }

  if (user?.role === 'ROLE_A') {
    const RoleAViewer = require('../../components/RoleAViewer').default as () => React.JSX.Element;
    return (
      <View style={styles.roleContainer}>
        <Pressable style={[styles.logoutButton, { top: insets.top + 10 }]} onPress={() => void handleLogout()}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Pressable>
        <RoleAViewer />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t('home')}</Text>
          <Pressable style={styles.settingsButton} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </Pressable>
        </View>
        <Text style={styles.subtitle}>{t('welcome_to_crm_app')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('products')}</Text>
        <Text style={styles.cardText}>{t('manage_inventory')}</Text>
        <Pressable
          style={styles.button}
          onPress={() => navigation.navigate('Products')}
          accessibilityRole="button"
          accessibilityLabel={t('open_products')}
        >
          <Text style={styles.buttonIcon}>📦</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
  },
  settingsButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 20,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#64748b',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 8,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  button: {
    marginTop: 16,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  buttonIcon: {
    fontSize: 20,
  },
  fallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  fallbackText: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
  },
  roleContainer: {
    flex: 1,
  },
  logoutButton: {
    position: 'absolute',
    right: 14,
    zIndex: 20,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
});
