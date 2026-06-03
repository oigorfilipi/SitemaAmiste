import { cn } from "../../utils/cn.js";

const STATUS_STYLES = {
  finalizado: "bg-amiste-green/12 text-amiste-green ring-amiste-green/20",
  concluido: "bg-amiste-green/12 text-amiste-green ring-amiste-green/20",
  ativo: "bg-amiste-green/12 text-amiste-green ring-amiste-green/20",
  ativado: "bg-amiste-green/12 text-amiste-green ring-amiste-green/20",
  pago: "bg-amiste-green/12 text-amiste-green ring-amiste-green/20",
  resolvido: "bg-amiste-green/12 text-amiste-green ring-amiste-green/20",
  assinado: "bg-amiste-green/12 text-amiste-green ring-amiste-green/20",
  pronto: "bg-amiste-green/12 text-amiste-green ring-amiste-green/20",
  entregue: "bg-amiste-green/12 text-amiste-green ring-amiste-green/20",
  pendente: "bg-amiste-yellow/45 text-yellow-900 ring-amiste-yellow/60",
  pedir: "bg-amiste-yellow/45 text-yellow-900 ring-amiste-yellow/60",
  aguardando: "bg-amiste-yellow/45 text-yellow-900 ring-amiste-yellow/60",
  orcamento: "bg-amiste-yellow/45 text-yellow-900 ring-amiste-yellow/60",
  andamento: "bg-amiste-yellow/45 text-yellow-900 ring-amiste-yellow/60",
  rascunho: "bg-amiste-blue/10 text-amiste-blue ring-amiste-blue/20",
  triagem: "bg-amiste-blue/10 text-amiste-blue ring-amiste-blue/20",
  manutencao: "bg-amiste-blue/10 text-amiste-blue ring-amiste-blue/20",
  abandonado: "bg-amiste-red/10 text-amiste-red ring-amiste-red/20",
  cancelado: "bg-amiste-red/10 text-amiste-red ring-amiste-red/20",
  desativado: "bg-amiste-red/10 text-amiste-red ring-amiste-red/20",
  atrasado: "bg-amiste-red/10 text-amiste-red ring-amiste-red/20",
  quebra: "bg-amiste-red/10 text-amiste-red ring-amiste-red/20",
  automatico: "bg-zinc-100 text-zinc-600 ring-zinc-200",
};

export default function StatusPill({ status, label = status, className = "", ...props }) {
  const normalizedStatus = String(status || "").toLowerCase();

  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full px-3 text-xs font-bold uppercase tracking-normal ring-1",
        STATUS_STYLES[normalizedStatus] || STATUS_STYLES.automatico,
        className
      )}
      {...props}
    >
      {label}
    </span>
  );
}
