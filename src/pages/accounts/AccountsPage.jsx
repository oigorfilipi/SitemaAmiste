import { useEffect, useMemo, useState } from "react";
import AppIcon from "../../components/atoms/AppIcon.jsx";
import Button from "../../components/atoms/Button.jsx";
import TextInput from "../../components/atoms/TextInput.jsx";
import EntityGroupTabs from "../../components/molecules/EntityGroupTabs.jsx";
import PageHeader from "../../components/molecules/PageHeader.jsx";
import AccountRosterTable from "../../components/organisms/AccountRosterTable.jsx";
import EntityFormModal from "../../components/organisms/EntityFormModal.jsx";
import MetricsGrid from "../../components/organisms/MetricsGrid.jsx";
import RolePermissionMatrix from "../../components/organisms/RolePermissionMatrix.jsx";
import RoleSummaryPanel from "../../components/organisms/RoleSummaryPanel.jsx";
import TableEmptyState from "../../components/molecules/TableEmptyState.jsx";
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
  validateAccountPayload,
} from "../../services/accountService.js";
import { ROLE_PERMISSIONS, updateRolePermission } from "../../services/permissionService.js";

export default function AccountsPage({ user }) {
  const [activeTab, setActiveTab] = useState("ativas");
  const [activeRole, setActiveRole] = useState("DEV");
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [permissionVersion, setPermissionVersion] = useState(0);
  const { records, createRecord, updateRecord } = useCollection("accounts");
  const canManageAccounts = user?.role === "DEV" || user?.role === "CEO";
  const canEditPermissions = user?.role === "DEV";
  const rows = useMemo(() => buildAccountRows(records), [records]);
  const metrics = useMemo(() => buildAccountMetrics(rows), [rows]);
  const visibleAccounts = useMemo(
    () => filterAccountRows(rows, activeTab, searchTerm),
    [activeTab, rows, searchTerm]
  );
  const roleMatrix = useMemo(() => buildRoleMatrix(), [permissionVersion]);
  const roleSummary = useMemo(() => buildRoleSummary(activeRole), [activeRole, permissionVersion]);
  const roles = Object.keys(ROLE_PERMISSIONS);

  useEffect(() => {
    function refreshPermissionVersion() {
      setPermissionVersion((currentVersion) => currentVersion + 1);
    }

    window.addEventListener("amiste-permissions-change", refreshPermissionVersion);

    return () => {
      window.removeEventListener("amiste-permissions-change", refreshPermissionVersion);
    };
  }, []);

  if (!canManageAccounts) {
    return (
      <TableEmptyState
        description="Registro de colaborador e gestao de contas sao exclusivos de DONO e DEV."
        icon="shield"
        title="Acesso negado"
      />
    );
  }

  function openCreateModal() {
    setErrorMessage("");
    setEditingRecord(null);
    setModalOpen(true);
  }

  function openEditModal(account) {
    setErrorMessage("");
    setEditingRecord(records.find((record) => record.id === account.id) || account);
    setModalOpen(true);
  }

  async function handleSubmit(payload) {
    const normalizedPayload = normalizeAccountPayload(payload, editingRecord);

    try {
      if (editingRecord) {
        await updateRecord(editingRecord.id, normalizedPayload);
      } else {
        await createRecord(normalizedPayload);
      }

      setModalOpen(false);
      setEditingRecord(null);
    } catch (error) {
      setErrorMessage(error.message || "Nao foi possivel salvar o colaborador.");
      throw error;
    }
  }

  async function toggleStatus(account) {
    setErrorMessage("");

    try {
      await updateRecord(account.id, {
        ...account,
        status: account.status === "ativo" ? "desativado" : "ativo",
      });
    } catch (error) {
      setErrorMessage(error.message || "Nao foi possivel alterar o status do colaborador.");
    }
  }

  function handlePermissionChange(role, resourceId, access) {
    if (!canEditPermissions) {
      return;
    }

    updateRolePermission(role, resourceId, access);
    setPermissionVersion((currentVersion) => currentVersion + 1);
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

      {errorMessage ? (
        <div className="rounded-md border border-amiste-red/20 bg-amiste-red/10 px-4 py-3 text-sm font-bold text-amiste-red">
          {errorMessage}
        </div>
      ) : null}

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
            <RolePermissionMatrix
              editable={canEditPermissions}
              matrix={roleMatrix}
              roles={roles}
              onChange={handlePermissionChange}
            />
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs italic text-amiste-gray/70">
              {canEditPermissions
                ? "Alteracoes salvas localmente e aplicadas imediatamente a paginas, abas, modulos e acoes."
                : "Somente DEV altera a matriz. DONO visualiza a estrutura e continua com permissao administrativa protegida."}
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
        size="fullscreen"
        snapshot={{ accounts: records }}
        title="Registro de Colaborador"
        validate={validateAccountPayload}
        asideContent={(
          <aside className="flex min-h-[520px] flex-col justify-between rounded-md bg-amiste-red p-6 text-white">
            <div>
              <div className="grid size-14 place-items-center rounded-md bg-white text-amiste-red">
                <AppIcon name="userPlus" size={30} />
              </div>
              <h2 className="mt-6 font-display text-2xl font-black">Registro Corporativo</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-white/75">
                Cadastro restrito a DONO e DEV, com senha provisoria e validacoes antes do primeiro acesso.
              </p>
            </div>
            <span className="text-xs font-bold text-white/60">Fluxo local preparado para convite por e-mail e WhatsApp.</span>
          </aside>
        )}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
