import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getUserRole, login } from '../../api/auth';
import { useLanguage } from '../../contexts';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMessage(t('required_fields'));
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await login({
        email: email.trim(),
        password,
      });
      const role = getUserRole(response);

      switch (role) {
        case 'ROLE_A':
          navigation.replace('RoleAHome');
          return;
        case 'ROLE_B':
          navigation.replace('Home');
          return;
        default:
          setErrorMessage(t('invalid_role'));
      }
    } catch {
      setErrorMessage(t('login_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View>
        <Text style={styles.title}>{t('login')}</Text>
        <Text style={styles.subtitle}>{t('login_welcome')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t('email')}</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder={t('enter_email')}
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        <Text style={[styles.label, styles.passwordLabel]}>{t('password')}</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder={t('enter_password')}
          placeholderTextColor="#94a3b8"
          secureTextEntry
          style={styles.input}
        />

        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        <Pressable
          style={({ pressed }) => [styles.loginButton, (pressed || loading) && { opacity: 0.8 }]}
          onPress={() => void handleLogin()}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>{loading ? t('loading') : t('sign_in')}</Text>
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
  label: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
    marginBottom: 8,
  },
  passwordLabel: {
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  errorText: {
    marginTop: 12,
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    marginTop: 16,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
