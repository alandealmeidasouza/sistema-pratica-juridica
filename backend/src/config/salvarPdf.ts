
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function salvarPdf(
  arquivo: Express.Multer.File
): Promise<string> {
  // Define a pasta privada dos documentos.
  const pastaUploads = path.resolve(process.cwd(), "uploads");

  // Garante que a pasta exista.
  await mkdir(pastaUploads, { recursive: true });

  // Gera um nome único para evitar conflitos.
  const nomeArquivo = `${randomUUID()}.pdf`;

  // Monta o caminho completo do arquivo.
  const caminhoCompleto = path.join(pastaUploads, nomeArquivo);

  // Grava o conteúdo do PDF no servidor.
  await writeFile(caminhoCompleto, arquivo.buffer, {
    flag: "wx"
  });

  // Retorna apenas o nome do arquivo.
  return nomeArquivo;
}
