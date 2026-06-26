const DEFAULT_FRESH_MS = 15_000;

const cacheState = {
  collections: new Map(),
  pendingRequests: new Map(),
  resources: new Map(),
  snapshot: null,
  snapshotUpdatedAt: 0,
};

function now() {
  return Date.now();
}

function isFresh(updatedAt, maxAgeMs = DEFAULT_FRESH_MS) {
  return Boolean(updatedAt) && now() - updatedAt < maxAgeMs;
}

function normalizeRecords(records) {
  return Array.isArray(records) ? records : [];
}

export function clearDataCache() {
  cacheState.collections.clear();
  cacheState.pendingRequests.clear();
  cacheState.resources.clear();
  cacheState.snapshot = null;
  cacheState.snapshotUpdatedAt = 0;
}

export function readSnapshotCache() {
  return cacheState.snapshot;
}

export function isSnapshotCacheFresh(maxAgeMs = DEFAULT_FRESH_MS) {
  return isFresh(cacheState.snapshotUpdatedAt, maxAgeMs);
}

export function writeSnapshotCache(snapshot) {
  cacheState.snapshot = snapshot || {};
  cacheState.snapshotUpdatedAt = now();

  Object.entries(cacheState.snapshot).forEach(([collectionName, records]) => {
    if (Array.isArray(records)) {
      cacheState.collections.set(collectionName, {
        records,
        updatedAt: cacheState.snapshotUpdatedAt,
      });
    }
  });

  return cacheState.snapshot;
}

export function readCollectionCache(collectionName) {
  const cachedCollection = cacheState.collections.get(collectionName);

  if (cachedCollection) {
    return cachedCollection.records;
  }

  return Array.isArray(cacheState.snapshot?.[collectionName])
    ? cacheState.snapshot[collectionName]
    : null;
}

export function isCollectionCacheFresh(collectionName, maxAgeMs = DEFAULT_FRESH_MS) {
  return isFresh(cacheState.collections.get(collectionName)?.updatedAt, maxAgeMs);
}

export function writeCollectionCache(collectionName, records) {
  const normalizedRecords = normalizeRecords(records);

  cacheState.collections.set(collectionName, {
    records: normalizedRecords,
    updatedAt: now(),
  });

  if (cacheState.snapshot && Array.isArray(cacheState.snapshot[collectionName])) {
    cacheState.snapshot = {
      ...cacheState.snapshot,
      [collectionName]: normalizedRecords,
    };
    cacheState.snapshotUpdatedAt = now();
  }

  return normalizedRecords;
}

export function updateCollectionCache(collectionName, updater) {
  const currentRecords = readCollectionCache(collectionName) || [];
  const nextRecords = updater(currentRecords);

  return writeCollectionCache(collectionName, nextRecords);
}

export function readResourceCache(resourceKey) {
  return cacheState.resources.get(resourceKey)?.data ?? null;
}

export function writeResourceCache(resourceKey, data) {
  cacheState.resources.set(resourceKey, {
    data,
    updatedAt: now(),
  });

  return data;
}

export async function runCachedRequest(requestKey, loader) {
  if (!requestKey) {
    return loader();
  }

  if (cacheState.pendingRequests.has(requestKey)) {
    return cacheState.pendingRequests.get(requestKey);
  }

  const pendingRequest = Promise.resolve()
    .then(loader)
    .finally(() => {
      cacheState.pendingRequests.delete(requestKey);
    });

  cacheState.pendingRequests.set(requestKey, pendingRequest);

  return pendingRequest;
}
