import LoginAccountOption from "../molecules/LoginAccountOption.jsx";
import TableEmptyState from "../molecules/TableEmptyState.jsx";

export default function LoginAccountList({ accounts, isLoading, selectedId, onSelect }) {
  if (isLoading) {
    return (
      <TableEmptyState
        description="Validando sessao e colaboradores ativos."
        icon="users"
        title="Carregando contas"
      />
    );
  }

  if (!accounts.length) {
    return (
      <TableEmptyState
        description="Cadastre uma conta ativa na base local para liberar acesso."
        icon="users"
        title="Nenhuma conta ativa"
      />
    );
  }

  return (
    <section className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
      {/* --- SECAO: CONTAS ATIVAS --- */}
      {accounts.map((account) => (
        <LoginAccountOption
          account={account}
          active={selectedId === account.id}
          key={account.id}
          onSelect={onSelect}
        />
      ))}
    </section>
  );
}
