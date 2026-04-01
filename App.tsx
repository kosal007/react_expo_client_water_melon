import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  hardDeleteProduct,
  updateProduct,
} from './src/database/actions/productActions';

type Product = {
  id: string;
  name: string;
  price: number;
};

export default function App() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadProducts = async () => {
    const records = await getAllProducts();
    setProducts(records as unknown as Product[]);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const resetForm = () => {
    setName('');
    setPrice('');
    setSelectedId(null);
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

    resetForm();
    await loadProducts();
  };

  const handleSoftDelete = async (id: string) => {
    await deleteProduct(id);
    if (selectedId === id) {
      resetForm();
    }
    await loadProducts();
  };

  const handleHardDelete = async (id: string) => {
    await hardDeleteProduct(id);
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>Products</Text>

      <View style={styles.form}>
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
          <Pressable style={styles.primaryButton} onPress={handleSave}>
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
        <Text style={styles.subtitle}>Local Inventory</Text>
        <Pressable style={styles.linkButton} onPress={loadProducts}>
          <Text style={styles.linkButtonText}>Refresh</Text>
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
              <Text style={styles.cardPrice}>${item.price}</Text>
            </View>
            <Text style={styles.cardMeta}>ID: {item.id}</Text>
            <View style={styles.row}>
              <Pressable
                style={styles.softDeleteButton}
                onPress={() => handleSoftDelete(item.id)}
              >
                <Text style={styles.softDeleteText}>Soft Delete</Text>
              </Pressable>
              <Pressable
                style={styles.hardDeleteButton}
                onPress={() => handleHardDelete(item.id)}
              >
                <Text style={styles.hardDeleteText}>Hard Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
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
  linkButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  linkButtonText: {
    color: '#2563eb',
    fontWeight: '600',
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
