import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppLanguage, getDeviceLanguage, i18n, isAppLanguage, setI18nLanguage } from '../i18n';

const LANGUAGE_STORAGE_KEY = '@crm_app_language';

type TranslateOptions = Record<string, unknown>;

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => Promise<void>;
  t: (key: string, options?: TranslateOptions) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<AppLanguage>('en');

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        const nextLanguage = isAppLanguage(storedLanguage) ? storedLanguage : getDeviceLanguage();

        setI18nLanguage(nextLanguage);
        setLanguageState(nextLanguage);
      } catch {
        const fallbackLanguage = getDeviceLanguage();
        setI18nLanguage(fallbackLanguage);
        setLanguageState(fallbackLanguage);
      }
    };

    void loadLanguage();
  }, []);

  const setLanguage = useCallback(async (nextLanguage: AppLanguage) => {
    setI18nLanguage(nextLanguage);
    setLanguageState(nextLanguage);

    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    } catch {
      // Ignore write errors and keep in-memory language.
    }
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key, options) => i18n.t(key, options) as string,
    }),
    [language, setLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }

  return context;
};
