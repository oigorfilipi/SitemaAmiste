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
  ACCOUNT_TABS,
  buildAccountFormFields,
  buildAccountMetrics,
  buildAccountRows,
  buildRoleOptions,
  buildRoleMatrixByScope,
  buildRoleSummary,
  filterAccountRows,
  normalizeAccountPayload,
  validateAccountPayload,
} from "../../services/accountService.js";
import { getRolePermissions, updateRolePermission } from "../../services/permissionService.js";

export default function AccountsPage({ accessLevel = "OC", user }) {
  const [activeTab, setActiveTab] = useState("ativas");
  const [activeRole, setActiveRole] = useState("DEV");
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [permissionVersion, setPermissionVersion] = useState(0);
  const { records, createRecord, updateRecord } = useCollection("accounts");
  const { records: optionRecords } = useCollection("options");
  const rolePermissions = useMemo(() => getRolePermissions(user?.role || "VEN"), [permissionVersion, user?.role]);
  const rbacModuleAccess = rolePermissions["module:accounts.rbac"] || "OC";
  const canManageAccounts = accessLevel === "AC" && rolePermissions["action:user.protectedEdit"] === "AC";
  const canCreate = canManageAccounts && rolePermissions["action:create"] === "AC";
  const canUpdate = canManageAccounts && ["AC", "UP"].includes(rolePermissions["action:update"]);
  const canUpload = rolePermissions["action:upload"] !== "OC";
  const canEditPermissions = accessLevel === "AC" && rbacModuleAccess === "AC" && rolePermissions["action:rbac.edit"] === "AC";
  const roleOptions = useMemo(() => buildRoleOptions(optionRecords, records), [optionRecords, records]);
  const roles = useMemo(() => roleOptions.map((role) => role.value), [roleOptions]);
  const accountFormFields = useMemo(() => buildAccountFormFields(roleOptions), [roleOptions]);
  const rows = useMemo(() => buildAccountRows(records, roleOptions), [records, roleOptions]);
  const metrics = useMemo(() => buildAccountMetrics(rows), [rows]);
  const accountTabs = useMemo(
    () => ACCOUNT_TABS.filter((tab) => !["matriz", "granular"].includes(tab.id) || rbacModuleAccess !== "OC"),
    [rbacModuleAccess]
  );
  const activeVisibleTab = accountTabs.some((tab) => tab.id === activeTab)
    ? activeTab
    : accountTabs[0]?.id || "ativas";
  const visibleAccounts = useMemo(
    () => filterAccountRows(rows, activeVisibleTab, searchTerm),
    [activeVisibleTab, rows, searchTerm]
  );
  const roleMatrix = useMemo(() => buildRoleMatrixByScope("base", roles, roleOptions), [permissionVersion, roleOptions, roles]);
  const granularMatrix = useMemo(() => buildRoleMatrixByScope("granular", roles, roleOptions), [permissionVersion, roleOptions, roles]);
  const roleSummary = useMemo(() => buildRoleSummary(activeRole, roleOptions), [activeRole, permissionVersion, roleOptions]);

  useEffect(() => {
    function refreshPermissionVersion() {
      setPermissionVersion((currentVersion) => currentVersion + 1);
    }

    window.addEventListener("amiste-permissions-change", refreshPermissionVersion);

    return () => {
      window.removeEventListener("amiste-permissions-change", refreshPermissionVersion);
    };
  }, []);

  useEffect(() => {
    if (!accountTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(accountTabs[0]?.id || "ativas");
    }
  }, [accountTabs, activeTab]);

  useEffect(() => {
    if (roles.length && !roles.includes(activeRole)) {
      setActiveRole(roles[0]);
    }
  }, [activeRole, roles]);

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
    if (!canCreate) {
      return;
    }

    setErrorMessage("");
    setEditingRecord(null);
    setModalOpen(true);
  }

  function openEditModal(account) {
    if (!canUpdate || !canManageAccountTarget(account)) {
      setErrorMessage("Somente DEV pode alterar contas do perfil DEV.");
      return;
    }

    setErrorMessage("");
    setEditingRecord(records.find((record) => record.id === account.id) || account);
    setModalOpen(true);
  }

  async function handleSubmit(payload) {
    if ((editingRecord && !canUpdate) || (!editingRecord && !canCreate)) {
      setErrorMessage("Voce nao tem permissao para salvar colaboradores.");
      return;
    }

    const normalizedPayload = normalizeAccountPayload(payload, editingRecord);

    if (!canManageAccountPayload(normalizedPayload)) {
      setErrorMessage("Somente DEV pode criar ou atribuir o perfil DEV.");
      return;
    }

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
    if (!canUpdate || !canManageAccountTarget(account)) {
      setErrorMessage("Somente DEV pode alterar contas do perfil DEV.");
      return;
    }

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

  function canManageAccountTarget(account) {
    return account?.role !== "DEV" || user?.role === "DEV";
  }

  function canManageAccountPayload(payload) {
    if (editingRecord?.role === "DEV" && user?.role !== "DEV") {
      return false;
    }

    return payload?.role !== "DEV" || user?.role === "DEV";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actionIcon="userPlus"
        actionLabel={canCreate ? "Cadastrar Colaborador" : ""}
        description="Controle de acessos, permissoes e colaboradores da plataforma."
        icon="userPlus"
        title="Gestao de Contas"
        onAction={openCreateModal}
      />

      {/* --- SECAO: INDICADORES DE EQUIPE --- */}
      <MetricsGrid metrics={metrics} />

      {errorMessage ? (
        <div className="rounded-2xl border border-amiste-red/20 bg-amiste-red/10 px-4 py-3 text-sm font-bold text-amiste-red">
          {errorMessage}
        </div>
      ) : null}

      {/* --- SECAO: ABAS DE CONTAS --- */}
      <EntityGroupTabs activeGroup={activeVisibleTab} groups={accountTabs} onSelectGroup={setActiveTab} />

      {activeVisibleTab !== "matriz" && activeVisibleTab !== "granular" ? (
        <>
          <div className="flex items-center justify-between gap-4">
            <TextInput
              className="w-96"
              icon="search"
              placeholder="Buscar colaborador, email ou cargo"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            {canCreate ? (
              <Button icon="userPlus" onClick={openCreateModal}>
                Cadastrar
              </Button>
            ) : null}
          </div>

          <AccountRosterTable
            accounts={visibleAccounts}
            canManageAccount={canManageAccountTarget}
            canToggleStatus={canUpdate}
            canUpdate={canUpdate}
            onEdit={openEditModal}
            onToggleStatus={toggleStatus}
          />
        </>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-amiste-gray shadow-sm">
              {activeVisibleTab === "granular"
                ? "Matriz RBAC Granular: controle secoes, campos sensiveis e acoes especificas dentro das paginas."
                : "Matriz RBAC principal: controle acesso por paginas, abas, modulos e acoes globais."}
            </div>
            <div className="flex flex-wrap gap-2">
              {roleOptions.map((role) => (
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
              matrix={activeVisibleTab === "granular" ? granularMatrix : roleMatrix}
              roles={roles}
              onChange={handlePermissionChange}
            />
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-xs italic text-amiste-gray/70">
              {canEditPermissions
                ? "Alteracoes salvas localmente e aplicadas imediatamente a paginas, abas, modulos e acoes."
                : "Somente DEV altera a matriz. DONO visualiza a estrutura e continua com permissao administrativa protegida."}
            </div>
          </div>
          <RoleSummaryPanel summary={roleSummary} />
        </div>
      )}

      <EntityFormModal
        canUpload={canUpload}
        description="Dados de colaborador, perfil e status da conta."
        editingRecord={editingRecord}
        fields={accountFormFields}
        open={modalOpen}
        size="fullscreen"
        snapshot={{ accounts: records }}
        title="Registro de Colaborador"
        validate={validateAccountPayload}
        asideContent={(
          <aside className="flex min-h-[520px] flex-col justify-between rounded-2xl bg-amiste-red p-6 text-white">
            <div>
              <div className="grid size-14 place-items-center rounded-2xl bg-white text-amiste-red">
                <AppIcon name="userPlus" size={30} />
              </div>
              <h2 className="mt-6 font-display text-2xl font-black">Registro Corporativo</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-white/75">
                Cadastro restrito a DONO e DEV, com senha provisoria e validacoes antes do primeiro acesso.
              </p>
            </div>
            <span className="text-xs font-bold text-white/60">Contas sao criadas apenas por DONO e DEV.</span>
          </aside>
        )}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
