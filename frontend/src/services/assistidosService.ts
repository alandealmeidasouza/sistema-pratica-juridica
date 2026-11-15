
const API_URL = "http://localhost:3000";

export interface Assistido {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string | null;
  endereco: string;
  createdAt: string;
}

interface RespostaAssistidos {
  mensagem: string;
  total: number;
  assistidos: Assistido[];
}

export async function buscarAssistidos(
  token: string
): Promise<Assistido[]> {
  const resposta = await fetch(`${API_URL}/assistidos`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resposta.ok) {
    throw new Error("Não foi possível buscar os assistidos.");
  }

  const dados: RespostaAssistidos = await resposta.json();

  return dados.assistidos;
}


export type DadosNovoAssistido = {
  nome: string;
  cpf: string;
  telefone: string;
  email?: string;
  endereco: string;
};

export async function cadastrarAssistido(
  token: string,
  dados: DadosNovoAssistido
) {
  const resposta = await fetch("http://localhost:3000/assistidos", {
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
      resultado.mensagem || "Não foi possível cadastrar o assistido."
    );
  }

  return resultado;
}

export async function atualizarAssistido(
  token: string,
  id: string,
  dados: DadosNovoAssistido
) {
  const resposta = await fetch(
    `http://localhost:3000/assistidos/${id}`,
    {
      method: "PUT",
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
      resultado.mensagem || "Não foi possível atualizar o assistido."
    );
  }

  return resultado;
}

export async function excluirAssistido(
  token: string,
  id: string
) {
  const resposta = await fetch(
    `http://localhost:3000/assistidos/${id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(
      resultado.mensagem || "Não foi possível excluir o assistido."
    );
  }

  return resultado;
}