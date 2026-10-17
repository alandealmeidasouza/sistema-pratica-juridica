import { Router } from "express";
import { prisma } from "../prisma.ts";
import { autenticacao } from "../middlewares/autenticacao.ts";
import { permitirPerfis } from "../middlewares/permissao.ts";

const router = Router();

// Todas as rotas de assistidos exigirão autenticação
router.use(autenticacao);

// Apenas alunos, professores e administradores autorizados
router.use(permitirPerfis("ALUNO", "PROFESSOR", "ADMIN"));


router.post("/", async (req, res) => {
  try {
    const { nome, cpf, telefone, email, endereco } = req.body ?? {};

    // Obtém o usuário autenticado pelo token JWT.
    const usuario = res.locals.usuario;

    // Verifica os campos obrigatórios.
    if (
      typeof nome !== "string" ||
      typeof cpf !== "string" ||
      typeof telefone !== "string" ||
      typeof endereco !== "string" ||
      !nome.trim() ||
      !cpf.trim() ||
      !telefone.trim() ||
      !endereco.trim()
    ) {
      return res.status(400).json({
        mensagem: "Nome, CPF, telefone e endereço são obrigatórios."
      });
    }

    // O email é opcional, mas deve ser texto quando informado.
    if (
      email !== undefined &&
      email !== null &&
      typeof email !== "string"
    ) {
      return res.status(400).json({
        mensagem: "O email informado é inválido."
      });
    }

    // Remove pontos, espaços e traços do CPF.
    const cpfNormalizado = cpf.replace(/\D/g, "");

    if (!/^\d{11}$/.test(cpfNormalizado)) {
      return res.status(400).json({
        mensagem: "O CPF deve conter 11 números."
      });
    }

    // Verifica se o CPF já está cadastrado.
    const assistidoExistente = await prisma.assistido.findUnique({
      where: {
        cpf: cpfNormalizado
      }
    });

    if (assistidoExistente) {
      return res.status(409).json({
        mensagem: "Este CPF já está cadastrado."
      });
    }

    // Cadastra o assistido e identifica o usuário responsável.
    const assistido = await prisma.assistido.create({
      data: {
        nome: nome.trim(),
        cpf: cpfNormalizado,
        telefone: telefone.trim(),
        email: email?.trim() || null,
        endereco: endereco.trim(),
        cadastradoPorId: usuario.id
      }
    });

    return res.status(201).json({
      mensagem: "Assistido cadastrado com sucesso!",
      assistido
    });

  } catch (erro) {
    console.error("Erro ao cadastrar assistido:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao cadastrar assistido."
    });
  }
});


router.get("/", async (req, res) => {
  try {
    const usuario = res.locals.usuario;

    // Define quais assistidos o usuário pode visualizar.
    const filtro =
      usuario.perfil === "ADMIN"
        ? {}
        : usuario.perfil === "PROFESSOR"
          ? {
              casos: {
                some: {
                  professorId: usuario.id
                }
              }
            }
          : {
              OR: [
                // Assistidos cadastrados pelo próprio aluno.
                {
                  cadastradoPorId: usuario.id
                },

                // Assistidos vinculados aos casos do aluno.
                {
                  casos: {
                    some: {
                      alunoId: usuario.id
                    }
                  }
                }
              ]
            };

    // Busca somente os assistidos autorizados.
    const assistidos = await prisma.assistido.findMany({
      where: filtro,
      select: {
        id: true,
        nome: true,
        cpf: true,
        telefone: true,
        email: true,
        endereco: true,
        createdAt: true,
        updatedAt: true,
        cadastradoPorId: true,
        cadastradoPor: {
          select: {
            id: true,
            nome: true,
            perfil: true
          }
        }
      },
      orderBy: {
        nome: "asc"
      }
    });

    return res.status(200).json({
      mensagem: "Assistidos listados com sucesso!",
      total: assistidos.length,
      assistidos
    });

  } catch (erro) {
    console.error("Erro ao listar assistidos:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao listar assistidos."
    });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = res.locals.usuario;

    // Verifica se o ID foi informado corretamente.
    if (typeof id !== "string" || !id.trim()) {
      return res.status(400).json({
        mensagem: "ID do assistido inválido."
      });
    }

    // Define quais assistidos o usuário pode consultar.
    const filtro =
      usuario.perfil === "ADMIN"
        ? {}
        : usuario.perfil === "PROFESSOR"
          ? {
              casos: {
                some: {
                  professorId: usuario.id
                }
              }
            }
          : {
              OR: [
                // Assistidos cadastrados pelo próprio aluno.
                {
                  cadastradoPorId: usuario.id
                },

                // Assistidos vinculados aos casos do aluno.
                {
                  casos: {
                    some: {
                      alunoId: usuario.id
                    }
                  }
                }
              ]
            };

    // Busca o assistido respeitando as permissões.
    const assistido = await prisma.assistido.findFirst({
      where: {
        AND: [
          { id: id.trim() },
          filtro
        ]
      },
      select: {
        id: true,
        nome: true,
        cpf: true,
        telefone: true,
        email: true,
        endereco: true,
        createdAt: true,
        updatedAt: true,
        cadastradoPorId: true,
        cadastradoPor: {
          select: {
            id: true,
            nome: true,
            perfil: true
          }
        }
      }
    });

    if (!assistido) {
      return res.status(404).json({
        mensagem: "Assistido não encontrado."
      });
    }

    return res.status(200).json({
      mensagem: "Assistido encontrado com sucesso!",
      assistido
    });

  } catch (erro) {
    console.error("Erro ao buscar assistido:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao buscar assistido."
    });
  }
});


router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cpf, telefone, email, endereco } = req.body ?? {};

    // Identifica o usuário autenticado.
    const usuario = res.locals.usuario;

    // Verifica se o ID foi informado corretamente.
    if (typeof id !== "string" || !id.trim()) {
      return res.status(400).json({
        mensagem: "ID do assistido inválido."
      });
    }

    // Verifica os campos obrigatórios.
    if (
      typeof nome !== "string" ||
      typeof cpf !== "string" ||
      typeof telefone !== "string" ||
      typeof endereco !== "string" ||
      !nome.trim() ||
      !cpf.trim() ||
      !telefone.trim() ||
      !endereco.trim()
    ) {
      return res.status(400).json({
        mensagem: "Nome, CPF, telefone e endereço são obrigatórios."
      });
    }

    // Verifica se o email é válido.
    if (
      email !== undefined &&
      email !== null &&
      typeof email !== "string"
    ) {
      return res.status(400).json({
        mensagem: "O email informado é inválido."
      });
    }

    // Remove a pontuação do CPF.
    const cpfNormalizado = cpf.replace(/\D/g, "");

    if (!/^\d{11}$/.test(cpfNormalizado)) {
      return res.status(400).json({
        mensagem: "O CPF deve conter 11 números."
      });
    }

    // Define quais assistidos o usuário pode atualizar.
    const filtro =
      usuario.perfil === "ADMIN"
        ? {}
        : usuario.perfil === "PROFESSOR"
          ? {
              casos: {
                some: {
                  professorId: usuario.id
                }
              }
            }
          : {
              OR: [
                // Assistidos cadastrados pelo aluno.
                {
                  cadastradoPorId: usuario.id
                },

                // Assistidos vinculados aos casos do aluno.
                {
                  casos: {
                    some: {
                      alunoId: usuario.id
                    }
                  }
                }
              ]
            };

    // Verifica se o assistido existe e se há permissão.
    const assistidoExistente = await prisma.assistido.findFirst({
      where: {
        AND: [
          { id: id.trim() },
          filtro
        ]
      }
    });

    if (!assistidoExistente) {
      return res.status(404).json({
        mensagem: "Assistido não encontrado."
      });
    }

    // Verifica se o CPF pertence a outro assistido.
    const cpfExistente = await prisma.assistido.findUnique({
      where: {
        cpf: cpfNormalizado
      }
    });

    if (
      cpfExistente &&
      cpfExistente.id !== assistidoExistente.id
    ) {
      return res.status(409).json({
        mensagem: "Este CPF já pertence a outro assistido."
      });
    }

    // Atualiza somente os dados cadastrais.
    const assistidoAtualizado = await prisma.assistido.update({
      where: {
        id: assistidoExistente.id
      },
      data: {
        nome: nome.trim(),
        cpf: cpfNormalizado,
        telefone: telefone.trim(),
        email: email?.trim() || null,
        endereco: endereco.trim()
      }
    });

    return res.status(200).json({
      mensagem: "Assistido atualizado com sucesso!",
      assistido: assistidoAtualizado
    });

  } catch (erro) {
    console.error("Erro ao atualizar assistido:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao atualizar assistido."
    });
  }
});


router.delete(
  "/:id",
  permitirPerfis("ADMIN"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (typeof id !== "string" || !id.trim()) {
        return res.status(400).json({
          mensagem: "ID do assistido inválido."
        });
      }

      const assistido = await prisma.assistido.findUnique({
        where: { id },
        include: {
          atendimentos: true,
          casos: true
        }
      });

      if (!assistido) {
        return res.status(404).json({
          mensagem: "Assistido não encontrado."
        });
      }

      // Impede excluir assistidos com registros vinculados
      if (
        assistido.atendimentos.length > 0 ||
        assistido.casos.length > 0
      ) {
        return res.status(409).json({
          mensagem: "Não é possível excluir um assistido com atendimentos ou casos vinculados."
        });
      }

      await prisma.assistido.delete({
        where: { id }
      });

      return res.status(200).json({
        mensagem: "Assistido excluído com sucesso!"
      });

    } catch (erro) {
      console.error("Erro ao excluir assistido:", erro);

      return res.status(500).json({
        mensagem: "Erro interno ao excluir assistido."
      });
    }
  }
);


export default router;
