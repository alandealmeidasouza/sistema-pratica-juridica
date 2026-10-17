import { prisma } from "./prisma.ts";
import express from "express";
import cors from "cors";
import "dotenv/config";

import usuariosRoutes from "./routes/usuarios.ts";
import loginRoutes from "./routes/login.ts";
import assistidosRoutes from "./routes/assistidos.ts";
import atendimentosRoutes from "./routes/atendimentos.ts";
import casosRoutes from "./routes/casos.ts";
import atividadesRoutes from "./routes/atividades.ts";
import prazosRoutes from "./routes/prazos.ts";
import documentosRoutes from "./routes/documentos.ts";
import historicoRoutes from "./routes/historico.ts";
import dashboardRoutes from "./routes/dashboard.ts";


import { autenticacao } from "./middlewares/autenticacao.ts";
import { permitirPerfis } from "./middlewares/permissao.ts";


const app = express();

app.use(cors());
app.use(express.json());

// Rotas
app.use("/usuarios", usuariosRoutes);
app.use("/login", loginRoutes);
app.use("/assistidos", assistidosRoutes);
app.use("/atendimentos", atendimentosRoutes);
app.use("/casos", casosRoutes);
app.use("/atividades", atividadesRoutes);
app.use("/prazos", prazosRoutes);
app.use("/documentos", documentosRoutes);
app.use("/historico", historicoRoutes);
app.use("/dashboard", dashboardRoutes);


app.get("/perfil", autenticacao, (req, res) => {
  res.status(200).json({
    mensagem: "Você está autenticado!",
    usuario: res.locals.usuario
  });
});


app.get(
  "/admin",
  autenticacao,
  permitirPerfis("ADMIN"),
  (req, res) => {
    res.status(200).json({
      mensagem: "Bem-vindo à área administrativa!",
      usuario: res.locals.usuario
    });
  }
);


app.get(
  "/professor",
  autenticacao,
  permitirPerfis("PROFESSOR"),
  (req, res) => {
    res.status(200).json({
      mensagem: "Bem-vindo à área do professor!",
      usuario: res.locals.usuario
    });
  }
);

app.get(
  "/aluno",
  autenticacao,
  permitirPerfis("ALUNO"),
  (req, res) => {
    res.status(200).json({
      mensagem: "Bem-vindo à área do aluno!",
      usuario: res.locals.usuario
    });
  }
);



app.get("/", (req, res) => {
  res.json({
    mensagem: "API do Sistema de Gestão da Prática Jurídica funcionando!"
  });
});


app.get("/teste-banco", async (req, res) => {
  try {
    const totalUsuarios = await prisma.usuario.count();

    res.json({
      mensagem: "Conexão com o banco funcionando!",
      totalUsuarios: totalUsuarios
    });
  } catch (erro) {
    console.error("Erro ao consultar o banco:", erro);

    res.status(500).json({
      mensagem: "Erro ao conectar com o banco de dados."
    });
  }
});


const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
