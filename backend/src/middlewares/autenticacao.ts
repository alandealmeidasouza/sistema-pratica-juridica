
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma.ts";

export async function autenticacao(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({
      mensagem: "Token não informado."
    });
    return;
  }

  const token = authorization.slice(7);

  try {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET não configurada.");
    }

    const payload = jwt.verify(token, jwtSecret);

    if (typeof payload === "string" || !payload.sub) {
      res.status(401).json({
        mensagem: "Token inválido."
      });
      return;
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        nome: true,
        perfil: true,
        ativo: true
      }
    });

    if (!usuario || !usuario.ativo) {
      res.status(401).json({
        mensagem: "Usuário não autorizado."
      });
      return;
    }

    // Guarda os dados do usuário para as próximas etapas
    res.locals.usuario = {
      id: usuario.id,
      nome: usuario.nome,
      perfil: usuario.perfil
    };

    next();

  } catch (erro) {
    if (erro instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        mensagem: "Token inválido ou expirado."
      });
      return;
    }

    console.error("Erro na autenticação:", erro);

    res.status(500).json({
      mensagem: "Erro interno na autenticação."
    });
  }
}
