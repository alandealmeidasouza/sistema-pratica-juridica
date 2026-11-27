import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./DefinirSenha.css";

export default function DefinirSenha() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function definirSenha(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    setErro("");

    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
        setErro("Link de convite inválido.");
        return;
    }

    if (senha.length < 8) {
        setErro("A senha deve possuir pelo menos 8 caracteres.");
        return;
    }

    if (new TextEncoder().encode(senha).length > 72) {
        setErro("A senha deve possuir no máximo 72 bytes.");
        return;
    }

    if (senha !== confirmarSenha) {
        setErro("As senhas não coincidem.");
        return;
    }

    setCarregando(true);

    try {
    const resposta = await fetch(
        "http://localhost:3000/senhas/definir-senha",
        {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            token,
            senha,
        }),
        }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(dados.mensagem || "Erro ao definir senha.");
    }

    navigate("/login");

    } catch (erro) {
    setErro(
        erro instanceof Error
        ? erro.message
        : "Erro ao definir senha."
    );
    } finally {
    setCarregando(false);
    }
  }

  return (
  <div className="definir-senha-container">
    <div className="definir-senha-card">
      <h1>Definir senha</h1>

      <p>Crie sua senha para ativar sua conta no sistema.</p>

      <form onSubmit={definirSenha}>
        <label htmlFor="senha">Nova senha</label>

        <input
          id="senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Digite sua nova senha"
          autoComplete="new-password"
          required
        />

        <label htmlFor="confirmarSenha">Confirmar senha</label>

        <input
          id="confirmarSenha"
          type="password"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          placeholder="Confirme sua nova senha"
          autoComplete="new-password"
          required
        />

        {erro && <p role="alert">{erro}</p>}

        <button type="submit" disabled={carregando}>
          {carregando ? "Salvando..." : "Definir senha"}
        </button>
      </form>
    </div>
  </div>
);
}