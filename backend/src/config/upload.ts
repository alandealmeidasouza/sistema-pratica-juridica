
import multer from "multer";
import path from "node:path";
import fs from "node:fs";

// Pasta privada onde os documentos serão armazenados.
const pastaUploads = path.resolve(process.cwd(), "uploads");

// Cria a pasta caso ela ainda não exista.
fs.mkdirSync(pastaUploads, { recursive: true });

// Configura onde e com qual nome o arquivo será salvo.
const armazenamento = multer.memoryStorage();

// Verifica o tipo informado no envio.
const filtroArquivo: multer.Options["fileFilter"] = (
  _req,
  arquivo,
  callback
) => {
  const extensao = path.extname(arquivo.originalname).toLowerCase();

  if (
    arquivo.mimetype !== "application/pdf" ||
    extensao !== ".pdf"
  ) {
    return callback(new Error("Apenas arquivos PDF são permitidos."));
  }

  callback(null, true);
};

// Configura o Multer.
export const upload = multer({
  storage: armazenamento,
  fileFilter: filtroArquivo,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  }
});
