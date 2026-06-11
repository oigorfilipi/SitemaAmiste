import Button from "../atoms/Button.jsx";
import SelectInput from "../atoms/SelectInput.jsx";
import TextArea from "../atoms/TextArea.jsx";
import TextInput from "../atoms/TextInput.jsx";
import Modal from "../molecules/Modal.jsx";
import FormSection from "../molecules/FormSection.jsx";
import {
  buildInventoryLocationProductOptions,
} from "../../services/inventoryLocationService.js";

export default function InventoryLocationModal({
  errorMessage = "",
  formData,
  open,
  snapshot,
  title,
  onChange,
  onClose,
  onSubmit,
}) {
  const productOptions = buildInventoryLocationProductOptions(snapshot);
  const products = Array.isArray(formData.products) ? formData.products : [];

  function updateField(fieldName, value) {
    onChange({
      ...formData,
      [fieldName]: value,
    });
  }

  function updateProduct(index, fieldName, value) {
    onChange({
      ...formData,
      products: products.map((product, productIndex) =>
        productIndex === index ? { ...product, [fieldName]: value } : product
      ),
    });
  }

  function addProduct() {
    onChange({
      ...formData,
      products: [...products, { productRef: "", quantity: 1 }],
    });
  }

  function removeProduct(index) {
    const nextProducts = products.filter((_, productIndex) => productIndex !== index);

    onChange({
      ...formData,
      products: nextProducts.length ? nextProducts : [{ productRef: "", quantity: 1 }],
    });
  }

  return (
    <Modal
      description="Organize produtos e maquinas que ficam em outro ponto sem alterar o estoque principal."
      open={open}
      size="wide"
      title={title}
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <FormSection eyebrow="Identificacao" icon="boxes" title="Nome e maquina vinculada">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px]">
            <label>
              <span className="mb-2 block text-xs font-black uppercase text-amiste-gray/60">Nome do estoque</span>
              <TextInput
                placeholder="Ex: Operacao Uberaba"
                value={formData.name || ""}
                onChange={(event) => updateField("name", event.target.value)}
              />
            </label>
            <label>
              <span className="mb-2 block text-xs font-black uppercase text-amiste-gray/60">Maquina vinculada</span>
              <SelectInput
                value={formData.machineId || ""}
                onChange={(event) => updateField("machineId", event.target.value)}
              >
                <option value="">Selecione a maquina</option>
                {(snapshot.machines || []).map((machine) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.name}
                  </option>
                ))}
              </SelectInput>
            </label>
            <label>
              <span className="mb-2 block text-xs font-black uppercase text-amiste-gray/60">Quantidade</span>
              <TextInput
                min="1"
                placeholder="Ex: 18"
                type="number"
                value={formData.machineQuantity || 1}
                onChange={(event) => updateField("machineQuantity", event.target.value)}
              />
            </label>
          </div>
        </FormSection>

        <FormSection eyebrow="Produtos" icon="packagePlus" title="Produtos neste estoque">
          <div className="space-y-3">
            {products.map((product, index) => (
              <div className="grid grid-cols-1 gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3 md:grid-cols-[minmax(0,1fr)_140px_96px]" key={`location-product-${index + 1}`}>
                <label>
                  <span className="mb-2 block text-xs font-black uppercase text-amiste-gray/60">Produto</span>
                  <SelectInput
                    value={product.productRef || ""}
                    onChange={(event) => updateProduct(index, "productRef", event.target.value)}
                  >
                    <option value="">Selecione o produto</option>
                    {productOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                </label>
                <label>
                  <span className="mb-2 block text-xs font-black uppercase text-amiste-gray/60">Quantidade</span>
                  <TextInput
                    min="1"
                    placeholder="Ex: 20"
                    type="number"
                    value={product.quantity || 1}
                    onChange={(event) => updateProduct(index, "quantity", event.target.value)}
                  />
                </label>
                <div className="flex items-end">
                  <Button className="h-9 w-full px-3 text-xs" icon="trash" variant="secondary" onClick={() => removeProduct(index)}>
                    Remover
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button className="mt-3 w-full" icon="plus" variant="secondary" onClick={addProduct}>
            Adicionar produto
          </Button>
        </FormSection>

        <label className="block">
          <span className="mb-2 block text-xs font-black uppercase text-amiste-gray/60">Observacoes</span>
          <TextArea
            placeholder="Ex: Produtos enviados para operacao externa, responsavel local, periodicidade de reposicao."
            value={formData.notes || ""}
            onChange={(event) => updateField("notes", event.target.value)}
          />
        </label>

        {errorMessage ? (
          <div className="rounded-2xl border border-amiste-red/20 bg-amiste-red/10 px-4 py-3 text-sm font-bold text-amiste-red">
            {errorMessage}
          </div>
        ) : null}

        <footer className="flex flex-wrap justify-end gap-3 border-t border-zinc-100 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button icon="checkSquare" type="submit">
            Salvar estoque
          </Button>
        </footer>
      </form>
    </Modal>
  );
}
