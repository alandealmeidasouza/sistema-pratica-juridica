
export type UsuarioResponsavel = {
  id: string;
  nome: string;
  perfil: "ALUNO" | "PROFESSOR";
};

export async function listarUsuarios(
  token: string
): Promise<UsuarioResponsavel[]> {
  const resposta = await fetch(
    "http://localhost:3000/usuarios",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(
      dados.mensagem || "Erro ao listar usuários."
    );
  }

  return dados.usuarios;
}
