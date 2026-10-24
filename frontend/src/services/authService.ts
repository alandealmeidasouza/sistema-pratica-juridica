
type DadosLogin = {
  email: string;
  senha: string;
};

type Usuario = {
  id: string;
  nome: string;
  email: string;
  perfil: "ADMIN" | "PROFESSOR" | "ALUNO";
};

type RespostaLogin = {
  mensagem: string;
  token: string;
  usuario: Usuario;
};

export async function realizarLogin(
  dados: DadosLogin
): Promise<RespostaLogin> {
  const resposta = await fetch("http://localhost:3000/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dados),
  });

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(
      resultado.mensagem || "Não foi possível realizar o login."
    );
  }

  return resultado as RespostaLogin;
}
