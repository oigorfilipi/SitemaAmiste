import Button from "../../components/atoms/Button.jsx";
import AppIcon from "../../components/atoms/AppIcon.jsx";
import PageHeader from "../../components/molecules/PageHeader.jsx";
import ActiveAlertsPanel from "../../components/organisms/ActiveAlertsPanel.jsx";
import LatestOperationsTable from "../../components/organisms/LatestOperationsTable.jsx";
import MetricsGrid from "../../components/organisms/MetricsGrid.jsx";
import QuickAccessGrid from "../../components/organisms/QuickAccessGrid.jsx";
import { useDashboard } from "../../hooks/useDashboard.js";
import { canAccessPage } from "../../services/permissionService.js";

const SECONDARY_SHORTCUTS = [
  { id: "precos", label: "Precos", icon: "calculator", pageId: "precos" },
  { id: "estoque", label: "Estoque", icon: "boxes", pageId: "estoque" },
  { id: "clientes", label: "Clientes", icon: "users", pageId: "clientes" },
  { id: "opcoes", label: "Opcoes", icon: "layoutGrid", pageId: "opcoes" },
  { id: "etiquetas", label: "Etiquetas", icon: "tags", pageId: "etiquetas" },
  { id: "configuracoes", label: "Config", icon: "settings", pageId: "configuracoes" },
  { id: "wiki", label: "Wiki", icon: "wrench", pageId: "machines" },
  { id: "receitas", label: "Receitas", icon: "receipt", pageId: "insumos" },
  { id: "consertos", label: "Consertos", icon: "fileClock", pageId: "machines" },
];

export default function HomePage({ user, quickAccess, onSelectPage }) {
  const { data: dashboard } = useDashboard(user?.role || "VEN");
  const secondaryShortcuts = SECONDARY_SHORTCUTS.filter((shortcut) =>
    canAccessPage(user?.role || "VEN", shortcut.pageId)
  );

  return (
    <div className="space-y-6">
      {/* --- SECAO: BOAS-VINDAS --- */}
      <PageHeader
        actionIcon="plus"
        actionLabel="Novo Checklist"
        description="Bem-vindo ao painel de controle operacional."
        title={`Ola, ${user?.displayName || "usuario"}!`}
        onAction={() => onSelectPage("checklists")}
      />

      {/* --- SECAO: INDICADORES --- */}
      <MetricsGrid metrics={dashboard.metrics} />

      {/* --- SECAO: ATALHOS OPERACIONAIS --- */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-black text-amiste-black">Acesso rapido</h2>
          <p className="mt-1 text-sm italic text-amiste-gray/60">Centrais e rotas usadas no dia a dia.</p>
        </div>
        <Button icon="settings" variant="secondary" onClick={() => onSelectPage("opcoes")}>
          Ajustar opcoes
        </Button>
      </div>
      <QuickAccessGrid items={quickAccess} onSelectPage={onSelectPage} />

      {/* --- SECAO: ATALHOS SECUNDARIOS --- */}
      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-black text-amiste-black">Atalhos auxiliares</h2>
            <p className="mt-1 text-xs font-semibold text-amiste-gray/60">
              Paginas secundarias, hubs e areas de apoio liberadas para o perfil atual.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {secondaryShortcuts.map((shortcut) => (
            <button
              className="inline-flex h-8 items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-xs font-black text-amiste-gray transition hover:border-amiste-red hover:text-amiste-red"
              key={shortcut.id}
              type="button"
              onClick={() => onSelectPage(shortcut.pageId)}
            >
              <AppIcon name={shortcut.icon} size={14} />
              {shortcut.label}
            </button>
          ))}
        </div>
      </section>

      {/* --- SECAO: OPERACAO E ALERTAS --- */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <LatestOperationsTable operations={dashboard.latestOperations} onSelectPage={onSelectPage} />
        <ActiveAlertsPanel alerts={dashboard.alerts} onSelectPage={onSelectPage} />
      </div>
    </div>
  );
}
