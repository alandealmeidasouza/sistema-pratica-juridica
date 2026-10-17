import { Router } from "express";
import { prisma } from "../prisma.ts";
import { autenticacao } from "../middlewares/autenticacao.ts";
import { permitirPerfis } from "../middlewares/permissao.ts";

const router = Router();

router.use(autenticacao);
router.use(permitirPerfis("ADMIN", "PROFESSOR", "ALUNO"));


 // CADASTRAR INFORMAÇÕES DE UM DOCUMENTO
router.post("/", async (req, res) => {
  try {
    const { nome, descricao, caminho, casoId } = req.body;
    const usuario = res.locals.usuario;

    // Valida os campos obrigatórios.
    if (
      typeof nome !== "string" ||
      !nome.trim() ||
      typeof caminho !== "string" ||
      !caminho.trim() ||
      typeof casoId !== "string" ||
      !casoId.trim()
    ) {
      return res.status(400).json({
        mensagem: "Nome, caminho e ID do caso são obrigatórios."
      });
    }

    // Valida a descrição opcional.
    if (
      descricao !== undefined &&
      descricao !== null &&
      typeof descricao !== "string"
    ) {
      return res.status(400).json({
        mensagem: "A descrição deve ser um texto."
      });
    }

    // Verifica se o caso existe.
    const caso = await prisma.casoJuridico.findUnique({
      where: { id: casoId }
    });

    if (!caso) {
      return res.status(404).json({
        mensagem: "Caso jurídico não encontrado."
      });
    }

    // Verifica se o usuário tem acesso ao caso.
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

    // Cadastra as informações do documento.
    const documento = await prisma.documento.create({
      data: {
        nome: nome.trim(),
        descricao:
          typeof descricao === "string" ? descricao.trim() : null,
        caminho: caminho.trim(),
        casoId: caso.id
      }
    });

    return res.status(201).json({
      mensagem: "Documento cadastrado com sucesso!",
      documento
    });

  } catch (erro) {
    console.error("Erro ao cadastrar documento:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao cadastrar documento."
    });
  }
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