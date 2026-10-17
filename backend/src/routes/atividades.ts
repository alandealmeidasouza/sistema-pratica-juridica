
import { Router } from "express";
import { prisma } from "../prisma.ts";
import { autenticacao } from "../middlewares/autenticacao.ts";
import { permitirPerfis } from "../middlewares/permissao.ts";

const router = Router();

// Exige autenticação em todas as rotas.
router.use(autenticacao);

router.use(permitirPerfis("ALUNO", "PROFESSOR", "ADMIN"));

// Verifica se o usuário tem acesso ao caso jurídico.
function podeAcessarCaso(
  usuario: { id: string; perfil: string },
  caso: { alunoId: string | null; professorId: string | null }
) {
  return (
    usuario.perfil === "ADMIN" ||
    (usuario.perfil === "ALUNO" && caso.alunoId === usuario.id) ||
    (usuario.perfil === "PROFESSOR" &&
      caso.professorId === usuario.id)
  );
}

// CADASTRAR ATIVIDADE
router.post("/", async (req, res) => {
  try {
    const { titulo, descricao, casoId } = req.body;
    const usuario = res.locals.usuario;

    if (
      typeof titulo !== "string" ||
      !titulo.trim() ||
      typeof casoId !== "string" ||
      !casoId.trim()
    ) {
      return res.status(400).json({
        mensagem: "O título e o ID do caso são obrigatórios."
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

    const caso = await prisma.casoJuridico.findUnique({
      where: { id: casoId }
    });

    if (!caso || !podeAcessarCaso(usuario, caso)) {
      return res.status(404).json({
        mensagem: "Caso jurídico não encontrado."
      });
    }

    const atividade = await prisma.atividade.create({
      data: {
        titulo: titulo.trim(),
        descricao:
          typeof descricao === "string" ? descricao.trim() : null,
        casoId: caso.id
      }
    });

    return res.status(201).json({
      mensagem: "Atividade cadastrada com sucesso!",
      atividade
    });
  } catch (erro) {
    console.error("Erro ao cadastrar atividade:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao cadastrar atividade."
    });
  }
});

// LISTAR ATIVIDADES DE UM CASO
router.get("/caso/:casoId", async (req, res) => {
  try {
    const casoId = req.params.casoId as string;
    const usuario = res.locals.usuario;

    const caso = await prisma.casoJuridico.findUnique({
      where: { id: casoId }
    });

    if (!caso || !podeAcessarCaso(usuario, caso)) {
      return res.status(404).json({
        mensagem: "Caso jurídico não encontrado."
      });
    }

    const atividades = await prisma.atividade.findMany({
      where: { casoId },
      orderBy: { createdAt: "desc" }
    });

    return res.status(200).json({
      mensagem: "Atividades encontradas com sucesso!",
      total: atividades.length,
      atividades
    });
  } catch (erro) {
    console.error("Erro ao buscar atividades:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao buscar atividades."
    });
  }
});

// ATUALIZAR ATIVIDADE
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const { titulo, descricao, situacao } = req.body;
    const usuario = res.locals.usuario;

    const atividade = await prisma.atividade.findUnique({
      where: { id },
      include: { caso: true }
    });

    if (!atividade) {
      return res.status(404).json({
        mensagem: "Atividade não encontrada."
      });
    }

    if (!podeAcessarCaso(usuario, atividade.caso)) {
      return res.status(404).json({
        mensagem: "Atividade não encontrada."
      });
    }

    if (
      titulo === undefined &&
      descricao === undefined &&
      situacao === undefined
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

    const situacoesPermitidas = [
      "PENDENTE",
      "EM_ANDAMENTO",
      "CONCLUIDA"
    ] as const;

    if (
      situacao !== undefined &&
      !situacoesPermitidas.some((valor) => valor === situacao)
    ) {
      return res.status(400).json({
        mensagem: "Situação inválida."
      });
    }

    const atividadeAtualizada = await prisma.atividade.update({
      where: { id },
      data: {
        ...(titulo !== undefined && {
          titulo: titulo.trim()
        }),
        ...(descricao !== undefined && {
          descricao:
            descricao === null ? null : descricao.trim()
        }),
        ...(situacao !== undefined && {
          situacao: situacao as
            "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA"
        })
      }
    });

    return res.status(200).json({
      mensagem: "Atividade atualizada com sucesso!",
      atividade: atividadeAtualizada
    });
  } catch (erro) {
    console.error("Erro ao atualizar atividade:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao atualizar atividade."
    });
  }
});


// EXCLUIR ATIVIDADE
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const usuario = res.locals.usuario;

    // Busca a atividade e o caso jurídico relacionado.
    const atividade = await prisma.atividade.findUnique({
      where: { id },
      include: { caso: true }
    });

    if (!atividade) {
      return res.status(404).json({
        mensagem: "Atividade não encontrada."
      });
    }

    // Verifica se o usuário pode acessar o caso.
    if (!podeAcessarCaso(usuario, atividade.caso)) {
      return res.status(404).json({
        mensagem: "Atividade não encontrada."
      });
    }

    // Exclui a atividade.
    await prisma.atividade.delete({
      where: { id }
    });

    return res.status(200).json({
      mensagem: "Atividade excluída com sucesso!"
    });

  } catch (erro) {
    console.error("Erro ao excluir atividade:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao excluir atividade."
    });
  }
});


export default router;
