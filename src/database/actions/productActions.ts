import { Q } from '@nozbe/watermelondb';
import database from '../index';
import Product from '../models/Product';
import { syncProducts as runProductSync } from '../sync';

const productsCollection = database.collections.get<Product>('products');

export const createProduct = async ({ name, price }) => {
  return database.write(async () => {
    return productsCollection.create((product) => {
      product.name = name;
      product.price = price;
      product.deleted = false;
      (product as any)._raw.updated_at = Date.now();
    });
  });
};

export const updateProduct = async (id, changes) => {
  return database.write(async () => {
    const product = await productsCollection.find(id);
    await product.update((record) => {
      if (changes.name !== undefined) {
        record.name = changes.name;
      }
      if (changes.price !== undefined) {
        record.price = changes.price;
      }
      (record as any)._raw.updated_at = Date.now();
    });
  });
};

export const deleteProduct = async (id) => {
  return database.write(async () => {
    const product = await productsCollection.find(id);
    await product.update((record) => {
      record.deleted = true;
      (record as any)._raw.updated_at = Date.now();
    });
  });
};

export const hardDeleteProduct = async (id) => {
  return database.write(async () => {
    const product = await productsCollection.find(id);
    await product.destroyPermanently();
  });
};

export const getAllProducts = async () => {
  return productsCollection.query(Q.where('deleted', false)).fetch();
};

export const syncProducts = async (): Promise<void> => {
  await runProductSync();
};
