
export type CasoJuridico = {
  id: string;
  titulo: string;
  descricao: string;
  assistidoId: string;
  alunoId: string | null;
  professorId: string | null;
  situacao: "ABERTO" | "EM_ANDAMENTO" | "ENCERRADO";
};

export async function buscarCasosJuridicos(
  token: string
): Promise<CasoJuridico[]> {
  const resposta = await fetch(
    "http://localhost:3000/casos",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(
      resultado.mensagem ||
        "Não foi possível carregar os casos jurídicos."
    );
  }

  return resultado.casos;
}
