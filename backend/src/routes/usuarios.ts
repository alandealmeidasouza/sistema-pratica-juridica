
import { Router } from "express";
import { prisma } from "../prisma.ts";
import { permitirPerfis } from "../middlewares/permissao.ts";
import { autenticacao } from "../middlewares/autenticacao.ts";
import { gerarTokenSenha } from "../utils/tokenSenha.ts";
import { enviarConvite } from "../services/emailService.ts";
import { Prisma } from "../generated/prisma/client.ts";

const router = Router();

router.post(
  "/",
  autenticacao,
  permitirPerfis("ADMIN"),
  async (req, res) => {
  try {
    const { nome, email, perfil } = req.body ?? {};

    if (
      typeof nome !== "string" ||
      typeof email !== "string" ||
      !nome.trim() ||
      !email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      (perfil !== "ADMIN" &&
      perfil !== "PROFESSOR" &&
      perfil !== "ALUNO")
  ) {
    return res.status(400).json({
      mensagem: "Informe nome, email válido e perfil válido."
    });
  }

    const emailNormalizado = email.trim().toLowerCase();

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email: emailNormalizado }
    });

    if (usuarioExistente) {
      return res.status(409).json({
        mensagem: "Este email já está cadastrado."
      });
    }

    const { token, tokenHash } = gerarTokenSenha();

    const expiraEm = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    const usuario = await prisma.usuario.create({
      data: {
        nome: nome.trim(),
        email: emailNormalizado,
        senha: null,
        perfil: perfil,
        ativo: false,

        tokensSenha: {
          create: {
            tokenHash: tokenHash,
            tipo: "CONVITE",
            expiraEm: expiraEm
          }
        }
      },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true
      }
    });

    try {
      await enviarConvite(usuario.nome, usuario.email, token);
    } catch (erro) {
      console.error("Falha no envio do convite.");

      return res.status(201).json({
        mensagem: "Usuário cadastrado, mas não foi possível enviar o convite.",
        conviteEnviado: false,
        usuario
      });
    }

    return res.status(201).json({
      mensagem: "Usuário cadastrado e convite enviado com sucesso!",
      conviteEnviado: true,
      usuario
    });

  } catch (erro) {
    console.error("Erro ao cadastrar usuário:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao cadastrar usuário."
    });
  }
});


router.get(
  "/",
  autenticacao,
  permitirPerfis("ADMIN"),
  async (req, res) => {
    try {
      const usuarios = await prisma.usuario.findMany({
        where: {
          ativo: true,
          perfil: {
            in: ["ALUNO", "PROFESSOR"]
          }
        },
        select: {
          id: true,
          nome: true,
          perfil: true
        },
        orderBy: {
          nome: "asc"
        }
      });

      return res.status(200).json({
        mensagem: "Usuários encontrados com sucesso!",
        total: usuarios.length,
        usuarios
      });

    } catch (erro) {
      console.error("Erro ao listar usuários:", erro);

      return res.status(500).json({
        mensagem: "Erro interno ao listar usuários."
      });
    }
  }
);

router.get(
  "/gerenciamento",
  autenticacao,
  permitirPerfis("ADMIN"),
  async (req, res) => {
    try {
      const usuarios = await prisma.usuario.findMany({
        select: {
          id: true,
          nome: true,
          email: true,
          perfil: true,
          ativo: true,
          senha: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          nome: "asc"
        }
      });

      const usuariosGerenciamento = usuarios.map(
        ({ senha, ...usuario }) => ({
          ...usuario,
          senhaDefinida: senha !== null
        })
      );

      return res.status(200).json({
        mensagem: "Usuários encontrados com sucesso!",
        total: usuariosGerenciamento.length,
        usuarios: usuariosGerenciamento
      });

    } catch (erro) {
      console.error("Erro ao listar usuários:", erro);

      return res.status(500).json({
        mensagem: "Erro interno ao listar usuários."
      });
    }
  }
);

router.put(
  "/:id",
  autenticacao,
  permitirPerfis("ADMIN"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { nome, email, perfil } = req.body ?? {};

      if (
        typeof id !== "string" ||
        !id.trim() ||
        typeof nome !== "string" ||
        typeof email !== "string" ||
        !nome.trim() ||
        !email.trim() ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        (perfil !== "ADMIN" &&
          perfil !== "PROFESSOR" &&
          perfil !== "ALUNO")
      ) {
        return res.status(400).json({
          mensagem: "Informe ID, nome, email válido e perfil válido."
        });
      }

      const emailNormalizado = email.trim().toLowerCase();
      const administradorAutenticado = res.locals.usuario;

      const resultado = await prisma.$transaction(
        async (tx) => {
          const usuarioExistente = await tx.usuario.findUnique({
            where: {
              id: id
            }
          });

          if (!usuarioExistente) {
            return {
              status: 404,
              mensagem: "Usuário não encontrado."
            };
          }

          const emailExistente = await tx.usuario.findUnique({
            where: {
              email: emailNormalizado
            }
          });

          if (emailExistente && emailExistente.id !== id) {
            return {
              status: 409,
              mensagem:
                "Este email já está cadastrado por outro usuário."
            };
          }

          if (
            usuarioExistente.perfil === "ALUNO" &&
            perfil !== "ALUNO"
          ) {
            const totalCasos = await tx.casoJuridico.count({
              where: {
                alunoId: id
              }
            });

            if (totalCasos > 0) {
              return {
                status: 409,
                mensagem:
                  "Não é possível alterar o perfil deste aluno enquanto ele possuir casos jurídicos vinculados."
              };
            }
          }

          if (
            usuarioExistente.perfil === "PROFESSOR" &&
            perfil !== "PROFESSOR"
          ) {
            const totalCasos = await tx.casoJuridico.count({
              where: {
                professorId: id
              }
            });

            if (totalCasos > 0) {
              return {
                status: 409,
                mensagem:
                  "Não é possível alterar o perfil deste professor enquanto ele possuir casos jurídicos vinculados."
              };
            }
          }

          if (
            usuarioExistente.perfil === "ADMIN" &&
            usuarioExistente.ativo &&
            perfil !== "ADMIN"
          ) {
            const totalAdministradores = await tx.usuario.count({
              where: {
                perfil: "ADMIN",
                ativo: true
              }
            });

            if (totalAdministradores <= 1) {
              return {
                status: 409,
                mensagem:
                  "Não é possível alterar o perfil do último administrador ativo do sistema."
              };
            }
          }

          if (
            administradorAutenticado.id === id &&
            perfil !== usuarioExistente.perfil
          ) {
            return {
              status: 403,
              mensagem:
                "Não é possível alterar seu próprio perfil."
            };
          }

          if (
            usuarioExistente.senha === null &&
            emailNormalizado !== usuarioExistente.email
          ) {
            return {
              status: 409,
              mensagem:
                "Não é possível alterar o email de um usuário que ainda não definiu sua senha."
            };
          }

          const usuarioAtualizado = await tx.usuario.update({
            where: {
              id: id
            },
            data: {
              nome: nome.trim(),
              email: emailNormalizado,
              perfil: perfil
            },
            select: {
              id: true,
              nome: true,
              email: true,
              perfil: true,
              ativo: true,
              createdAt: true,
              updatedAt: true
            }
          });

          return {
            status: 200,
            mensagem: "Usuário atualizado com sucesso!",
            usuario: usuarioAtualizado
          };
        },
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel.Serializable
        }
      );

      const { status, ...dados } = resultado;

      return res.status(status).json(dados);

    } catch (erro) {
      if (erro instanceof Prisma.PrismaClientKnownRequestError) {
        if (erro.code === "P2002") {
          return res.status(409).json({
            mensagem:
              "Este email já está cadastrado por outro usuário."
          });
        }

        if (erro.code === "P2034") {
          return res.status(409).json({
            mensagem:
              "Conflito durante a atualização. Tente novamente."
          });
        }
      }

      console.error("Erro ao editar usuário:", erro);

      return res.status(500).json({
        mensagem: "Erro interno ao editar usuário."
      });
    }
  }
);

router.patch(
  "/:id/situacao",
  autenticacao,
  permitirPerfis("ADMIN"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { ativo } = req.body ?? {};

      if (
        typeof id !== "string" ||
        !id.trim() ||
        typeof ativo !== "boolean"
      ) {
        return res.status(400).json({
          mensagem: "Informe um ID e uma situação válida."
        });
      }

      const administrador = res.locals.usuario;

      const resultado = await prisma.$transaction(
        async (tx) => {
          const administradorAtual = await tx.usuario.findUnique({
            where: { id: administrador.id }
          });

          if (
            !administradorAtual ||
            !administradorAtual.ativo ||
            administradorAtual.perfil !== "ADMIN"
          ) {
            return {
              status: 403,
              mensagem: "Você não tem permissão para realizar esta operação."
            };
          }

          const usuario = await tx.usuario.findUnique({
            where: { id: id }
          });

          if (!usuario) {
            return {
              status: 404,
              mensagem: "Usuário não encontrado."
            };
          }

          if (usuario.ativo === ativo) {
            return {
              status: 409,
              mensagem: "O usuário já possui essa situação."
            };
          }

          if (ativo && usuario.senha === null) {
            return {
              status: 409,
              mensagem:
                "O usuário precisa definir sua senha antes de ativar a conta."
            };
          }

          if (!ativo && usuario.perfil === "ADMIN") {
            const totalAdministradores = await tx.usuario.count({
              where: {
                perfil: "ADMIN",
                ativo: true
              }
            });

            if (totalAdministradores <= 1) {
              return {
                status: 409,
                mensagem:
                  "Não é possível desativar o último administrador ativo."
              };
            }
          }

          if (!ativo && administrador.id === id) {
            return {
              status: 403,
              mensagem: "Você não pode desativar sua própria conta."
            };
          }

          const usuarioAtualizado = await tx.usuario.update({
            where: { id: id },
            data: { ativo: ativo },
            select: {
              id: true,
              nome: true,
              email: true,
              perfil: true,
              ativo: true,
              createdAt: true,
              updatedAt: true
            }
          });

          return {
            status: 200,
            mensagem: ativo
              ? "Usuário ativado com sucesso!"
              : "Usuário desativado com sucesso!",
            usuario: usuarioAtualizado
          };
        },
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel.Serializable
        }
      );

      const { status, ...dados } = resultado;

      return res.status(status).json(dados);

    } catch (erro) {
      if (
        erro instanceof Prisma.PrismaClientKnownRequestError &&
        erro.code === "P2034"
      ) {
        return res.status(409).json({
          mensagem: "Conflito durante a atualização. Tente novamente."
        });
      }

      console.error("Erro ao alterar situação do usuário:", erro);

      return res.status(500).json({
        mensagem: "Erro interno ao alterar situação do usuário."
      });
    }
  }
);

export default router;
