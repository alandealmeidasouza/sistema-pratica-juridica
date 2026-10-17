import { Router } from "express";
import { prisma } from "../prisma.ts";
import { autenticacao } from "../middlewares/autenticacao.ts";
import { permitirPerfis } from "../middlewares/permissao.ts";

const router = Router();

router.use(autenticacao);
router.use(permitirPerfis("ADMIN", "PROFESSOR", "ALUNO"));


 // CADASTRAR UM ACONTECIMENTO NO HISTÓRICO
router.post("/", async (req, res) => {
  try {
    const { descricao, casoId } = req.body;
    const usuario = res.locals.usuario;

    // Verifica os campos obrigatórios.
    if (
      typeof descricao !== "string" ||
      !descricao.trim() ||
      typeof casoId !== "string" ||
      !casoId.trim()
    ) {
      return res.status(400).json({
        mensagem: "Descrição e ID do caso são obrigatórios."
      });
    }

    // Procura o caso jurídico.
    const caso = await prisma.casoJuridico.findUnique({
      where: { id: casoId }
    });

    if (!caso) {
      return res.status(404).json({
        mensagem: "Caso jurídico não encontrado."
      });
    }

    // Verifica se o usuário pode acessar o caso.
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

    // Registra o acontecimento e seu autor.
    const historico = await prisma.historicoCaso.create({
      data: {
        descricao: descricao.trim(),
        casoId: caso.id,
        usuarioId: usuario.id
      }
    });

    return res.status(201).json({
      mensagem: "Histórico cadastrado com sucesso!",
      historico
    });

  } catch (erro) {
    console.error("Erro ao cadastrar histórico:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao cadastrar histórico."
    });
  }
});


 // CONSULTAR O HISTÓRICO DE UM CASO JURÍDICO
router.get("/caso/:casoId", async (req, res) => {
  try {
    const { casoId } = req.params;
    const usuario = res.locals.usuario;

    // Verifica se o caso existe.
    const caso = await prisma.casoJuridico.findUnique({
      where: { id: casoId }
    });

    if (!caso) {
      return res.status(404).json({
        mensagem: "Caso jurídico não encontrado."
      });
    }

    // Verifica se o usuário tem acesso ao caso.
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

    // Busca os acontecimentos e seus responsáveis.
    const historicos = await prisma.historicoCaso.findMany({
      where: { casoId },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            perfil: true
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    return res.status(200).json({
      mensagem: "Histórico encontrado com sucesso!",
      total: historicos.length,
      historicos
    });

  } catch (erro) {
    console.error("Erro ao consultar histórico:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao consultar histórico."
    });
  }
});


export default router;