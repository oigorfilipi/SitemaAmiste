import { useEffect, useMemo, useState } from "react";
import AppIcon from "../../components/atoms/AppIcon.jsx";
import Button from "../../components/atoms/Button.jsx";
import PasswordInput from "../../components/atoms/PasswordInput.jsx";
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
  buildAssignedRoleOptions,
  buildRoleOptions,
  buildRoleMatrixByScope,
  buildRoleSummary,
  filterAccountRows,
  normalizeAccountPayload,
  validateAccountPayload,
} from "../../services/accountService.js";
import { isCriticalAccountRole, verifyAdminPassword } from "../../services/adminSecurityService.js";
import { getRolePermissions, isDevPermissionLocked, updateRolePermission } from "../../services/permissionService.js";

export default function AccountsPage({ accessLevel = "OC", user }) {
  const [activeTab, setActiveTab] = useState("ativas");
  const [activeRole, setActiveRole] = useState("DEV");
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingPermissionChange, setPendingPermissionChange] = useState(null);
  const [permissionVersion, setPermissionVersion] = useState(0);
  const [rbacAdminPassword, setRbacAdminPassword] = useState("");
  const [rbacSecurityLoading, setRbacSecurityLoading] = useState(false);
  const [rbacSecurityMessage, setRbacSecurityMessage] = useState("");
  const { records, createRecord, updateRecord } = useCollection("accounts");
  const { records: optionRecords } = useCollection("options");
  const { records: systemSettings } = useCollection("systemSettings");
  const rolePermissions = useMemo(() => getRolePermissions(user?.role || "VEN"), [permissionVersion, user?.role]);
  const rbacModuleAccess = rolePermissions["module:accounts.rbac"] || "OC";
  const canManageAccounts = accessLevel === "AC" && rolePermissions["action:user.protectedEdit"] === "AC";
  const canCreate = canManageAccounts && rolePermissions["action:create"] === "AC";
  const canUpdate = canManageAccounts && ["AC", "UP"].includes(rolePermissions["action:update"]);
  const canUpload = rolePermissions["action:upload"] !== "OC";
  const canEditPermissions = accessLevel === "AC" && rbacModuleAccess === "AC" && rolePermissions["action:rbac.edit"] === "AC";
  const roleOptions = useMemo(() => buildRoleOptions(optionRecords, records), [optionRecords, records]);
  const matrixRoleOptions = useMemo(
    () => buildAssignedRoleOptions(records, roleOptions, [user?.role]),
    [records, roleOptions, user?.role]
  );
  const roles = useMemo(() => matrixRoleOptions.map((role) => role.value), [matrixRoleOptions]);
  const accountFormFields = useMemo(() => buildAccountFormFields(roleOptions), [roleOptions]);
  const accountFormSnapshot = useMemo(() => ({ accounts: records, systemSettings }), [records, systemSettings]);
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

  function applyPermissionChange(role, resourceId, access) {
    updateRolePermission(role, resourceId, access);
    setPermissionVersion((currentVersion) => currentVersion + 1);
  }

  function handlePermissionChange(role, resourceId, access) {
    if (!canEditPermissions) {
      return;
    }

    if (isDevPermissionLocked(role, resourceId)) {
      setPendingPermissionChange(null);
      setRbacAdminPassword("");
      setRbacSecurityMessage("O perfil DEV e protegido e permanece com acesso completo para evitar bloqueio do sistema.");
      return;
    }

    if (role === "DEV") {
      setPendingPermissionChange({ access, resourceId, role });
      setRbacAdminPassword("");
      setRbacSecurityMessage("Confirme a Senha ADM para alterar permissoes criticas do DEV.");
      return;
    }

    applyPermissionChange(role, resourceId, access);
  }

  async function confirmCriticalPermissionChange() {
    if (!pendingPermissionChange) {
      return;
    }

    setRbacSecurityLoading(true);

    try {
      await verifyAdminPassword({
        adminPassword: rbacAdminPassword,
        currentUser: user,
        settingsRecords: systemSettings,
      });
      applyPermissionChange(
        pendingPermissionChange.role,
        pendingPermissionChange.resourceId,
        pendingPermissionChange.access
      );
      setPendingPermissionChange(null);
      setRbacAdminPassword("");
      setRbacSecurityMessage("Permissao critica do DEV atualizada.");
    } catch (error) {
      setRbacSecurityMessage(error.message || "Nao foi possivel confirmar a Senha ADM.");
    } finally {
      setRbacSecurityLoading(false);
    }
  }

  function cancelCriticalPermissionChange() {
    setPendingPermissionChange(null);
    setRbacAdminPassword("");
    setRbacSecurityMessage("");
  }

  function renderRbacSecurityPanel() {
    if (!pendingPermissionChange && !rbacSecurityMessage) {
      return null;
    }

    return (
      <div className="rounded-2xl border border-amiste-yellow/40 bg-amiste-yellow/10 p-4">
        <strong className="block text-sm font-black text-amiste-black">Confirmacao de seguranca</strong>
        <p className="mt-1 text-sm font-semibold text-amiste-gray/70">{rbacSecurityMessage}</p>
        {pendingPermissionChange ? (
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
            <PasswordInput
              className="md:w-72"
              icon="shield"
              placeholder="Senha ADM"
              value={rbacAdminPassword}
              onChange={(event) => setRbacAdminPassword(event.target.value)}
            />
            <Button icon="shield" loading={rbacSecurityLoading} onClick={confirmCriticalPermissionChange}>
              Confirmar
            </Button>
            <Button disabled={rbacSecurityLoading} variant="secondary" onClick={cancelCriticalPermissionChange}>
              Cancelar
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  function renderAccountPermissionStep({ formData }) {
    const selectedRole = formData.role || roles[0] || "VEN";
    const roleLabel = roleOptions.find((role) => role.value === selectedRole)?.label || selectedRole;
    const selectedRoleList = [selectedRole];

    return (
      <div className="space-y-4">
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-black uppercase text-amiste-red">Etapa 2</span>
          <h3 className="mt-1 font-display text-lg font-black text-amiste-black">Permissoes para {roleLabel}</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-amiste-gray/70">
            Revise o acesso do cargo selecionado antes de salvar o colaborador. Alteracoes feitas aqui
            atualizam a matriz do cargo e passam a valer para usuarios com essa mesma funcao.
          </p>
        </section>

        <section className="space-y-3">
          <div>
            <h4 className="font-display text-base font-black text-amiste-black">Matriz RBAC Geral</h4>
            <p className="mt-1 text-xs font-semibold text-amiste-gray/60">
              Paginas, abas, modulos e acoes principais.
            </p>
          </div>
          <RolePermissionMatrix
            editable={canEditPermissions}
            matrix={buildRoleMatrixByScope("base", selectedRoleList, roleOptions)}
            roles={selectedRoleList}
            onChange={handlePermissionChange}
          />
        </section>

        <section className="space-y-3">
          <div>
            <h4 className="font-display text-base font-black text-amiste-black">Matriz RBAC Granular</h4>
            <p className="mt-1 text-xs font-semibold text-amiste-gray/60">
              Secoes, campos sensiveis e acoes especificas dentro das paginas.
            </p>
          </div>
          <RolePermissionMatrix
            editable={canEditPermissions}
            matrix={buildRoleMatrixByScope("granular", selectedRoleList, roleOptions)}
            roles={selectedRoleList}
            onChange={handlePermissionChange}
          />
        </section>

        {renderRbacSecurityPanel()}
      </div>
    );
  }

  function canManageAccountTarget(account) {
    return !isCriticalAccountRole(account?.role) || isCriticalAccountRole(user?.role);
  }

  function canManageAccountPayload(payload) {
    if (isCriticalAccountRole(editingRecord?.role) && !isCriticalAccountRole(user?.role)) {
      return false;
    }

    return !isCriticalAccountRole(payload?.role) || isCriticalAccountRole(user?.role);
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
          <div className="flex items-center gap-4">
            <TextInput
              className="w-96"
              icon="search"
              placeholder="Buscar colaborador, email ou cargo"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
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
              {matrixRoleOptions.map((role) => (
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
            {renderRbacSecurityPanel()}
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
        primaryStepLabel="Dados do colaborador"
        secondaryStepContent={renderAccountPermissionStep}
        secondaryStepDescription="Defina ou revise as permissoes do cargo antes de concluir o cadastro."
        secondaryStepLabel="Permissoes"
        size="fullscreen"
        snapshot={accountFormSnapshot}
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
