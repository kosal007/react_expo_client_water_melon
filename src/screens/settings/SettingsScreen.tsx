import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import LanguageOptionButton from '../../components/LanguageOptionButton';
import { useLanguage } from '../../contexts';
import { FCM_DEVICE_TOKEN_KEY } from '../../hooks/useExpoPushToken';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { language, setLanguage, t } = useLanguage();
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  const loadFcmToken = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(FCM_DEVICE_TOKEN_KEY);
      setFcmToken(token);
    } catch (error) {
      console.warn('Failed to read FCM token:', error);
      setFcmToken(null);
    }
  }, []);

  useEffect(() => {
    void loadFcmToken();
  }, [loadFcmToken]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <Text style={styles.title}>{t('settings')}</Text>
      <Text style={styles.subtitle}>{t('app_preferences')}</Text>

      <Pressable style={styles.backButton} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.backButtonText}>← {t('back_to_home')}</Text>
      </Pressable>

      <View style={styles.languageCard}>
        <Text style={styles.languageTitle}>{t('change_language')}</Text>
        <View style={styles.languageButtonsRow}>
          <LanguageOptionButton
            label={t('english')}
            active={language === 'en'}
            onPress={() => void setLanguage('en')}
          />
          <LanguageOptionButton
            label={t('khmer')}
            active={language === 'km'}
            onPress={() => void setLanguage('km')}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('coming_soon')}</Text>
        <Text style={styles.cardText}>{t('settings_coming_soon')}</Text>
      </View>

      <View style={styles.tokenCard}>
        <Text style={styles.cardTitle}>FCM Device Token</Text>
        <Text style={styles.tokenText}>
          {fcmToken ?? 'No token yet. Open the app on a physical device and allow notifications.'}
        </Text>
        <Pressable style={styles.refreshButton} onPress={() => void loadFcmToken()}>
          <Text style={styles.refreshButtonText}>Refresh token</Text>
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
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#64748b',
    marginBottom: 12,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  backButtonText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
  languageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  languageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  languageButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
  },
  tokenCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  tokenText: {
    marginTop: 10,
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  refreshButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    borderRadius: 8,
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
