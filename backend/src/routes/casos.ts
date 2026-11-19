import { Router } from "express";
import { prisma } from "../prisma.ts";
import { autenticacao } from "../middlewares/autenticacao.ts";
import { permitirPerfis } from "../middlewares/permissao.ts";

const router = Router();

// Exige autenticação
router.use(autenticacao);

// Define os perfis que podem acessar o módulo
router.use(permitirPerfis("ALUNO", "PROFESSOR", "ADMIN"));


router.post("/", async (req, res) => {
  try {
    const { titulo, descricao, assistidoId } = req.body ?? {};
    const usuario = res.locals.usuario;

    // Valida os campos obrigatórios.
    if (
      typeof titulo !== "string" ||
      !titulo.trim() ||
      typeof descricao !== "string" ||
      !descricao.trim() ||
      typeof assistidoId !== "string" ||
      !assistidoId.trim()
    ) {
      return res.status(400).json({
        mensagem: "Título, descrição e ID do assistido são obrigatórios."
      });
    }

    // Procura o assistido.
    const assistido = await prisma.assistido.findUnique({
      where: {
        id: assistidoId.trim()
      }
    });

    if (!assistido) {
      return res.status(404).json({
        mensagem: "Assistido não encontrado."
      });
    }

    // Verifica se o usuário tem permissão para acessar o assistido.
    let temPermissao = false;

    if (usuario.perfil === "ADMIN") {
      temPermissao = true;
    }

    if (usuario.perfil === "ALUNO") {
      const casoVinculado = await prisma.casoJuridico.findFirst({
        where: {
          assistidoId: assistido.id,
          alunoId: usuario.id
        }
      });

      temPermissao =
        assistido.cadastradoPorId === usuario.id ||
        casoVinculado !== null;
    }

    if (usuario.perfil === "PROFESSOR") {
      const casoSupervisionado = await prisma.casoJuridico.findFirst({
        where: {
          assistidoId: assistido.id,
          professorId: usuario.id
        }
      });

      temPermissao = casoSupervisionado !== null;
    }

    if (!temPermissao) {
      return res.status(404).json({
        mensagem: "Assistido não encontrado."
      });
    }

    // Quando um aluno abre o caso, ele se torna o responsável.
    const alunoId =
      usuario.perfil === "ALUNO" ? usuario.id : null;

    // Cadastra o caso jurídico.
    const caso = await prisma.casoJuridico.create({
      data: {
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        assistidoId: assistido.id,
        alunoId
      }
    });

    return res.status(201).json({
      mensagem: "Caso jurídico cadastrado com sucesso!",
      caso
    });

  } catch (erro) {
    console.error("Erro ao cadastrar caso jurídico:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao cadastrar caso jurídico."
    });
  }
});


router.get("/", async (req, res) => {
  try {
    // Identifica o usuário que está fazendo a requisição
    const usuario = res.locals.usuario;

    // Define quais casos o usuário pode visualizar
    const filtro =
      usuario.perfil === "ADMIN"
        ? {}
        : usuario.perfil === "PROFESSOR"
          ? { professorId: usuario.id }
          : { alunoId: usuario.id };

    // Busca os casos jurídicos permitidos para o usuário
    const casos = await prisma.casoJuridico.findMany({
      where: filtro,

      include: {
        assistido: {
          select: {
            id: true,
            nome: true
          }
        },

        aluno: {
          select: {
            id: true,
            nome: true
          }
        },

        professor: {
          select: {
            id: true,
            nome: true
          }
        }
      },

      orderBy: {
        createdAt: "desc"
      }
    });

    return res.status(200).json({
      mensagem: "Casos jurídicos encontrados com sucesso!",
      total: casos.length,
      casos
    });

  } catch (erro) {
    console.error("Erro ao listar casos jurídicos:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao listar casos jurídicos."
    });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Identifica o usuário autenticado
    const usuario = res.locals.usuario;

    // Verifica se o ID foi informado corretamente
    if (typeof id !== "string" || !id.trim()) {
      return res.status(400).json({
        mensagem: "ID do caso jurídico inválido."
      });
    }

    // Busca o caso jurídico pelo ID
    const caso = await prisma.casoJuridico.findUnique({
      where: {
        id
      },
      include: {
        assistido: {
          select: {
            id: true,
            nome: true
          }
        },

        aluno: {
          select: {
            id: true,
            nome: true
          }
        },

        professor: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    });

    // Verifica se o caso existe
    if (!caso) {
      return res.status(404).json({
        mensagem: "Caso jurídico não encontrado."
      });
    }

    // Verifica se o usuário pode visualizar este caso
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

    return res.status(200).json({
      mensagem: "Caso jurídico encontrado com sucesso!",
      caso
    });

  } catch (erro) {
    console.error("Erro ao buscar caso jurídico:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao buscar caso jurídico."
    });
  }
});


router.put(
  "/:id",
  permitirPerfis("PROFESSOR", "ADMIN"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { titulo, descricao, situacao } = req.body ?? {};

      // Valida o ID
      if (typeof id !== "string" || !id.trim()) {
        return res.status(400).json({
          mensagem: "ID do caso jurídico inválido."
        });
      }

      // Valida o título e a descrição
      if (
        typeof titulo !== "string" ||
        !titulo.trim() ||
        typeof descricao !== "string" ||
        !descricao.trim()
      ) {
        return res.status(400).json({
          mensagem: "Título e descrição são obrigatórios."
        });
      }

      // Verifica se a situação é permitida
      const situacoesPermitidas = [
        "ABERTO",
        "EM_ANDAMENTO",
        "ENCERRADO"
      ];

      if (
        typeof situacao !== "string" ||
        !situacoesPermitidas.includes(situacao)
      ) {
        return res.status(400).json({
          mensagem: "Situação do caso jurídico inválida."
        });
      }

      // Verifica se o caso existe
      const casoExistente = await prisma.casoJuridico.findUnique({
        where: { id }
      });

      if (!casoExistente) {
        return res.status(404).json({
          mensagem: "Caso jurídico não encontrado."
        });
      }

      const usuario = res.locals.usuario;

      if (
        usuario.perfil === "PROFESSOR" &&
        casoExistente.professorId !== usuario.id
      ) {
        return res.status(403).json({
          mensagem: "Você não tem permissão para editar este caso jurídico."
        });
      }

      // Atualiza o caso
      const casoAtualizado = await prisma.casoJuridico.update({
        where: { id },
        data: {
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          situacao: situacao as typeof casoExistente.situacao
        }
      });

      return res.status(200).json({
        mensagem: "Caso jurídico atualizado com sucesso!",
        caso: casoAtualizado
      });

    } catch (erro) {
      console.error("Erro ao atualizar caso jurídico:", erro);

      return res.status(500).json({
        mensagem: "Erro interno ao atualizar caso jurídico."
      });
    }
  }
);


router.put(
  "/:id/responsaveis",
  permitirPerfis("ADMIN"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { alunoId, professorId } = req.body ?? {};

      if (
        typeof id !== "string" ||
        !id.trim() ||
        typeof alunoId !== "string" ||
        !alunoId.trim() ||
        typeof professorId !== "string" ||
        !professorId.trim()
      ) {
        return res.status(400).json({
          mensagem: "ID do caso, aluno e professor são obrigatórios."
        });
      }

      // Verifica se o caso existe
      const caso = await prisma.casoJuridico.findUnique({
        where: { id }
      });

      if (!caso) {
        return res.status(404).json({
          mensagem: "Caso jurídico não encontrado."
        });
      }

      // Busca os usuários indicados
      const [aluno, professor] = await Promise.all([
        prisma.usuario.findUnique({
          where: { id: alunoId.trim() }
        }),
        prisma.usuario.findUnique({
          where: { id: professorId.trim() }
        })
      ]);

      // Valida os perfis e se os usuários estão ativos
      if (!aluno || aluno.perfil !== "ALUNO" || !aluno.ativo) {
        return res.status(400).json({
          mensagem: "Aluno responsável inválido ou inativo."
        });
      }

      if (
        !professor ||
        professor.perfil !== "PROFESSOR" ||
        !professor.ativo
      ) {
        return res.status(400).json({
          mensagem: "Professor responsável inválido ou inativo."
        });
      }

      // Atribui os responsáveis ao caso
      const casoAtualizado = await prisma.casoJuridico.update({
        where: { id },
        data: {
          alunoId: aluno.id,
          professorId: professor.id
        }
      });

      return res.status(200).json({
        mensagem: "Responsáveis atribuídos com sucesso!",
        caso: casoAtualizado
      });

    } catch (erro) {
      console.error("Erro ao atribuir responsáveis:", erro);

      return res.status(500).json({
        mensagem: "Erro interno ao atribuir responsáveis."
      });
    }
  }
);


export default router;
