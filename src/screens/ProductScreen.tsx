import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import NetworkStatusIcon from '../components/NetworkStatusIcon';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  hardDeleteProduct,
  syncProducts,
  updateProduct,
} from '../database/actions/productActions';
import { syncPushOnlyPending } from '../database/sync';

type Props = NativeStackScreenProps<RootStackParamList, 'Products'>;

type Product = {
  id: string;
  name: string;
  price: number;
};

export default function ProductScreen(_: Props) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(insets.top, insets.bottom), [insets.bottom, insets.top]);
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

  const resetForm = () => {
    setName('');
    setPrice('');
    setSelectedId(null);
  };

  const pushPendingIfOnline = async () => {
    if (!isOnline) {
      return;
    }

    try {
      await syncPushOnlyPending();
    } catch (error) {
      console.error('Auto push sync failed:', error);
    }
  };

  const handleSave = async () => {
    const numericPrice = Number(price);
    if (!name.trim() || Number.isNaN(numericPrice)) {
      return;
    }

    if (selectedId) {
      await updateProduct(selectedId, { name: name.trim(), price: numericPrice });
    } else {
      await createProduct({ name: name.trim(), price: numericPrice });
    }

    await pushPendingIfOnline();

    resetForm();
    await loadProducts();
  };

  const handleSoftDelete = async (id: string) => {
    await deleteProduct(id);
    await pushPendingIfOnline();
    if (selectedId === id) {
      resetForm();
    }
    await loadProducts();
  };

  const handleHardDelete = async (id: string) => {
    await hardDeleteProduct(id);
    await pushPendingIfOnline();
    if (selectedId === id) {
      resetForm();
    }
    await loadProducts();
  };

  const handleSelect = (item: Product) => {
    setSelectedId(item.id);
    setName(item.name ?? '');
    setPrice(String(item.price ?? ''));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (isOnline) {
        await syncProducts();
      }
      await loadProducts();
    } catch (error) {
      console.error('Refresh sync failed:', error);
      await loadProducts();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.title}>Products</Text>
        <View style={styles.networkWrap}>
          <NetworkStatusIcon />
          <Text style={[styles.networkText, isOnline ? styles.onlineText : styles.offlineText]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      <View style={styles.form}>
        <Text style={styles.formTitle}>{selectedId ? 'Edit product' : 'Add product'}</Text>
        <TextInput
          placeholder="Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <TextInput
          placeholder="Price"
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
          style={styles.input}
        />
        <View style={styles.row}>
          <Pressable style={styles.primaryButton} onPress={() => void handleSave()}>
            <Text style={styles.primaryButtonText}>
              {selectedId ? 'Update' : 'Create'}
            </Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={resetForm}>
            <Text style={styles.secondaryButtonText}>Clear</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.listHeader}>
        <View>
          <Text style={styles.subtitle}>Local Inventory</Text>
          <Text style={styles.helperText}>{products.length} item(s)</Text>
        </View>
        <Pressable
          style={[
            styles.refreshButton,
            isRefreshing || !isOnline ? styles.refreshButtonDisabled : null,
          ]}
          onPress={() => void handleRefresh()}
          disabled={isRefreshing || !isOnline}
        >
          <Text style={styles.refreshButtonIcon}>↻</Text>
          <Text style={styles.refreshButtonText}>
            {isRefreshing ? 'Refreshing...' : isOnline ? 'Refresh' : 'Offline'}
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No products saved yet.</Text>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => handleSelect(item)}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardPrice}>${Number(item.price).toFixed(2)}</Text>
            </View>
            <Text style={styles.cardMeta}>ID: {item.id}</Text>
            <View style={styles.row}>
              <Pressable
                style={styles.softDeleteButton}
                onPress={() => void handleSoftDelete(item.id)}
              >
                <Text style={styles.softDeleteText}>Soft Delete</Text>
              </Pressable>
              <Pressable
                style={styles.hardDeleteButton}
                onPress={() => void handleHardDelete(item.id)}
              >
                <Text style={styles.hardDeleteText}>Hard Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const createStyles = (topInset: number, bottomInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f8fafc',
      paddingTop: topInset + 8,
      paddingBottom: bottomInset,
      paddingHorizontal: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: '#0f172a',
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    networkWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#ffffff',
      borderRadius: 999,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    networkText: {
      fontSize: 12,
      fontWeight: '700',
    },
    onlineText: {
      color: '#166534',
    },
    offlineText: {
      color: '#b91c1c',
    },
    formTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: '#334155',
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#0f172a',
    },
    helperText: {
      fontSize: 12,
      color: '#64748b',
      marginTop: 2,
    },
    form: {
      backgroundColor: '#fff',
      padding: 16,
      borderRadius: 16,
      shadowColor: '#0f172a',
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: '#e2e8f0',
    },
    input: {
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      marginBottom: 12,
      backgroundColor: '#f8fafc',
      color: '#0f172a',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    primaryButton: {
      flex: 1,
      backgroundColor: '#2563eb',
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 16,
    },
    secondaryButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#cbd5f5',
    },
    secondaryButtonText: {
      color: '#1e40af',
      fontWeight: '600',
      fontSize: 16,
    },
    listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    refreshButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#e0e7ff',
      borderWidth: 1,
      borderColor: '#c7d2fe',
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    refreshButtonDisabled: {
      opacity: 0.7,
    },
    refreshButtonIcon: {
      color: '#1d4ed8',
      fontSize: 14,
      fontWeight: '700',
    },
    refreshButtonText: {
      color: '#1d4ed8',
      fontWeight: '700',
      fontSize: 13,
    },
    list: {
      paddingBottom: 24,
    },
    emptyText: {
      textAlign: 'center',
      color: '#64748b',
      marginTop: 32,
    },
    card: {
      backgroundColor: '#fff',
      padding: 16,
      borderRadius: 16,
      marginBottom: 12,
      shadowColor: '#0f172a',
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
      borderWidth: 1,
      borderColor: '#e2e8f0',
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#0f172a',
    },
    cardPrice: {
      fontSize: 16,
      fontWeight: '600',
      color: '#2563eb',
    },
    cardMeta: {
      marginTop: 6,
      color: '#94a3b8',
      fontSize: 12,
    },
    softDeleteButton: {
      flex: 1,
      marginTop: 12,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: '#fef3c7',
      alignItems: 'center',
    },
    softDeleteText: {
      color: '#92400e',
      fontWeight: '600',
    },
    hardDeleteButton: {
      flex: 1,
      marginTop: 12,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: '#fee2e2',
      alignItems: 'center',
    },
    hardDeleteText: {
      color: '#b91c1c',
      fontWeight: '600',
    },
  });
