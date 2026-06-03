import { useMemo, useState } from "react";
import Button from "../atoms/Button.jsx";
import DataTable from "./DataTable.jsx";
import EntityFormModal from "./EntityFormModal.jsx";
import Modal from "../molecules/Modal.jsx";
import { useCollection } from "../../hooks/useCollection.js";

export default function RelatedRecordsHub({ open, hub, parentRecord, snapshot, canMutate, onClose }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const { records, createRecord, updateRecord, deleteRecord } = useCollection(hub.collection);

  const relatedRecords = useMemo(() => {
    if (!parentRecord) {
      return [];
    }

    return records.filter((record) => record[hub.parentKey] === parentRecord.id);
  }, [hub.parentKey, parentRecord, records]);

  function openCreate() {
    setEditingRecord(null);
    setFormOpen(true);
  }

  function openEdit(record) {
    setEditingRecord(record);
    setFormOpen(true);
  }

  async function handleSubmit(payload) {
    const nextPayload = {
      ...payload,
      [hub.parentKey]: parentRecord.id,
    };

    if (editingRecord) {
      await updateRecord(editingRecord.id, nextPayload);
    } else {
      await createRecord(nextPayload);
    }

    setFormOpen(false);
    setEditingRecord(null);
  }

  async function handleDelete(record) {
    const confirmed = window.confirm(`Excluir "${record.name || record.problem || record.id}"?`);

    if (confirmed) {
      await deleteRecord(record.id);
    }
  }

  return (
    <Modal
      description={hub.description(parentRecord, snapshot)}
      open={open}
      title={hub.title(parentRecord, snapshot)}
      onClose={onClose}
    >
      <div className="space-y-5">
        {/* --- SECAO: ACOES DO HUB --- */}
        <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-4">
          <div>
            <strong className="block text-sm font-black text-amiste-black">{hub.emptyTitle}</strong>
            <span className="text-xs italic text-amiste-gray/65">
              {relatedRecords.length} registro(s) vinculado(s).
            </span>
          </div>
          {canMutate ? (
            <Button icon="plus" onClick={openCreate}>
              {hub.actionLabel}
            </Button>
          ) : null}
        </div>

        <DataTable
          actions={canMutate}
          columns={hub.columns}
          records={relatedRecords}
          snapshot={snapshot}
          onDelete={handleDelete}
          onEdit={openEdit}
        />

        <EntityFormModal
          description={hub.formDescription}
          editingRecord={editingRecord}
          fields={hub.fields}
          open={formOpen}
          snapshot={snapshot}
          title={hub.formTitle}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmit}
        />
      </div>
    </Modal>
  );
}
