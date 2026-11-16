
export type Atendimento = {
  id: string;
  descricao: string;
  data: string;
  assistidoId: string;
  casoId: string | null;
  responsavelId: string;

  assistido: {
    id: string;
    nome: string;
  };

  caso: {
    id: string;
    titulo: string;
  } | null;

  responsavel: {
    id: string;
    nome: string;
    perfil: string;
  };
};

export async function buscarAtendimentos(
  token: string
): Promise<Atendimento[]> {
  const resposta = await fetch(
    "http://localhost:3000/atendimentos",
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
        "Não foi possível carregar os atendimentos."
    );
  }

  return resultado.atendimentos;
}

export type DadosNovoAtendimento = {
  descricao: string;
  assistidoId: string;
  casoId?: string;
};

export async function cadastrarAtendimento(
  token: string,
  dados: DadosNovoAtendimento
) {
  const resposta = await fetch(
    "http://localhost:3000/atendimentos",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dados),
    }
  );

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(
      resultado.mensagem ||
        "Não foi possível cadastrar o atendimento."
    );
  }

  return resultado.atendimento;
}
