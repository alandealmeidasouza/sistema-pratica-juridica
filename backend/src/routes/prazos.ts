import { Router } from "express";
import { prisma } from "../prisma.ts";
import { autenticacao } from "../middlewares/autenticacao.ts";
import { permitirPerfis } from "../middlewares/permissao.ts";

const router = Router();

// Todas as rotas de prazos exigem autenticação.
router.use(autenticacao);

router.use(permitirPerfis("ALUNO", "PROFESSOR", "ADMIN"));


// CADASTRAR PRAZO JURÍDICO
router.post("/", async (req, res) => {
  try {
    const { titulo, descricao, dataLimite, casoId } = req.body;
    const usuario = res.locals.usuario;

    // Valida os campos obrigatórios.
    if (
      typeof titulo !== "string" ||
      !titulo.trim() ||
      typeof casoId !== "string" ||
      !casoId.trim() ||
      typeof dataLimite !== "string"
    ) {
      return res.status(400).json({
        mensagem: "Título, data limite e ID do caso são obrigatórios."
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

    // Exige uma data no formato ISO com horário e fuso.
    const formatoData =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

    const data = new Date(dataLimite);

    if (!formatoData.test(dataLimite) || Number.isNaN(data.getTime())) {
      return res.status(400).json({
        mensagem: "Informe uma data válida no formato ISO 8601."
      });
    }

    // Busca o caso jurídico.
    const caso = await prisma.casoJuridico.findUnique({
      where: { id: casoId }
    });

    if (!caso) {
      return res.status(404).json({
        mensagem: "Caso jurídico não encontrado."
      });
    }

    // Verifica se o usuário está vinculado ao caso.
    const temPermissao =
      usuario.perfil === "ADMIN" ||
      (usuario.perfil === "ALUNO" && caso.alunoId === usuario.id) ||
      (usuario.perfil === "PROFESSOR" &&
        caso.professorId === usuario.id);

    if (!temPermissao) {
      return res.status(404).json({
        mensagem: "Caso jurídico não encontrado."
      });
    }

    // Cadastra o prazo.
    const prazo = await prisma.prazo.create({
      data: {
        titulo: titulo.trim(),
        descricao:
          typeof descricao === "string" ? descricao.trim() : null,
        dataLimite: data,
        casoId: caso.id
      }
    });

    return res.status(201).json({
      mensagem: "Prazo cadastrado com sucesso!",
      prazo
    });

  } catch (erro) {
    console.error("Erro ao cadastrar prazo:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao cadastrar prazo."
    });
  }
});


// LISTAR PRAZOS DE UM CASO JURÍDICO
router.get("/caso/:casoId", async (req, res) => {
  try {
    const casoId = req.params.casoId as string;
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

    // Busca os prazos do caso, começando pelo mais próximo.
    const prazos = await prisma.prazo.findMany({
      where: { casoId },
      orderBy: { dataLimite: "asc" }
    });

    return res.status(200).json({
      mensagem: "Prazos encontrados com sucesso!",
      total: prazos.length,
      prazos
    });

  } catch (erro) {
    console.error("Erro ao listar prazos:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao listar prazos."
    });
  }
});


// ATUALIZAR PRAZO JURÍDICO
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const { titulo, descricao, dataLimite, concluido } = req.body;
    const usuario = res.locals.usuario;

    // Busca o prazo e o caso ao qual pertence.
    const prazo = await prisma.prazo.findUnique({
      where: { id },
      include: { caso: true }
    });

    if (!prazo) {
      return res.status(404).json({
        mensagem: "Prazo não encontrado."
      });
    }

    // Verifica se o usuário tem acesso ao caso.
    const temPermissao =
      usuario.perfil === "ADMIN" ||
      (usuario.perfil === "ALUNO" &&
        prazo.caso.alunoId === usuario.id) ||
      (usuario.perfil === "PROFESSOR" &&
        prazo.caso.professorId === usuario.id);

    if (!temPermissao) {
      return res.status(404).json({
        mensagem: "Prazo não encontrado."
      });
    }

    // Exige pelo menos um campo para atualização.
    if (
      titulo === undefined &&
      descricao === undefined &&
      dataLimite === undefined &&
      concluido === undefined
    ) {
      return res.status(400).json({
        mensagem: "Informe pelo menos um campo para atualizar."
      });
    }

    if (
      titulo !== undefined &&
      (typeof titulo !== "string" || !titulo.trim())
    ) {
      return res.status(400).json({
        mensagem: "O título deve ser um texto não vazio."
      });
    }

    if (
      descricao !== undefined &&
      descricao !== null &&
      typeof descricao !== "string"
    ) {
      return res.status(400).json({
        mensagem: "A descrição deve ser um texto."
      });
    }

    if (
      concluido !== undefined &&
      typeof concluido !== "boolean"
    ) {
      return res.status(400).json({
        mensagem: "O campo concluido deve ser true ou false."
      });
    }

    let novaData: Date | undefined;

    if (dataLimite !== undefined) {
      const formatoData =
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

      if (typeof dataLimite !== "string") {
        return res.status(400).json({
          mensagem: "A data limite deve ser um texto ISO 8601."
        });
      }

      novaData = new Date(dataLimite);

      if (
        !formatoData.test(dataLimite) ||
        Number.isNaN(novaData.getTime())
      ) {
        return res.status(400).json({
          mensagem: "Informe uma data limite válida."
        });
      }
    }

    // Atualiza somente os campos enviados.
    const prazoAtualizado = await prisma.prazo.update({
      where: { id },
      data: {
        ...(titulo !== undefined && {
          titulo: titulo.trim()
        }),
        ...(descricao !== undefined && {
          descricao:
            descricao === null ? null : descricao.trim()
        }),
        ...(novaData !== undefined && {
          dataLimite: novaData
        }),
        ...(concluido !== undefined && {
          concluido
        })
      }
    });

    return res.status(200).json({
      mensagem: "Prazo atualizado com sucesso!",
      prazo: prazoAtualizado
    });

  } catch (erro) {
    console.error("Erro ao atualizar prazo:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao atualizar prazo."
    });
  }
});


 // EXCLUIR PRAZO JURÍDICO
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const usuario = res.locals.usuario;

    // Busca o prazo e seu caso jurídico.
    const prazo = await prisma.prazo.findUnique({
      where: { id },
      include: { caso: true }
    });

    if (!prazo) {
      return res.status(404).json({
        mensagem: "Prazo não encontrado."
      });
    }

    // Verifica se o usuário tem acesso ao caso.
    const temPermissao =
      usuario.perfil === "ADMIN" ||
      (usuario.perfil === "ALUNO" &&
        prazo.caso.alunoId === usuario.id) ||
      (usuario.perfil === "PROFESSOR" &&
        prazo.caso.professorId === usuario.id);

    if (!temPermissao) {
      return res.status(404).json({
        mensagem: "Prazo não encontrado."
      });
    }

    // Exclui o prazo do banco de dados.
    await prisma.prazo.delete({
      where: { id }
    });

    return res.status(200).json({
      mensagem: "Prazo excluído com sucesso!"
    });

  } catch (erro) {
    console.error("Erro ao excluir prazo:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao excluir prazo."
    });
  }
});


export default router;
