import { useState } from "react";
import { cadastrarUsuario } from "../services/usuariosService";
import { useAuth } from "../contexts/AuthContext";
import "./FormularioUsuario.css";

type FormularioUsuarioProps = {
  aoSalvar: (mensagem: string, conviteEnviado: boolean) => void;
  aoCancelar: () => void;
};

export default function FormularioUsuario({
  aoSalvar,
  aoCancelar
}: FormularioUsuarioProps) {

  const { token } = useAuth();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [perfil, setPerfil] = useState("");
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
      const dados = await cadastrarUsuario(token, {
        nome: nome.trim(),
        email: email.trim(),
        perfil
      });

      aoSalvar(dados.mensagem, dados.conviteEnviado);
    } catch (erro) {
      setErro(
        erro instanceof Error
          ? erro.message
          : "Erro ao cadastrar usuário."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="formulario-usuario">
      <h2>Cadastrar usuário</h2>

      <p>Preencha os dados do novo usuário.</p>

      <form onSubmit={handleSubmit}>
        <div className="campo">
            <label htmlFor="nome-usuario">Nome completo</label>

            <input
            id="nome-usuario"
            type="text"
            placeholder="Digite o nome completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            autoFocus
            />
        </div>

        <div className="campo">
            <label htmlFor="email-usuario">Email</label>

            <input
            id="email-usuario"
            type="email"
            placeholder="Digite o email do usuário"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            />
        </div>

        <div className="campo">
            <label htmlFor="perfil-usuario">Perfil</label>

            <select
            id="perfil-usuario"
            value={perfil}
            onChange={(e) => setPerfil(e.target.value)}
            required
            >
            <option value="">Selecione o perfil</option>
            <option value="ADMIN">Administrador</option>
            <option value="PROFESSOR">Professor</option>
            <option value="ALUNO">Aluno</option>
            </select>
        </div>

        <p className="aviso-convite">
          O usuário receberá um convite por email para definir
          sua senha e ativar sua conta.
        </p>

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
            {carregando ? "Cadastrando..." : "Cadastrar usuário"}
          </button>
        </div>
    </form>
    </div>
  );
}