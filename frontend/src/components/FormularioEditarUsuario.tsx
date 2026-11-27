import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  editarUsuario,
  type UsuarioGerenciamento
} from "../services/usuariosService";

import "./FormularioUsuario.css";

type FormularioEditarUsuarioProps = {
  usuario: UsuarioGerenciamento;
  aoSalvar: (mensagem: string) => void;
  aoCancelar: () => void;
};

export default function FormularioEditarUsuario({
  usuario,
  aoSalvar,
  aoCancelar
}: FormularioEditarUsuarioProps) {
  const { token } = useAuth();

  const [nome, setNome] = useState(usuario.nome);
  const [email, setEmail] = useState(usuario.email);
  const [perfil, setPerfil] = useState(usuario.perfil);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");

    if (!token) {
        setErro("Usuário não autenticado.");
        return;
    }

    if (!nome.trim() || !email.trim()) {
        setErro("Preencha todos os campos.");
        return;
    }

    if (
        perfil !== "ADMIN" &&
        perfil !== "PROFESSOR" &&
        perfil !== "ALUNO"
    ) {
        setErro("Selecione um perfil válido.");
        return;
    }

    setCarregando(true);

    try {
        const dados = await editarUsuario(token, usuario.id, {
        nome: nome.trim(),
        email: email.trim(),
        perfil: perfil
        });

        aoSalvar(dados.mensagem);
    } catch (erro) {
        setErro(
        erro instanceof Error
            ? erro.message
            : "Erro ao editar usuário."
        );
    } finally {
        setCarregando(false);
    }
  }

  return (
  <div className="formulario-usuario">
    <h2>Editar usuário</h2>
    <p>Altere os dados do usuário cadastrado.</p>

    <form onSubmit={handleSubmit}>
      <div className="campo">
        <label htmlFor="editar-nome">Nome completo</label>

        <input
          id="editar-nome"
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          autoFocus
        />
      </div>

      <div className="campo">
        <label htmlFor="editar-email">Email</label>

        <input
          id="editar-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="campo">
        <label htmlFor="editar-perfil">Perfil</label>

        <select
          id="editar-perfil"
          value={perfil}
          onChange={(e) =>
            setPerfil(
              e.target.value as UsuarioGerenciamento["perfil"]
            )
          }
          required
        >
          <option value="ADMIN">Administrador</option>
          <option value="PROFESSOR">Professor</option>
          <option value="ALUNO">Aluno</option>
        </select>
      </div>

      {erro && (
        <p className="formulario-usuario-erro" role="alert">
          {erro}
        </p>
      )}

      <div className="formulario-usuario-acoes">
        <button
          type="button"
          className="botao-cancelar"
          onClick={aoCancelar}
          disabled={carregando}
        >
          Cancelar
        </button>

        <button
          type="submit"
          className="botao-cadastrar"
          disabled={carregando}
        >
          {carregando ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </form>
  </div>
);
}