
import { Router } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../prisma.ts";
import { permitirPerfis } from "../middlewares/permissao.ts";
import { autenticacao } from "../middlewares/autenticacao.ts";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (
      typeof nome !== "string" ||
      typeof email !== "string" ||
      typeof senha !== "string" ||
      !nome.trim() ||
      !email.trim() ||
      senha.length < 8
    ) {
      return res.status(400).json({
        mensagem: "Informe nome, email e senha com pelo menos 8 caracteres."
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

    const senhaHash = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nome: nome.trim(),
        email: emailNormalizado,
        senha: senhaHash,
        perfil: "ALUNO"
      },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true
      }
    });

    return res.status(201).json({
      mensagem: "Usuário cadastrado com sucesso!",
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
