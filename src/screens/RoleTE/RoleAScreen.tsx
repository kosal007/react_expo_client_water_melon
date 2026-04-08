import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useLanguage } from '../../contexts';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'RoleAHome'>;

export default function RoleAScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View>
        <Text style={styles.title}>{t('role_a_home_title')}</Text>
        <Text style={styles.subtitle}>{t('role_a_home_subtitle')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardText}>{t('role_a_home_message')}</Text>

        <Pressable style={styles.button} onPress={() => navigation.replace('Login')}>
          <Text style={styles.buttonText}>{t('logout')}</Text>
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
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
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
  cardText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  button: {
    marginTop: 16,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
