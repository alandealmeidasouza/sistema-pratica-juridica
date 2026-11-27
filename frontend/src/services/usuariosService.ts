
export type UsuarioResponsavel = {
  id: string;
  nome: string;
  perfil: "ALUNO" | "PROFESSOR";
};

export type UsuarioGerenciamento = {
  id: string;
  nome: string;
  email: string;
  perfil: "ADMIN" | "PROFESSOR" | "ALUNO";
  ativo: boolean;
  senhaDefinida: boolean;
  createdAt: string;
  updatedAt: string;
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

export async function listarUsuariosGerenciamento(
  token: string
): Promise<UsuarioGerenciamento[]> {
  const resposta = await fetch(
    "http://localhost:3000/usuarios/gerenciamento",
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

export async function cadastrarUsuario(
  token: string,
  usuario: {
    nome: string;
    email: string;
    perfil: "ADMIN" | "PROFESSOR" | "ALUNO";
  }
) {
  const resposta = await fetch(
    "http://localhost:3000/usuarios",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(usuario)
    }
  );

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(
      dados.mensagem || "Erro ao cadastrar usuário."
    );
  }

  return dados;
}

export async function editarUsuario(
  token: string,
  id: string,
  usuario: {
    nome: string;
    email: string;
    perfil: "ADMIN" | "PROFESSOR" | "ALUNO";
  }
) {
  const resposta = await fetch(
    `http://localhost:3000/usuarios/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(usuario)
    }
  );

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(
      dados.mensagem || "Erro ao editar usuário."
    );
  }

  return dados;
}

export async function alterarSituacaoUsuario(
  token: string,
  id: string,
  ativo: boolean
) {
  const resposta = await fetch(
    `http://localhost:3000/usuarios/${id}/situacao`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ ativo })
    }
  );

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(
      dados.mensagem || "Erro ao alterar situação do usuário."
    );
  }

  return dados;
}