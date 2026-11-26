
import { Router } from "express";
import { prisma } from "../prisma.ts";
import { permitirPerfis } from "../middlewares/permissao.ts";
import { autenticacao } from "../middlewares/autenticacao.ts";
import { gerarTokenSenha } from "../utils/tokenSenha.ts";
import { enviarConvite } from "../services/emailService.ts";

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


export default router;
