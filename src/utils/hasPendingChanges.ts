export type TableChanges = {
  created?: unknown[];
  updated?: unknown[];
  deleted?: Array<string | number>;
};

export function hasPendingChanges(changes?: TableChanges | null): boolean {
  if (!changes) return false;

  const createdCount = Array.isArray(changes.created) ? changes.created.length : 0;
  const updatedCount = Array.isArray(changes.updated) ? changes.updated.length : 0;
  const deletedCount = Array.isArray(changes.deleted) ? changes.deleted.length : 0;

  return createdCount + updatedCount + deletedCount > 0;
}
