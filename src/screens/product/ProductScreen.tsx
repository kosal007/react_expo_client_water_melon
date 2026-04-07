import { useEffect, useMemo, useState, useRef } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  KeyboardAvoidingView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import NetworkStatusIcon from '../../components/NetworkStatusIcon';
import { useLanguage } from '../../contexts';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  hardDeleteProduct,
  syncProducts,
  updateProduct,
} from '../../database/actions/productActions';
import { syncPushOnlyPending } from '../../database/sync';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = NativeStackScreenProps<RootStackParamList, 'Products'>;

type Product = {
  id: string;
  name: string;
  price: number;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ProductItem = ({
  item,
  index,
  onSelect,
  onSoftDelete,
  onHardDelete,
  hideLabel,
  deleteLabel,
  idLabel,
}: {
  item: Product;
  index: number;
  onSelect: (item: Product) => void;
  onSoftDelete: (id: string) => void;
  onHardDelete: (id: string) => void;
  hideLabel: string;
  deleteLabel: string;
  idLabel: string;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: Math.min(index * 50, 500),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        delay: Math.min(index * 50, 500),
        useNativeDriver: true,
      })
    ]).start();
  }, [index, fadeAnim, translateY]);

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <AnimatedPressable
      style={[
        styles.card,
        {
          opacity: fadeAnim,
          transform: [{ translateY }, { scale }]
        }
      ]}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={() => onSelect(item)}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardPrice}>${Number(item.price).toFixed(2)}</Text>
        </View>
        <Text style={styles.cardMeta}>{idLabel}: {item.id}</Text>
        <View style={styles.actionRow}>
          <Pressable
            style={[styles.actionButton, styles.softDeleteButton]}
            onPress={() => onSoftDelete(item.id)}
          >
            <Text style={styles.softDeleteText}>{hideLabel}</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.hardDeleteButton]}
            onPress={() => onHardDelete(item.id)}
          >
            <Text style={styles.hardDeleteText}>{deleteLabel}</Text>
          </Pressable>
        </View>
      </View>
    </AnimatedPressable>
  );
};

export default function ProductScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const dynamicStyles = useMemo(() => createStyles(insets.top, insets.bottom), [insets.bottom, insets.top]);
  const { t } = useLanguage();
  const { isOnline } = useNetworkStatus();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadProducts = async () => {
    const records = await getAllProducts();
    setProducts(records as unknown as Product[]);
  };

  useEffect(() => {
    void handleRefresh();
  }, []);

  const animateLayout = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const resetForm = () => {
    animateLayout();
    setName('');
    setPrice('');
    setSelectedId(null);
  };

  const pushPendingIfOnline = async () => {
    if (!isOnline) return;
    try {
      await syncPushOnlyPending();
    } catch (error) {
      console.error('Auto push sync failed:', error);
    }
  };

  const handleSave = async () => {
    const numericPrice = Number(price);
    if (!name.trim() || Number.isNaN(numericPrice)) return;

    if (selectedId) {
      await updateProduct(selectedId, { name: name.trim(), price: numericPrice });
    } else {
      await createProduct({ name: name.trim(), price: numericPrice });
    }

    animateLayout();
    await pushPendingIfOnline();
    resetForm();
    await loadProducts();
  };

  const handleSoftDelete = async (id: string) => {
    await deleteProduct(id);
    animateLayout();
    await pushPendingIfOnline();
    if (selectedId === id) resetForm();
    await loadProducts();
  };

  const handleHardDelete = async (id: string) => {
    await hardDeleteProduct(id);
    animateLayout();
    await pushPendingIfOnline();
    if (selectedId === id) resetForm();
    await loadProducts();
  };

  const handleSelect = (item: Product) => {
    animateLayout();
    setSelectedId(item.id);
    setName(item.name ?? '');
    setPrice(String(item.price ?? ''));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (isOnline) await syncProducts();
      animateLayout();
      await loadProducts();
    } catch (error) {
      console.error('Refresh sync failed:', error);
      await loadProducts();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={dynamicStyles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={dynamicStyles.headerContainer}>
        <View style={dynamicStyles.topRow}>
          <View>
            <Text style={dynamicStyles.title}>{t('catalog')}</Text>
            <Pressable
              style={({ pressed }) => [dynamicStyles.backHomeButton, pressed && { opacity: 0.7 }]}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={dynamicStyles.backHomeButtonText}>← {t('back_to_home')}</Text>
            </Pressable>
          </View>
          <View style={dynamicStyles.networkWrap}>
            <NetworkStatusIcon />
            <Text style={[dynamicStyles.networkText, isOnline ? dynamicStyles.onlineText : dynamicStyles.offlineText]}>
              {isOnline ? t('online') : t('offline')}
            </Text>
          </View>
        </View>

        <View style={dynamicStyles.form}>
          <Text style={dynamicStyles.formTitle}>{selectedId ? t('edit_product') : t('new_product')}</Text>
          <View style={dynamicStyles.inputGroup}>
            <TextInput
              placeholder={t('product_name')}
              placeholderTextColor="#94a3b8"
              value={name}
              onChangeText={setName}
              style={dynamicStyles.input}
            />
            <TextInput
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              style={dynamicStyles.input}
            />
          </View>
          <View style={dynamicStyles.row}>
            <Pressable 
              style={({pressed}) => [dynamicStyles.primaryButton, pressed && {opacity: 0.8}]} 
              onPress={() => void handleSave()}
            >
              <Text style={dynamicStyles.primaryButtonText}>
                {selectedId ? t('save') : t('add_item')}
              </Text>
            </Pressable>
            {selectedId && (
              <Pressable 
                style={({pressed}) => [dynamicStyles.secondaryButton, pressed && {opacity: 0.6}]} 
                onPress={resetForm}
              >
                <Text style={dynamicStyles.secondaryButtonText}>{t('cancel')}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      <View style={dynamicStyles.listSection}>
        <View style={dynamicStyles.listHeader}>
          <View>
            <Text style={dynamicStyles.subtitle}>{t('inventory')}</Text>
            <Text style={dynamicStyles.helperText}>{t('products_count', { count: products.length })}</Text>
          </View>
          <Pressable
            style={({pressed}) => [
              dynamicStyles.refreshButton,
              (isRefreshing || !isOnline) && dynamicStyles.refreshButtonDisabled,
              pressed && {opacity: 0.7}
            ]}
            onPress={() => void handleRefresh()}
            disabled={isRefreshing || !isOnline}
          >
            <Text style={dynamicStyles.refreshButtonIcon}>⟳</Text>
          </Pressable>
        </View>

        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={dynamicStyles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={dynamicStyles.emptyContainer}>
              <Text style={dynamicStyles.emptyEmoji}>📦</Text>
              <Text style={dynamicStyles.emptyText}>{t('no_products_found')}</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <ProductItem
              item={item}
              index={index}
              onSelect={handleSelect}
              onSoftDelete={handleSoftDelete}
              onHardDelete={handleHardDelete}
              hideLabel={t('hide')}
              deleteLabel={t('delete')}
              idLabel={t('id')}
            />
          )}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#64748b',
    shadowOpacity: 0.08,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3b82f6',
  },
  cardMeta: {
    marginTop: 6,
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  softDeleteButton: {
    backgroundColor: '#f1f5f9',
  },
  softDeleteText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 13,
  },
  hardDeleteButton: {
    backgroundColor: '#fef2f2',
  },
  hardDeleteText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 13,
  },
});

const createStyles = (topInset: number, bottomInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f8fafc',
    },
    headerContainer: {
      paddingTop: topInset + 16,
      paddingHorizontal: 20,
      backgroundColor: '#ffffff',
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      shadowColor: '#64748b',
      shadowOpacity: 0.05,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 5,
      zIndex: 10,
    },
    title: {
      fontSize: 32,
      fontWeight: '800',
      color: '#0f172a',
      letterSpacing: -0.5,
    },
    backHomeButton: {
      marginTop: 8,
      alignSelf: 'flex-start',
      backgroundColor: '#e2e8f0',
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    backHomeButtonText: {
      color: '#0f172a',
      fontSize: 12,
      fontWeight: '700',
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    networkWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#f1f5f9',
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    networkText: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    onlineText: { color: '#10b981' },
    offlineText: { color: '#ef4444' },
    form: {
      marginBottom: 24,
    },
    formTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 12,
    },
    inputGroup: {
      gap: 12,
      marginBottom: 16,
    },
    input: {
      backgroundColor: '#f8fafc',
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: '#0f172a',
      fontWeight: '500',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    primaryButton: {
      flex: 1,
      backgroundColor: '#0f172a',
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
      shadowColor: '#0f172a',
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    primaryButtonText: {
      color: '#ffffff',
      fontWeight: '700',
      fontSize: 16,
    },
    secondaryButton: {
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 16,
      backgroundColor: '#f1f5f9',
    },
    secondaryButtonText: {
      color: '#64748b',
      fontWeight: '700',
      fontSize: 16,
    },
    listSection: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 24,
    },
    listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 16,
    },
    subtitle: {
      fontSize: 22,
      fontWeight: '800',
      color: '#0f172a',
      letterSpacing: -0.5,
    },
    helperText: {
      fontSize: 13,
      fontWeight: '500',
      color: '#64748b',
      marginTop: 4,
    },
    refreshButton: {
      backgroundColor: '#ffffff',
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#64748b',
      shadowOpacity: 0.1,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    refreshButtonDisabled: {
      opacity: 0.5,
      backgroundColor: '#f1f5f9',
    },
    refreshButtonIcon: {
      color: '#0f172a',
      fontSize: 18,
      fontWeight: '700',
    },
    list: {
      paddingBottom: bottomInset + 24,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 48,
    },
    emptyEmoji: {
      fontSize: 48,
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 16,
      color: '#94a3b8',
      fontWeight: '500',
    },
  });
