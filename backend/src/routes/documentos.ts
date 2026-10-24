import { Router } from "express";
import multer from "multer";
import { prisma } from "../prisma.ts";
import { autenticacao } from "../middlewares/autenticacao.ts";
import { permitirPerfis } from "../middlewares/permissao.ts";
import { upload } from "../config/upload.ts";
import { acessoDocumento } from "../middlewares/acessoDocumento.ts";
import { validarPdf } from "../config/validarPdf.ts";
import { salvarPdf } from "../config/salvarPdf.ts";
import { unlink, access } from "node:fs/promises";
import path from "node:path";

const router = Router();

router.use(autenticacao);
router.use(permitirPerfis("ADMIN", "PROFESSOR", "ALUNO"));


// ENVIAR DOCUMENTO PDF PARA UM CASO JURÍDICO
router.post(
  "/caso/:casoId/upload",

  // Verifica se o usuário tem acesso ao caso.
  acessoDocumento,

  // Recebe o arquivo e trata os erros do Multer.
  (req, res, next) => {
    upload.single("arquivo")(req, res, (erro) => {
      if (erro instanceof multer.MulterError) {
        if (erro.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({
            mensagem: "O arquivo PDF deve ter no máximo 5 MB."
          });
        }

        return res.status(400).json({
          mensagem: "Erro ao receber o arquivo. Verifique o envio."
        });
      }

      if (erro) {
        return res.status(400).json({
          mensagem: "Apenas arquivos PDF são permitidos."
        });
      }

      next();
    });
  },

  // Valida, salva e cadastra o documento.
  async (req, res) => {
    let nomeArquivoSalvo: string | null = null;

    try {
      // Verifica se um arquivo foi enviado.
      if (!req.file) {
        return res.status(400).json({
          mensagem: "Nenhum arquivo PDF foi enviado."
        });
      }

      // Verifica a assinatura inicial do PDF.
      if (!validarPdf(req.file)) {
        return res.status(400).json({
          mensagem: "O arquivo enviado não é um PDF válido."
        });
      }

      // Identifica o caso jurídico pela URL.
      const casoId = req.params.casoId;

      if (typeof casoId !== "string") {
        return res.status(400).json({
          mensagem: "ID do caso inválido."
        });
      }

      // Salva o PDF na pasta privada uploads.
      nomeArquivoSalvo = await salvarPdf(req.file);

      // Registra o documento no banco de dados.
      const documento = await prisma.documento.create({
        data: {
          nome: req.file.originalname,
          descricao: "Documento PDF enviado ao caso jurídico.",
          caminho: nomeArquivoSalvo,
          casoId
        }
      });

      return res.status(201).json({
        mensagem: "Documento enviado com sucesso!",
        documento
      });

    } catch (erro) {
      console.error("Erro ao enviar documento:", erro);

      // Remove o arquivo se ocorrer erro após o salvamento.
      if (nomeArquivoSalvo) {
        const caminhoCompleto = path.resolve(
          process.cwd(),
          "uploads",
          nomeArquivoSalvo
        );

        try {
          await unlink(caminhoCompleto);
        } catch (erroExclusao) {
          console.error(
            "Erro ao remover arquivo após falha:",
            erroExclusao
          );
        }
      }

      return res.status(500).json({
        mensagem: "Erro interno ao enviar documento."
      });
    }
  }
);


router.get("/:id/arquivo", async (req, res) => {
  try {
    const id = req.params.id;

    if (typeof id !== "string") {
      return res.status(400).json({
        mensagem: "ID do documento inválido."
      });
    }

    // Busca o documento e o caso jurídico relacionado.
    const documento = await prisma.documento.findUnique({
      where: { id },
      include: {
        caso: true
      }
    });

    if (!documento) {
      return res.status(404).json({
        mensagem: "Documento não encontrado."
      });
    }

    // Identifica o usuário autenticado.
    const usuario = res.locals.usuario;

    // Verifica se ele pode acessar o caso.
    const temPermissao =
      usuario.perfil === "ADMIN" ||
      (usuario.perfil === "ALUNO" &&
        documento.caso.alunoId === usuario.id) ||
      (usuario.perfil === "PROFESSOR" &&
        documento.caso.professorId === usuario.id);

    if (!temPermissao) {
      return res.status(404).json({
        mensagem: "Documento não encontrado."
      });
    }

    // Aceita apenas nomes gerados pelo sistema.
    const nomeArquivo = documento.caminho;

    const nomeSeguro =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/i;

    if (!nomeSeguro.test(nomeArquivo)) {
      return res.status(404).json({
        mensagem: "Arquivo PDF não disponível."
      });
    }

    // Localiza o arquivo na pasta privada.
    const caminhoCompleto = path.resolve(
      process.cwd(),
      "uploads",
      nomeArquivo
    );

    // Verifica se o arquivo existe.
    try {
      await access(caminhoCompleto);
    } catch {
      return res.status(404).json({
        mensagem: "Arquivo PDF não encontrado no servidor."
      });
    }

    // Envia o PDF para download.
    return res.download(
      caminhoCompleto,
      documento.nome,
      (erro) => {
        if (erro && !res.headersSent) {
          return res.status(500).json({
            mensagem: "Erro ao baixar o documento."
          });
        }
      }
    );

  } catch (erro) {
    console.error("Erro ao baixar documento:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao baixar documento."
    });
  }
});


// Cadastro manual desativado.
// Os documentos devem ser enviados pela rota de upload.
router.post("/", (_req, res) => {
  return res.status(410).json({
    mensagem:
      "Cadastro manual desativado. Envie o PDF pela rota /documentos/caso/:casoId/upload."
  });
});


 // LISTAR DOCUMENTOS DE UM CASO JURÍDICO
router.get("/caso/:casoId", async (req, res) => {
  try {
    const { casoId } = req.params;
    const usuario = res.locals.usuario;

    // Verifica se o caso existe.
    const caso = await prisma.casoJuridico.findUnique({
      where: { id: casoId }
    });

    if (!caso) {
      return res.status(404).json({
        mensagem: "Caso jurídico não encontrado."
      });
    }

    // Verifica se o usuário pode acessar esse caso.
    const temPermissao =
      usuario.perfil === "ADMIN" ||
      (usuario.perfil === "ALUNO" &&
        caso.alunoId === usuario.id) ||
      (usuario.perfil === "PROFESSOR" &&
        caso.professorId === usuario.id);

    if (!temPermissao) {
      return res.status(404).json({
        mensagem: "Caso jurídico não encontrado."
      });
    }

    // Busca os documentos vinculados ao caso.
    const documentos = await prisma.documento.findMany({
      where: { casoId },
      orderBy: { createdAt: "desc" }
    });

    return res.status(200).json({
      mensagem: "Documentos encontrados com sucesso!",
      total: documentos.length,
      documentos
    });

  } catch (erro) {
    console.error("Erro ao consultar documentos:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao consultar documentos."
    });
  }
});


 // ATUALIZAR INFORMAÇÕES DE UM DOCUMENTO
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, caminho } = req.body;
    const usuario = res.locals.usuario;

    // Procura o documento e o caso ao qual pertence.
    const documento = await prisma.documento.findUnique({
      where: { id },
      include: { caso: true }
    });

    if (!documento) {
      return res.status(404).json({
        mensagem: "Documento não encontrado."
      });
    }

    // Verifica a permissão de acesso ao caso.
    const caso = documento.caso;

    const temPermissao =
      usuario.perfil === "ADMIN" ||
      (usuario.perfil === "ALUNO" &&
        caso.alunoId === usuario.id) ||
      (usuario.perfil === "PROFESSOR" &&
        caso.professorId === usuario.id);

    if (!temPermissao) {
      return res.status(404).json({
        mensagem: "Documento não encontrado."
      });
    }

    // Valida os campos recebidos.
    if (
      (nome !== undefined &&
        (typeof nome !== "string" || !nome.trim())) ||
      (caminho !== undefined &&
        (typeof caminho !== "string" || !caminho.trim())) ||
      (descricao !== undefined &&
        descricao !== null &&
        typeof descricao !== "string")
    ) {
      return res.status(400).json({
        mensagem: "Dados inválidos para atualização."
      });
    }

    // Exige pelo menos um campo para atualizar.
    if (
      nome === undefined &&
      descricao === undefined &&
      caminho === undefined
    ) {
      return res.status(400).json({
        mensagem: "Informe pelo menos um campo para atualizar."
      });
    }

    // Atualiza apenas os campos informados.
    const documentoAtualizado = await prisma.documento.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome: nome.trim() }),
        ...(descricao !== undefined && {
          descricao: descricao === null ? null : descricao.trim()
        }),
        ...(caminho !== undefined && { caminho: caminho.trim() })
      }
    });

    return res.status(200).json({
      mensagem: "Documento atualizado com sucesso!",
      documento: documentoAtualizado
    });

  } catch (erro) {
    console.error("Erro ao atualizar documento:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao atualizar documento."
    });
  }
});


 // EXCLUIR UM DOCUMENTO
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = res.locals.usuario;

    // Procura o documento e seu caso jurídico.
    const documento = await prisma.documento.findUnique({
      where: { id },
      include: { caso: true }
    });

    if (!documento) {
      return res.status(404).json({
        mensagem: "Documento não encontrado."
      });
    }

    // Verifica se o usuário tem acesso ao caso.
    const caso = documento.caso;

    const temPermissao =
      usuario.perfil === "ADMIN" ||
      (usuario.perfil === "ALUNO" &&
        caso.alunoId === usuario.id) ||
      (usuario.perfil === "PROFESSOR" &&
        caso.professorId === usuario.id);

    if (!temPermissao) {
      return res.status(404).json({
        mensagem: "Documento não encontrado."
      });
    }

    // Exclui o registro do banco de dados.
    await prisma.documento.delete({
      where: { id }
    });

    return res.status(200).json({
      mensagem: "Documento excluído com sucesso!"
    });

  } catch (erro) {
    console.error("Erro ao excluir documento:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao excluir documento."
    });
  }
});


export default router;