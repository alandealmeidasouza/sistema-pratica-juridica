import { Router } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../prisma.ts";
import { gerarHashToken } from "../utils/tokenSenha.ts";

const router = Router();

router.post("/definir-senha", async (req, res) => {
  try {
    const { token, senha } = req.body ?? {};

    if (
      typeof token !== "string" ||
      !/^[a-f0-9]{64}$/.test(token) ||
      typeof senha !== "string" ||
      senha.length < 8 ||
      Buffer.byteLength(senha, "utf8") > 72
    ) {
      return res.status(400).json({
        mensagem: "Informe um token válido e uma senha de pelo menos 8 caracteres e até 72 bytes."
      });
    }

    const tokenHash = gerarHashToken(token);

    const convite = await prisma.tokenSenha.findUnique({

    where: {
        tokenHash: tokenHash
    },
    include: {
        usuario: true
    }
    });

    if (
      !convite ||
      convite.tipo !== "CONVITE" ||
      convite.usadoEm !== null ||
      convite.expiraEm <= new Date() ||
      convite.usuario.ativo ||
      convite.usuario.senha !== null
    ) {
      return res.status(400).json({
        mensagem: "Convite inválido, expirado ou já utilizado."
      });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    await prisma.$transaction(async (tx) => {
    const agora = new Date();

    const tokenAtualizado = await tx.tokenSenha.updateMany({
        where: {
        id: convite.id,
        tipo: "CONVITE",
        usadoEm: null,
        expiraEm: {
            gt: agora
        }
        },
        data: {
        usadoEm: agora
        }
    });

    if (tokenAtualizado.count !== 1) {
        throw new Error("CONVITE_INVALIDO");
    }

    const usuarioAtualizado = await tx.usuario.updateMany({
        where: {
        id: convite.usuarioId,
        ativo: false,
        senha: null
        },
        data: {
        senha: senhaHash,
        ativo: true
        }
    });

    if (usuarioAtualizado.count !== 1) {
        throw new Error("CONVITE_INVALIDO");
    }
    });

      return res.status(200).json({
        mensagem: "Senha definida e conta ativada com sucesso!"
    });

  } catch (erro) {
    if (
        erro instanceof Error &&
        erro.message === "CONVITE_INVALIDO"
    ) {
        return res.status(400).json({
        mensagem: "Convite inválido, expirado ou já utilizado."
        });
    }

    console.error("Erro ao definir senha.");

    return res.status(500).json({
        mensagem: "Erro interno ao definir senha."
    });
  }
});

export default router;