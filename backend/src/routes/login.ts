
import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma.ts";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { email, senha } = req.body ?? {};

    // Verifica se os dados foram informados
    if (
      typeof email !== "string" ||
      typeof senha !== "string" ||
      !email.trim() ||
      !senha
    ) {
      return res.status(400).json({
        mensagem: "Informe o email e a senha."
      });
    }

    // Procura o usuário pelo email
    const usuario = await prisma.usuario.findUnique({
      where: {
        email: email.trim().toLowerCase()
      }
    });

    // Verifica se o usuário existe e está ativo
    if (!usuario || !usuario.ativo) {
      return res.status(401).json({
        mensagem: "Email ou senha inválidos."
      });
    }

    // Compara a senha informada com o hash salvo no banco
    const senhaCorreta = await bcrypt.compare(
      senha,
      usuario.senha
    );

    if (!senhaCorreta) {
      return res.status(401).json({
        mensagem: "Email ou senha inválidos."
      });
    }

    // Obtém a chave secreta do ambiente
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET não configurada.");
    }

    // Gera o token de autenticação
    const token = jwt.sign(
      { perfil: usuario.perfil },
      jwtSecret,
      {
        subject: usuario.id,
        expiresIn: "2h"
      }
    );

    // Retorna o token e os dados públicos do usuário
    return res.status(200).json({
      mensagem: "Login realizado com sucesso!",
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil
      }
    });

  } catch (erro) {
    console.error("Erro ao realizar login:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao realizar login."
    });
  }
});

export default router;
