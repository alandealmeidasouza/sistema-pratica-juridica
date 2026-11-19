
export type CasoJuridico = {
  id: string;
  titulo: string;
  descricao: string;
  assistidoId: string;
  alunoId: string | null;
  professorId: string | null;
  situacao: "ABERTO" | "EM_ANDAMENTO" | "ENCERRADO";

  assistido: {
    id: string;
    nome: string;
  };

  aluno: {
    id: string;
    nome: string;
  } | null;

  professor: {
    id: string;
    nome: string;
  } | null;
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


export type DadosCadastroCasoJuridico = {
  titulo: string;
  descricao: string;
  assistidoId: string;
};

export async function cadastrarCasoJuridico(
  token: string,
  dados: DadosCadastroCasoJuridico
) {
  const resposta = await fetch("http://localhost:3000/casos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dados),
  });

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(
      resultado.mensagem ||
        "Não foi possível cadastrar o caso jurídico."
    );
  }

  return resultado.caso;
}
