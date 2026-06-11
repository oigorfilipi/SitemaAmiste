import { apiRequest } from "./apiClient.js";

function emitDatabaseChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("amiste-db-change"));
  }
}

function encodeCollectionName(collectionName) {
  return encodeURIComponent(collectionName);
}

function encodeRecordId(recordId) {
  return encodeURIComponent(recordId);
}

export async function listRecords(collectionName) {
  return apiRequest(`/api/collections/${encodeCollectionName(collectionName)}`);
}

export async function createRecord(collectionName, payload) {
  const createdRecord = await apiRequest(`/api/collections/${encodeCollectionName(collectionName)}`, {
    body: JSON.stringify(payload),
    method: "POST",
  });

  emitDatabaseChange();
  return createdRecord;
}

export async function updateRecord(collectionName, id, payload) {
  const updatedRecord = await apiRequest(
    `/api/collections/${encodeCollectionName(collectionName)}/${encodeRecordId(id)}`,
    {
      body: JSON.stringify(payload),
      method: "PUT",
    }
  );

  emitDatabaseChange();
  return updatedRecord;
}

export async function deleteRecord(collectionName, id) {
  const deletedRecord = await apiRequest(
    `/api/collections/${encodeCollectionName(collectionName)}/${encodeRecordId(id)}`,
    {
      method: "DELETE",
    }
  );

  emitDatabaseChange();
  return deletedRecord;
}

export async function setCollection(collectionName, records) {
  const updatedRecords = await apiRequest(`/api/collections/${encodeCollectionName(collectionName)}`, {
    body: JSON.stringify(records),
    method: "PUT",
  });

  emitDatabaseChange();
  return updatedRecords;
}

export async function getDatabaseSnapshot() {
  return apiRequest("/api/snapshot");
}

export async function replaceDatabaseSnapshot(database) {
  const updatedSnapshot = await apiRequest("/api/snapshot", {
    body: JSON.stringify(database),
    method: "PUT",
  });

  emitDatabaseChange();
  return updatedSnapshot;
}

export async function listCollectionNames() {
  const response = await apiRequest("/api/collections");
  return response.collections || [];
}
