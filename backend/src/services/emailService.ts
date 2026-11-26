import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function enviarConvite(
  nome: string,
  email: string,
  token: string
) {
  const link = `${process.env.FRONTEND_URL}/definir-senha?token=${token}`;

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: "Convite - Sistema de Prática Jurídica",
    text: `
Olá, ${nome}!

Você foi cadastrado no Sistema de Gestão da Prática Jurídica.

Acesse o link abaixo para definir sua senha:

${link}

Este convite é válido por 24 horas e pode ser utilizado apenas uma vez.

Atenciosamente,
Sistema de Gestão da Prática Jurídica.
    `
  });
}

export async function testarConexaoEmail() {
  await transporter.verify();

  console.log("Conexão com o servidor de email realizada com sucesso!");
}