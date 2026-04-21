import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ENDPOINTS } from '../config/network';
import { setSession } from '../hooks/useAuth';
import type { AppUser, RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

type LoginSuccessResponse = {
  data?: {
    token?: string;
    user?: AppUser;
  };
  error?: string;
};

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(ENDPOINTS.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const payload = (await response.json()) as LoginSuccessResponse;

      if (!response.ok) {
        throw new Error(payload?.error || 'Login failed.');
      }

      const token = payload?.data?.token;
      const user = payload?.data?.user;

      if (!token || !user) {
        throw new Error('Invalid login response.');
      }

      await setSession(token, user);

      navigation.reset({
        index: 0,
        routes: [{ name: 'Home', params: { user } }],
      });
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : 'Login failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Login</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => void handleLogin()}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Login</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 20,
    color: '#64748b',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  button: {
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  errorText: {
    color: '#dc2626',
    fontWeight: '600',
    marginBottom: 6,
  },
});
