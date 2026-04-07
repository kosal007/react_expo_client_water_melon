import { Q } from '@nozbe/watermelondb';
import database from './index';
import Product from './models/Product';
import type { TableChanges } from '../utils/hasPendingChanges';

const productsCollection = database.collections.get<Product>('products');

export async function getPendingProductChanges(): Promise<TableChanges> {
  const [createdRows, updatedRows, deletedIds] = await Promise.all([
    productsCollection.query(Q.where('_status', 'created')).fetch(),
    productsCollection.query(Q.where('_status', 'updated')).fetch(),
    database.adapter.getDeletedRecords('products'),
  ]);

  return {
    created: createdRows.map((row) => row.id),
    updated: updatedRows.map((row) => row.id),
    deleted: Array.isArray(deletedIds) ? deletedIds : [],
  };
}
