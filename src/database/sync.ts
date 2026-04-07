import { Q } from '@nozbe/watermelondb';
import { synchronize } from '@nozbe/watermelondb/sync';
// import { syncPull, syncPush } from '../api/productsApi.ts';
// import { database } from '../database/database';
// import { generateUUID, isValidUUID } from '../utils/uuid.ts';
import { syncPull, syncPush } from '../api/product';
import database from './index';
import Product from './models/Product';
import { generateUUID, isValidUUID } from '../utils/uuid';

type RawWithUpdatedAt = {
  updated_at: number;
};

let isSyncInProgress = false;
let lastPulledAtCache: number | null = null;

const productsCollection = () => database.collections.get<Product>('products');

function normalizeProductRecord(record, timestamp) {
  const id = String(record?.id || '').trim();
  const name = String(record?.name || '').trim();
  const price = Number(record?.price || 0);
  const updatedAt = Number(record?.updated_at || timestamp || Date.now());
  const deleted = Boolean(record?.deleted);

  return {
    id,
    name,
    price,
    updated_at: updatedAt,
    deleted,
  };
}

async function findExistingProductIds(ids) {
  const validIds = ids.filter((id) => Boolean(id));
  if (!validIds.length) return new Set();

  const localRows = await productsCollection()
    .query(Q.where('id', Q.oneOf(validIds)))
    .fetch();

  return new Set(localRows.map((row) => row.id));
}

async function findLocallyDeletedProductIds() {
  try {
    const deletedIds = await database.adapter.getDeletedRecords('products');
    if (!Array.isArray(deletedIds) || !deletedIds.length) {
      return new Set();
    }

    return new Set(deletedIds.map((id) => String(id || '').trim()).filter(Boolean));
  } catch (error) {
    console.warn('Failed to read locally deleted product ids:', error);
    return new Set();
  }
}

async function normalizePullChanges(changes) {
  const products = changes?.products || {
    created: [],
    updated: [],
    deleted: [],
  };

  const created = Array.isArray(products.created) ? products.created : [];
  const updated = Array.isArray(products.updated) ? products.updated : [];
  const deleted = Array.isArray(products.deleted) ? products.deleted : [];

  const existingIds = await findExistingProductIds(
    created.map((row) => row?.id).filter(Boolean),
  );
  const locallyDeletedIds = await findLocallyDeletedProductIds();

  const createdFiltered = [];
  const updatedMerged = updated.filter((row) => {
    const id = String(row?.id || '').trim();
    return !(id && locallyDeletedIds.has(id));
  });

  created.forEach((row) => {
    const id = String(row?.id || '').trim();

    if (id && locallyDeletedIds.has(id)) {
      return;
    }

    if (id && existingIds.has(id)) {
      updatedMerged.push(row);
      return;
    }

    createdFiltered.push(row);
  });

  return {
    ...changes,
    products: {
      created: createdFiltered,
      updated: updatedMerged,
      deleted,
    },
  };
}

async function repairInvalidCreatedProductIds(changes, timestamp) {
  const products = changes?.products || {};
  const created = Array.isArray(products.created) ? products.created : [];
  if (!created.length) return changes;

  const repairedCreated = [];

  for (const row of created) {
    const normalized = normalizeProductRecord(row, timestamp);

    if (isValidUUID(normalized.id)) {
      repairedCreated.push(normalized);
      continue;
    }

    const nextId = generateUUID();
    const oldId = normalized.id;

    try {
      await database.write(async () => {
        const existing = await productsCollection().find(oldId);

        await productsCollection().create((product) => {
          product._raw.id = nextId;
          product.name = String(existing.name || normalized.name);
          product.price = Number(existing.price || normalized.price);
          product.deleted = false;
          ((product as Product)._raw as unknown as RawWithUpdatedAt).updated_at = Number(timestamp);
        });

        await existing.destroyPermanently();
      });

      repairedCreated.push({
        ...normalized,
        id: nextId,
        updated_at: Number(timestamp),
      });
      console.log(`Repaired invalid local product id ${oldId} -> ${nextId}`);
    } catch (error) {
      console.error(`Failed to repair invalid product id ${oldId}:`, error);
    }
  }

  return {
    ...changes,
    products: {
      ...(changes.products || {}),
      created: repairedCreated,
      updated: Array.isArray(products.updated) ? products.updated : [],
      deleted: Array.isArray(products.deleted) ? products.deleted : [],
    },
  };
}

function buildPushPayload(changes, timestamp) {
  const products = changes?.products || {};

  const rawCreated = Array.isArray(products.created) ? products.created : [];
  const rawUpdated = Array.isArray(products.updated) ? products.updated : [];
  const rawDeleted = Array.isArray(products.deleted) ? products.deleted : [];

  const created = rawCreated
    .map((record) => {
      const normalized = normalizeProductRecord(record, timestamp);
      const id = isValidUUID(normalized.id) ? normalized.id : generateUUID();
      return {
        ...normalized,
        id,
        deleted: false,
        updated_at: Number(timestamp),
      };
    })
    .filter((record) => {
    const valid = Boolean(record.name) && Number.isFinite(record.price);
    if (!valid) console.warn('Dropped invalid created record:', record);
    return valid;
  });

  const updated = rawUpdated
    .map((record) => normalizeProductRecord(record, timestamp))
    .filter((record) => isValidUUID(record.id))
    .map((record) => ({
      ...record,
      deleted: false,
      updated_at: Number(timestamp),
    }));

  const deleted = rawDeleted
    .map((id) => String(id || '').trim())
    .filter((id) => isValidUUID(id));

  return {
    products: {
      created,
      updated,
      deleted,
    },
  };
}

async function touchProductRecords(changes, timestamp) {
  const products = changes?.products || {};
  const ids = [
    ...(Array.isArray(products.created) ? products.created : []),
    ...(Array.isArray(products.updated) ? products.updated : []),
  ]
    .map((row) => String(row?.id || '').trim())
    .filter((id) => isValidUUID(id));

  const uniqueIds = [...new Set(ids)];
  if (!uniqueIds.length) return;

  const rows = await productsCollection()
    .query(Q.where('id', Q.oneOf(uniqueIds)))
    .fetch();

  await database.write(async () => {
    await Promise.all(
      rows.map((row) =>
        row.update((record) => {
          ((record as Product)._raw as unknown as RawWithUpdatedAt).updated_at = Number(timestamp);
        }),
      ),
    );
  });
}

function normalizePullResponse(payload) {
  const fallback = {
    changes: {
      products: {
        created: [],
        updated: [],
        deleted: [],
      },
    },
    timestamp: Date.now(),
  };

  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const changes = payload.changes || fallback.changes;
  const timestamp = Number(payload.timestamp || payload.lastPulledAt || Date.now());

  return {
    changes,
    timestamp,
  };
}

export async function getStoredLastPulledAt() {
  return lastPulledAtCache;
}

export async function syncProducts({ isOnline } = { isOnline: true }) {
  if (!isOnline) {
    return { skipped: true, reason: 'offline' };
  }

  if (isSyncInProgress) {
    return { skipped: true, reason: 'busy' };
  }

  isSyncInProgress = true;
  let persistedTimestamp = null;

  try {
    await synchronize({
      database,
      pullChanges: async ({ lastPulledAt }) => {
        const response = await syncPull(lastPulledAt);
        const normalized = normalizePullResponse(response);
        normalized.changes = await normalizePullChanges(normalized.changes);
        persistedTimestamp = normalized.timestamp;
        lastPulledAtCache = Number(persistedTimestamp);
        return normalized;
      },
      pushChanges: async ({ changes, lastPulledAt }) => {
        const now = Date.now();
        const repairedChanges = await repairInvalidCreatedProductIds(changes, now);
        const pushData = buildPushPayload(repairedChanges, now);

        await syncPush({ changes: pushData, lastPulledAt });

        try {
          await syncPush({
            changes: pushData,
            lastPulledAt,
          });

          persistedTimestamp = Number(lastPulledAt || now);
          lastPulledAtCache = Number(persistedTimestamp);
        } catch (error) {
          console.error('pushChanges failed:', error);
          throw error;
        }
      },
      // migrationsEnabledAtVersion: 1,
    });

    const safeTimestamp = Number(persistedTimestamp || Date.now());
    lastPulledAtCache = safeTimestamp;

    return {
      success: true,
      lastPulledAt: safeTimestamp,
    };
  } catch (error) {
    console.error('Sync failed:', error);
    return {
      success: false,
      error,
    };
  } finally {
    isSyncInProgress = false;
  }
}

export async function syncPushOnlyPending({ isOnline } = { isOnline: true }) {
  if (!isOnline) {
    return { skipped: true, reason: 'offline' };
  }

  if (isSyncInProgress) {
    return { skipped: true, reason: 'busy' };
  }

  isSyncInProgress = true;

  try {
    await synchronize({
      database,
      pullChanges: async ({ lastPulledAt }) => ({
        changes: {
          products: {
            created: [],
            updated: [],
            deleted: [],
          },
        },
        timestamp: Number(lastPulledAt || lastPulledAtCache || Date.now()),
      }),
      pushChanges: async ({ changes, lastPulledAt }) => {
        const now = Date.now();
        const repairedChanges = await repairInvalidCreatedProductIds(changes, now);
        const pushData = buildPushPayload(repairedChanges, now);

        await touchProductRecords(pushData, now);
        await syncPush({
          changes: pushData,
          lastPulledAt,
        });
      },
      // migrationsEnabledAtVersion: 1,
    });

    return { success: true };
  } catch (error) {
    console.error('Push-only sync failed:', error);
    return { success: false, error };
  } finally {
    isSyncInProgress = false;
  }
}
