import Button from "../atoms/Button.jsx";
import SelectInput from "../atoms/SelectInput.jsx";
import StatusPill from "../atoms/StatusPill.jsx";
import TextInput from "../atoms/TextInput.jsx";
import FormSection from "../molecules/FormSection.jsx";
import {
  buildSaleProductOptions,
  enrichSaleForm,
} from "../../services/salesService.js";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(Number(value || 0));
}

export default function QuickSaleForm({
  canMutate,
  errorMessage,
  formData,
  snapshot,
  onChange,
  onSubmit,
}) {
  const productOptions = buildSaleProductOptions(snapshot);
  const sale = enrichSaleForm(formData, snapshot);
  const selectedProduct = sale.product;

  function updateField(fieldName, value) {
    if (fieldName === "paymentStatus") {
      onChange({
        ...formData,
        generateCharge: value !== "pago",
        [fieldName]: value,
      });
      return;
    }

    onChange({
      ...formData,
      [fieldName]: value,
    });
  }

  function handleProductChange(value) {
    const option = productOptions.find((item) => item.value === value);

    onChange({
      ...formData,
      inventoryItem: value,
      unitValue: Number(option?.item?.price || 0),
    });
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase text-amiste-gray/55">Venda assistida</p>
          <h2 className="mt-1 font-display text-xl font-black text-amiste-black">Nova venda rapida</h2>
        </div>
        <StatusPill label={formData.paymentStatus} status={formData.paymentStatus} />
      </div>

      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        <FormSection eyebrow="Venda" title="Cliente e produto">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-xs font-black uppercase text-amiste-gray/60">Data</span>
              <TextInput
                disabled={!canMutate}
                type="date"
                value={formData.date || ""}
                onChange={(event) => updateField("date", event.target.value)}
              />
            </label>
            <label>
              <span className="mb-2 block text-xs font-black uppercase text-amiste-gray/60">Cliente</span>
              <SelectInput
                disabled={!canMutate}
                value={formData.clientId || ""}
                onChange={(event) => updateField("clientId", event.target.value)}
              >
                <option value="">Selecione</option>
                {(snapshot.clients || []).map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </SelectInput>
            </label>
          </div>

          <label>
            <span className="mb-2 block text-xs font-black uppercase text-amiste-gray/60">Produto</span>
            <SelectInput
              disabled={!canMutate}
              value={formData.inventoryItem || ""}
              onChange={(event) => handleProductChange(event.target.value)}
            >
              <option value="">Selecione</option>
              {productOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          </label>
        </FormSection>

        <FormSection eyebrow="Valores" title="Quantidade, preco e cobranca">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label>
              <span className="mb-2 block text-xs font-black uppercase text-amiste-gray/60">Quantidade</span>
              <TextInput
                disabled={!canMutate}
                min="1"
                type="number"
                value={formData.quantity || 1}
                onChange={(event) => updateField("quantity", Number(event.target.value || 1))}
              />
            </label>
            <label>
              <span className="mb-2 block text-xs font-black uppercase text-amiste-gray/60">Valor unitario</span>
              <TextInput
                disabled={!canMutate}
                min="0"
                step="0.01"
                type="number"
                value={formData.unitValue ?? ""}
                onChange={(event) => updateField("unitValue", Number(event.target.value || 0))}
              />
            </label>
            <label>
              <span className="mb-2 block text-xs font-black uppercase text-amiste-gray/60">Pagamento</span>
              <SelectInput
                disabled={!canMutate}
                value={formData.paymentStatus || "pendente"}
                onChange={(event) => updateField("paymentStatus", event.target.value)}
              >
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
              </SelectInput>
            </label>
          </div>
        </FormSection>

        {/* --- SECAO: RESUMO DO PRODUTO --- */}
        <div className="grid grid-cols-3 gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <div>
            <span className="text-xs font-black uppercase text-amiste-gray/55">Estoque atual</span>
            <strong className="mt-1 block text-lg font-black text-amiste-black">{sale.stock}</strong>
          </div>
          <div>
            <span className="text-xs font-black uppercase text-amiste-gray/55">Apos venda</span>
            <strong className={sale.willBreakStock ? "mt-1 block text-lg font-black text-amiste-red" : "mt-1 block text-lg font-black text-amiste-green"}>
              {sale.remainingStock}
            </strong>
          </div>
          <div>
            <span className="text-xs font-black uppercase text-amiste-gray/55">Total</span>
            <strong className="mt-1 block text-lg font-black text-amiste-black">{sale.totalLabel}</strong>
          </div>
        </div>

        <button
          className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-bold text-amiste-gray transition hover:border-amiste-red disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!canMutate}
          type="button"
          onClick={() => updateField("generateCharge", !formData.generateCharge)}
        >
          <span>Lancar no contas a receber</span>
          <span className={formData.generateCharge ? "text-amiste-green" : "text-amiste-red"}>
            {formData.generateCharge ? "Sim" : "Nao"}
          </span>
        </button>

        {selectedProduct ? (
          <p className="text-xs font-semibold text-amiste-gray/60">
            Produto selecionado: {selectedProduct.name} | preco base {formatCurrency(selectedProduct.price)}.
          </p>
        ) : null}

        {errorMessage ? (
          <div className="rounded-md border border-amiste-red/20 bg-amiste-red/10 px-4 py-3 text-sm font-bold text-amiste-red">
            {errorMessage}
          </div>
        ) : null}

        <footer className="flex justify-end">
          <Button disabled={!canMutate} icon="shoppingCart" type="submit">
            Registrar Venda
          </Button>
        </footer>
      </form>
    </section>
  );
}
