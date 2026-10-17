
import type { Request, Response, NextFunction } from "express";
import type { Perfil } from "../generated/prisma/client.ts";

export function permitirPerfis(...perfisPermitidos: Perfil[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const usuario = res.locals.usuario;

    // Verifica se existe um usuário autenticado
    if (!usuario) {
      res.status(401).json({
        mensagem: "Usuário não autenticado."
      });
      return;
    }

    // Verifica se o perfil tem permissão
    if (!perfisPermitidos.includes(usuario.perfil)) {
      res.status(403).json({
        mensagem: "Você não tem permissão para acessar esta rota."
      });
      return;
    }

    next();
  };
}
