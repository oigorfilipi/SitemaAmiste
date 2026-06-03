import { useMemo, useState } from "react";
import Button from "../../components/atoms/Button.jsx";
import TextInput from "../../components/atoms/TextInput.jsx";
import EntityGroupTabs from "../../components/molecules/EntityGroupTabs.jsx";
import PageHeader from "../../components/molecules/PageHeader.jsx";
import AccountRosterTable from "../../components/organisms/AccountRosterTable.jsx";
import EntityFormModal from "../../components/organisms/EntityFormModal.jsx";
import MetricsGrid from "../../components/organisms/MetricsGrid.jsx";
import RolePermissionMatrix from "../../components/organisms/RolePermissionMatrix.jsx";
import RoleSummaryPanel from "../../components/organisms/RoleSummaryPanel.jsx";
import { useCollection } from "../../hooks/useCollection.js";
import {
  ACCOUNT_FORM_FIELDS,
  ACCOUNT_TABS,
  ROLE_OPTIONS,
  buildAccountMetrics,
  buildAccountRows,
  buildRoleMatrix,
  buildRoleSummary,
  filterAccountRows,
  normalizeAccountPayload,
} from "../../services/accountService.js";
import { ROLE_PERMISSIONS } from "../../services/permissionService.js";

export default function AccountsPage() {
  const [activeTab, setActiveTab] = useState("ativas");
  const [activeRole, setActiveRole] = useState("DEV");
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const { records, createRecord, updateRecord } = useCollection("accounts");
  const rows = useMemo(() => buildAccountRows(records), [records]);
  const metrics = useMemo(() => buildAccountMetrics(rows), [rows]);
  const visibleAccounts = useMemo(
    () => filterAccountRows(rows, activeTab, searchTerm),
    [activeTab, rows, searchTerm]
  );
  const roleMatrix = useMemo(() => buildRoleMatrix(), []);
  const roleSummary = useMemo(() => buildRoleSummary(activeRole), [activeRole]);
  const roles = Object.keys(ROLE_PERMISSIONS);

  function openCreateModal() {
    setEditingRecord(null);
    setModalOpen(true);
  }

  function openEditModal(account) {
    setEditingRecord(records.find((record) => record.id === account.id) || account);
    setModalOpen(true);
  }

  async function handleSubmit(payload) {
    const normalizedPayload = normalizeAccountPayload(payload, editingRecord);

    if (editingRecord) {
      await updateRecord(editingRecord.id, normalizedPayload);
    } else {
      await createRecord(normalizedPayload);
    }

    setModalOpen(false);
    setEditingRecord(null);
  }

  async function toggleStatus(account) {
    await updateRecord(account.id, {
      ...account,
      status: account.status === "ativo" ? "desativado" : "ativo",
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actionIcon="userPlus"
        actionLabel="Cadastrar Colaborador"
        description="Controle de acessos, permissoes e colaboradores da plataforma."
        title="Gestao de Contas"
        onAction={openCreateModal}
      />

      {/* --- SECAO: INDICADORES DE EQUIPE --- */}
      <MetricsGrid metrics={metrics} />

      {/* --- SECAO: ABAS DE CONTAS --- */}
      <EntityGroupTabs activeGroup={activeTab} groups={ACCOUNT_TABS} onSelectGroup={setActiveTab} />

      {activeTab !== "matriz" ? (
        <>
          <div className="flex items-center justify-between gap-4">
            <TextInput
              className="w-96"
              icon="search"
              placeholder="Buscar colaborador, email ou cargo"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <Button icon="userPlus" onClick={openCreateModal}>
              Cadastrar
            </Button>
          </div>

          <AccountRosterTable
            accounts={visibleAccounts}
            onEdit={openEditModal}
            onToggleStatus={toggleStatus}
          />
        </>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((role) => (
                <Button
                  className="h-9 px-3 text-xs"
                  key={role.value}
                  variant={activeRole === role.value ? "primary" : "secondary"}
                  onClick={() => setActiveRole(role.value)}
                >
                  {role.label}
                </Button>
              ))}
            </div>
            <RolePermissionMatrix matrix={roleMatrix} roles={roles} />
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs italic text-amiste-gray/70">
              DEV e CEO controlam a matriz completa. As regras abaixo orientam o acesso local por perfil.
            </div>
          </div>
          <RoleSummaryPanel summary={roleSummary} />
        </div>
      )}

      <EntityFormModal
        description="Dados de colaborador, perfil e status da conta."
        editingRecord={editingRecord}
        fields={ACCOUNT_FORM_FIELDS}
        open={modalOpen}
        snapshot={{}}
        title="Cadastro de Colaborador"
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
