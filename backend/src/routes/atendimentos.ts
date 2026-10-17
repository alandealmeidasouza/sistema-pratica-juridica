import { Router } from "express";
import { prisma } from "../prisma.ts";
import { autenticacao } from "../middlewares/autenticacao.ts";
import { permitirPerfis } from "../middlewares/permissao.ts";

const router = Router();

// Exige que o usuário esteja autenticado
router.use(autenticacao);

// Permite apenas os perfis autorizados
router.use(permitirPerfis("ALUNO", "PROFESSOR", "ADMIN"));


router.post("/", async (req, res) => {
  try {
    const { descricao, assistidoId, casoId } = req.body ?? {};
    const usuario = res.locals.usuario;

    // Verifica os campos obrigatórios.
    if (
      typeof descricao !== "string" ||
      !descricao.trim() ||
      typeof assistidoId !== "string" ||
      !assistidoId.trim()
    ) {
      return res.status(400).json({
        mensagem: "Descrição e ID do assistido são obrigatórios."
      });
    }

    // Verifica se o ID do caso é válido, quando informado.
    if (
      casoId !== undefined &&
      casoId !== null &&
      (typeof casoId !== "string" || !casoId.trim())
    ) {
      return res.status(400).json({
        mensagem: "ID do caso jurídico inválido."
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

    // ATENDIMENTO VINCULADO A UM CASO JURÍDICO.
    if (typeof casoId === "string") {
      const caso = await prisma.casoJuridico.findUnique({
        where: {
          id: casoId.trim()
        }
      });

      if (!caso) {
        return res.status(404).json({
          mensagem: "Caso jurídico não encontrado."
        });
      }

      // Verifica se o usuário tem acesso ao caso.
      const temPermissao =
        usuario.perfil === "ADMIN" ||
        (
          usuario.perfil === "ALUNO" &&
          caso.alunoId === usuario.id
        ) ||
        (
          usuario.perfil === "PROFESSOR" &&
          caso.professorId === usuario.id
        );

      if (!temPermissao) {
        return res.status(404).json({
          mensagem: "Caso jurídico não encontrado."
        });
      }

      // Confirma que o caso pertence ao assistido.
      if (caso.assistidoId !== assistido.id) {
        return res.status(400).json({
          mensagem: "O caso jurídico não pertence ao assistido informado."
        });
      }

      // Cadastra o atendimento vinculado ao caso.
      const atendimento = await prisma.atendimento.create({
        data: {
          descricao: descricao.trim(),
          assistidoId: assistido.id,
          casoId: caso.id,
          responsavelId: usuario.id
        }
      });

      return res.status(201).json({
        mensagem: "Atendimento cadastrado com sucesso!",
        atendimento
      });
    }

    // ATENDIMENTO INICIAL SEM CASO JURÍDICO.

    // Verifica se o aluno tem acesso ao assistido.
    const alunoAutorizado =
      usuario.perfil === "ALUNO" &&
      (
        assistido.cadastradoPorId === usuario.id ||
        await prisma.casoJuridico.count({
          where: {
            assistidoId: assistido.id,
            alunoId: usuario.id
          }
        }) > 0
      );

    // Administradores também podem registrar atendimentos iniciais.
    const temPermissao =
      usuario.perfil === "ADMIN" || alunoAutorizado;

    if (!temPermissao) {
      return res.status(404).json({
        mensagem: "Assistido não encontrado."
      });
    }

    // Registra o atendimento inicial e seu responsável.
    const atendimento = await prisma.atendimento.create({
      data: {
        descricao: descricao.trim(),
        assistidoId: assistido.id,
        responsavelId: usuario.id
      }
    });

    return res.status(201).json({
      mensagem: "Atendimento inicial cadastrado com sucesso!",
      atendimento
    });

  } catch (erro) {
    console.error("Erro ao cadastrar atendimento:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao cadastrar atendimento."
    });
  }
});


router.get("/", async (req, res) => {
  try {
    const usuario = res.locals.usuario;

    // Define quais atendimentos o usuário pode consultar.
    const filtroAtendimentos =
      usuario.perfil === "ADMIN"
        ? {}
        : usuario.perfil === "PROFESSOR"
          ? {
              caso: {
                is: {
                  professorId: usuario.id
                }
              }
            }
          : {
              OR: [
                // Atendimentos dos casos do aluno.
                {
                  caso: {
                    is: {
                      alunoId: usuario.id
                    }
                  }
                },

                // Atendimentos iniciais realizados pelo aluno.
                {
                  casoId: null,
                  responsavelId: usuario.id
                }
              ]
            };

    // Busca somente os atendimentos permitidos.
    const atendimentos = await prisma.atendimento.findMany({
      where: filtroAtendimentos,
      include: {
        assistido: {
          select: {
            id: true,
            nome: true
          }
        },
        caso: {
          select: {
            id: true,
            titulo: true
          }
        },
        responsavel: {
          select: {
            id: true,
            nome: true,
            perfil: true
          }
        }
      },
      orderBy: {
        data: "desc"
      }
    });

    return res.status(200).json({
      mensagem: "Atendimentos encontrados com sucesso!",
      total: atendimentos.length,
      atendimentos
    });

  } catch (erro) {
    console.error("Erro ao listar atendimentos:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao listar atendimentos."
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
        mensagem: "ID do atendimento inválido."
      });
    }

    // Busca o atendimento e seus relacionamentos.
    const atendimento = await prisma.atendimento.findUnique({
      where: {
        id: id.trim()
      },
      include: {
        assistido: {
          select: {
            id: true,
            nome: true
          }
        },
        caso: {
          select: {
            id: true,
            titulo: true,
            alunoId: true,
            professorId: true
          }
        },
        responsavel: {
          select: {
            id: true,
            nome: true,
            perfil: true
          }
        }
      }
    });

    if (!atendimento) {
      return res.status(404).json({
        mensagem: "Atendimento não encontrado."
      });
    }

    const caso = atendimento.caso;

    // Verifica se o usuário tem permissão para consultar.
    const temPermissao =
      usuario.perfil === "ADMIN" ||

      // Aluno vinculado ao caso jurídico.
      (
        usuario.perfil === "ALUNO" &&
        caso !== null &&
        caso.alunoId === usuario.id
      ) ||

      // Professor responsável pela supervisão do caso.
      (
        usuario.perfil === "PROFESSOR" &&
        caso !== null &&
        caso.professorId === usuario.id
      ) ||

      // Aluno que realizou um atendimento inicial sem caso.
      (
        usuario.perfil === "ALUNO" &&
        atendimento.casoId === null &&
        atendimento.responsavelId === usuario.id
      );

    if (!temPermissao) {
      return res.status(404).json({
        mensagem: "Atendimento não encontrado."
      });
    }

    // Retorna somente os dados do atendimento autorizado.
    return res.status(200).json({
      mensagem: "Atendimento encontrado com sucesso!",
      atendimento: {
        id: atendimento.id,
        descricao: atendimento.descricao,
        data: atendimento.data,
        createdAt: atendimento.createdAt,
        updatedAt: atendimento.updatedAt,
        assistidoId: atendimento.assistidoId,
        casoId: atendimento.casoId,
        responsavelId: atendimento.responsavelId,
        assistido: atendimento.assistido,
        caso: caso
          ? {
              id: caso.id,
              titulo: caso.titulo
            }
          : null,
        responsavel: atendimento.responsavel
      }
    });

  } catch (erro) {
    console.error("Erro ao buscar atendimento:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao buscar atendimento."
    });
  }
});


router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { descricao, casoId } = req.body ?? {};
    const usuario = res.locals.usuario;

    // Verifica o ID do atendimento.
    if (typeof id !== "string" || !id.trim()) {
      return res.status(400).json({
        mensagem: "ID do atendimento inválido."
      });
    }

    // É necessário informar ao menos um campo para atualizar.
    if (descricao === undefined && casoId === undefined) {
      return res.status(400).json({
        mensagem: "Informe a descrição ou o ID do caso jurídico."
      });
    }

    // Valida a descrição, quando informada.
    if (
      descricao !== undefined &&
      (typeof descricao !== "string" || !descricao.trim())
    ) {
      return res.status(400).json({
        mensagem: "Descrição inválida."
      });
    }

    // Valida o ID do caso, quando informado.
    if (
      casoId !== undefined &&
      (typeof casoId !== "string" || !casoId.trim())
    ) {
      return res.status(400).json({
        mensagem: "ID do caso jurídico inválido."
      });
    }

    // Procura o atendimento.
    const atendimentoExistente = await prisma.atendimento.findUnique({
      where: {
        id: id.trim()
      },
      include: {
        caso: true
      }
    });

    if (!atendimentoExistente) {
      return res.status(404).json({
        mensagem: "Atendimento não encontrado."
      });
    }

    const casoAtual = atendimentoExistente.caso;

    // Verifica se o usuário pode modificar o atendimento.
    const temPermissao =
      usuario.perfil === "ADMIN" ||
      (
        usuario.perfil === "ALUNO" &&
        casoAtual !== null &&
        casoAtual.alunoId === usuario.id
      ) ||
      (
        usuario.perfil === "PROFESSOR" &&
        casoAtual !== null &&
        casoAtual.professorId === usuario.id
      ) ||
      (
        usuario.perfil === "ALUNO" &&
        atendimentoExistente.casoId === null &&
        atendimentoExistente.responsavelId === usuario.id
      );

    if (!temPermissao) {
      return res.status(404).json({
        mensagem: "Atendimento não encontrado."
      });
    }

    // Prepara os campos que serão atualizados.
    const dadosAtualizacao: {
      descricao?: string;
      casoId?: string;
    } = {};

    if (typeof descricao === "string") {
      dadosAtualizacao.descricao = descricao.trim();
    }

    // Se foi informado um caso jurídico, verifica a associação.
    if (typeof casoId === "string") {
      const caso = await prisma.casoJuridico.findUnique({
        where: {
          id: casoId.trim()
        }
      });

      if (!caso) {
        return res.status(404).json({
          mensagem: "Caso jurídico não encontrado."
        });
      }

      // Verifica se o usuário tem acesso ao caso.
      const podeAcessarCaso =
        usuario.perfil === "ADMIN" ||
        (
          usuario.perfil === "ALUNO" &&
          caso.alunoId === usuario.id
        ) ||
        (
          usuario.perfil === "PROFESSOR" &&
          caso.professorId === usuario.id
        );

      if (!podeAcessarCaso) {
        return res.status(404).json({
          mensagem: "Caso jurídico não encontrado."
        });
      }

      // Atendimento e caso devem pertencer ao mesmo assistido.
      if (caso.assistidoId !== atendimentoExistente.assistidoId) {
        return res.status(400).json({
          mensagem: "O caso jurídico não pertence ao assistido do atendimento."
        });
      }

      // Impede transferir um atendimento já vinculado.
      if (
        atendimentoExistente.casoId !== null &&
        atendimentoExistente.casoId !== caso.id
      ) {
        return res.status(409).json({
          mensagem: "O atendimento já está vinculado a outro caso jurídico."
        });
      }

      dadosAtualizacao.casoId = caso.id;
    }

    // Atualiza o atendimento.
    const atendimentoAtualizado = await prisma.atendimento.update({
      where: {
        id: id.trim()
      },
      data: dadosAtualizacao
    });

    return res.status(200).json({
      mensagem: "Atendimento atualizado com sucesso!",
      atendimento: atendimentoAtualizado
    });

  } catch (erro) {
    console.error("Erro ao atualizar atendimento:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao atualizar atendimento."
    });
  }
});


export default router;
