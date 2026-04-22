import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useLanguage } from '../../contexts';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useMemo } from 'react';
import { logout } from '../../hooks/useAuth';
import { useFcmTesting } from '../../hooks';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { language, setLanguage, t } = useLanguage();
  const user = route.params?.user;
  const { permission, shortToken, fcmToken, lastMessage, refreshToken } = useFcmTesting();

  const handleLogout = async () => {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleToggleLanguage = async () => {
    await setLanguage(language === 'en' ? 'km' : 'en');
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
        <View style={[styles.topActions, { top: insets.top + 10 }]}>
          <Pressable style={styles.languageButton} onPress={() => void handleToggleLanguage()}>
            <Text style={styles.languageButtonText}>{language === 'en' ? 'ខ្មែរ' : 'English'}</Text>
          </Pressable>
          <Pressable style={styles.logoutButton} onPress={() => void handleLogout()}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </Pressable>
        </View>
        <View style={[styles.fcmOverlayCard, { bottom: insets.bottom + 14 }]}> 
          <Text style={styles.fcmOverlayTitle}>FCM Test</Text>
          <Text style={styles.fcmOverlayLine}>Permission: {permission}</Text>
          <Text style={styles.fcmOverlayLine}>Token: {shortToken}</Text>
          {!!lastMessage && <Text style={styles.fcmOverlayLine}>Last: {lastMessage}</Text>}
          <Pressable style={styles.fcmButton} onPress={() => void refreshToken()}>
            <Text style={styles.fcmButtonText}>Refresh token</Text>
          </Pressable>
        </View>
        <RoleBTracker userId={user.id} />
      </View>
    );
  }

  if (user?.role === 'ROLE_A') {
    const RoleAViewer = require('../../components/RoleAViewer').default as () => React.JSX.Element;
    return (
      <View style={styles.roleContainer}>
        <View style={[styles.topActions, { top: insets.top + 10 }]}>
          <Pressable style={styles.languageButton} onPress={() => void handleToggleLanguage()}>
            <Text style={styles.languageButtonText}>{language === 'en' ? 'ខ្មែរ' : 'English'}</Text>
          </Pressable>
          <Pressable style={styles.logoutButton} onPress={() => void handleLogout()}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </Pressable>
        </View>
        <View style={[styles.fcmOverlayCard, { bottom: insets.bottom + 14 }]}> 
          <Text style={styles.fcmOverlayTitle}>FCM Test</Text>
          <Text style={styles.fcmOverlayLine}>Permission: {permission}</Text>
          <Text style={styles.fcmOverlayLine}>Token: {shortToken}</Text>
          {!!lastMessage && <Text style={styles.fcmOverlayLine}>Last: {lastMessage}</Text>}
          <Pressable style={styles.fcmButton} onPress={() => void refreshToken()}>
            <Text style={styles.fcmButtonText}>Refresh token</Text>
          </Pressable>
        </View>
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

      <View style={styles.fcmCard}>
        <Text style={styles.fcmTitle}>FCM Android Test</Text>
        <Text style={styles.fcmLine}>Permission: {permission}</Text>
        <Text style={styles.fcmLine}>Token:</Text>
        <Text selectable style={styles.fcmTokenValue}>
          {fcmToken || 'Not available yet'}
        </Text>
        {!!lastMessage && <Text style={styles.fcmLine}>Last message: {lastMessage}</Text>}
        <Pressable style={styles.fcmButton} onPress={() => void refreshToken()}>
          <Text style={styles.fcmButtonText}>Refresh token</Text>
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
  fcmCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginTop: 12,
    marginBottom: 12,
  },
  fcmOverlayCard: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 12,
    padding: 10,
    zIndex: 20,
  },
  fcmTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  fcmLine: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  fcmTokenValue: {
    fontSize: 11,
    color: '#0f172a',
    marginTop: 4,
  },
  fcmButton: {
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 7,
    alignItems: 'center',
  },
  fcmButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  fcmOverlayTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 4,
  },
  fcmOverlayLine: {
    fontSize: 12,
    color: '#e2e8f0',
    marginTop: 2,
  },
  topActions: {
    position: 'absolute',
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 20,
  },
  languageButton: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(37, 99, 235, 0.9)',
  },
  languageButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  logoutButton: {
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
