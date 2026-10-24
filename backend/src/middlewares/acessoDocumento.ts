
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma.ts";

export async function acessoDocumento(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const casoId = req.params.casoId;
    const usuario = res.locals.usuario;

    // Verifica se o ID do caso foi informado.
    if (typeof casoId !== "string" || !casoId.trim()) {
      return res.status(400).json({
        mensagem: "O ID do caso jurídico é obrigatório."
      });
    }

    // Busca o caso jurídico no banco de dados.
    const caso = await prisma.casoJuridico.findUnique({
      where: { id: casoId.trim() }
    });

    // Não permite acessar um caso inexistente.
    if (!caso) {
      return res.status(404).json({
        mensagem: "Caso jurídico não encontrado."
      });
    }

    // Verifica se o usuário tem permissão.
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

    // Permite continuar para a próxima etapa.
    next();

  } catch (erro) {
    console.error("Erro ao verificar acesso ao documento:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao verificar acesso ao documento."
    });
  }
}
