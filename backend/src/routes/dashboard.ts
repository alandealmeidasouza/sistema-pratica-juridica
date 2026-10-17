import { Router } from "express";
import { prisma } from "../prisma.ts";
import { autenticacao } from "../middlewares/autenticacao.ts";
import { permitirPerfis } from "../middlewares/permissao.ts";

const router = Router();

router.use(autenticacao);
router.use(permitirPerfis("ADMIN", "PROFESSOR", "ALUNO"));


// CONSULTAR O RESUMO DO DASHBOARD
router.get("/resumo", async (req, res) => {
  try {
    const usuario = res.locals.usuario;

    // Define quais casos o usuário pode visualizar.
    const filtroCasos =
      usuario.perfil === "ADMIN"
        ? {}
        : usuario.perfil === "PROFESSOR"
          ? { professorId: usuario.id }
          : { alunoId: usuario.id };

    // Busca os casos permitidos para o usuário.
    const casos = await prisma.casoJuridico.findMany({
      where: filtroCasos,
      select: { id: true }
    });

    const idsCasos = casos.map((caso) => caso.id);

    // Conta as informações relacionadas aos casos permitidos.
    const [
      totalAtividades,
      atividadesPendentes,
      totalPrazos,
      prazosPendentes,
      totalDocumentos,
      totalAtendimentos
    ] = await Promise.all([
      prisma.atividade.count({
        where: { casoId: { in: idsCasos } }
      }),

      prisma.atividade.count({
        where: {
          casoId: { in: idsCasos },
          situacao: "PENDENTE"
        }
      }),

      prisma.prazo.count({
        where: { casoId: { in: idsCasos } }
      }),

      prisma.prazo.count({
        where: {
          casoId: { in: idsCasos },
          concluido: false
        }
      }),

      prisma.documento.count({
        where: { casoId: { in: idsCasos } }
      }),

      prisma.atendimento.count({
        where: { casoId: { in: idsCasos } }
      })

    ]);

    return res.status(200).json({
      mensagem: "Resumo do dashboard encontrado com sucesso!",
      resumo: {
        totalCasos: casos.length,
        totalAtividades,
        atividadesPendentes,
        totalPrazos,
        prazosPendentes,
        totalDocumentos,
        totalAtendimentos
      }
    });

  } catch (erro) {
    console.error("Erro ao consultar dashboard:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao consultar dashboard."
    });
  }
});


export default router;