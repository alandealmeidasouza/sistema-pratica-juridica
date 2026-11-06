import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  cadastrarAssistido,
  type Assistido,
} from "../services/assistidosService";

type Props = {
  aoCancelar: () => void;
  aoCadastrar: () => void;
  assistido?: Assistido | null;
};

function FormularioAssistido({ aoCancelar, aoCadastrar, assistido, }: Props) {
  const [nome, setNome] = useState(assistido?.nome ?? "");
  const [cpf, setCpf] = useState(assistido?.cpf ?? "");
  const [telefone, setTelefone] = useState(assistido?.telefone ?? "");
  const [email, setEmail] = useState(assistido?.email ?? "");
  const [endereco, setEndereco] = useState(assistido?.endereco ?? "");

  const { token } = useAuth();

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
  e.preventDefault();

  if (!token) {
    setErro("Sua sessão expirou. Faça login novamente.");
    return;
  }

  setErro("");
  setSalvando(true);

  try {
    await cadastrarAssistido(token, {
      nome: nome.trim(),
      cpf: cpf.replace(/\D/g, ""),
      telefone: telefone.trim(),
      email: email.trim(),
      endereco: endereco.trim(),
    });

    alert("Assistido cadastrado com sucesso!");
    aoCadastrar();
    aoCancelar();
  } catch (error) {
    if (error instanceof Error) {
      setErro(error.message);
    } else {
      setErro("Erro ao cadastrar assistido.");
    }
  } finally {
    setSalvando(false);
  }
}

  return (
    <section className="assistidos-formulario">
      <h2>Cadastrar Novo Assistido</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="nome">Nome completo</label>
          <input
            id="nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="cpf">CPF</label>
          <input
            id="cpf"
            type="text"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="telefone">Telefone</label>
          <input
            id="telefone"
            type="tel"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="email">E-mail (opcional)</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="endereco">Endereço</label>
          <input
            id="endereco"
            type="text"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            required
          />
        </div>

        {erro && (
          <p role="alert" style={{ color: "#b91c1c", gridColumn: "1 / -1" }}>
            {erro}
          </p>
        )}

        <div className="assistidos-formulario-acoes">
          <button type="button" onClick={aoCancelar}>
            Cancelar
          </button>

          <button type="submit" disabled={salvando}>
            {salvando ? "Cadastrando..." : "Cadastrar Assistido"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default FormularioAssistido;
