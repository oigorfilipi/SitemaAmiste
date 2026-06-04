const INLINE_IMAGE_MAX_BYTES = 750 * 1024;

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  return `${Math.ceil(bytes / 1024)} KB`;
}

export function formatInlineImageLimit() {
  return formatBytes(INLINE_IMAGE_MAX_BYTES);
}

export function assertInlineImageFile(file) {
  if (!file) {
    return;
  }

  if (!String(file.type || "").startsWith("image/")) {
    throw new Error("Selecione um arquivo de imagem valido.");
  }

  /* --- SECAO: PROTECAO DO BANCO LOCAL ---
   * Imagens inline ficam no banco local em base64. O limite impede novo estouro
   * de quota enquanto os arquivos definitivos ainda nao usam storage externo.
   */
  if (file.size > INLINE_IMAGE_MAX_BYTES) {
    throw new Error(`Imagem muito grande. Use uma imagem de ate ${formatInlineImageLimit()} ou informe uma URL.`);
  }
}
