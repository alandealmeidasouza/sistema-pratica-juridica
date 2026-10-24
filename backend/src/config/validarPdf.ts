
export function validarPdf(arquivo: Express.Multer.File): boolean {
  // Verifica se o arquivo possui conteúdo.
  if (!arquivo.buffer || arquivo.buffer.length < 5) {
    return false;
  }

  // Lê os cinco primeiros bytes do arquivo.
  const assinatura = arquivo.buffer
    .subarray(0, 5)
    .toString("ascii");

  // Arquivos PDF normalmente começam com "%PDF-".
  return assinatura === "%PDF-";
}
