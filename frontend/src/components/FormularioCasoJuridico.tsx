import "./FormularioCasoJuridico.css"
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { cadastrarCasoJuridico } from "../services/casosJuridicosService";

import {
  buscarAssistidos,
  type Assistido,
} from "../services/assistidosService";

type Props = {
  aoCancelar: () => void;
  aoCadastrar: () => void;
};

function FormularioCasoJuridico({
  aoCancelar,
  aoCadastrar,
}: Props) {
  const [titulo, setTitulo] = useState("");

  const { token } = useAuth();

  const [assistidos, setAssistidos] = useState<Assistido[]>([]);
  const [carregandoAssistidos, setCarregandoAssistidos] = useState(true);

  const [descricao, setDescricao] = useState("");
  const [assistidoId, setAssistidoId] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
  if (!token) {
    setCarregandoAssistidos(false);
    return;
  }

  async function carregarAssistidos() {
    try {
      setCarregandoAssistidos(true);

      const lista = await buscarAssistidos(token!);

      setAssistidos(lista);
    } catch (erro) {
      setErro(
        erro instanceof Error
          ? erro.message
          : "Erro ao carregar assistidos."
      );
    } finally {
      setCarregandoAssistidos(false);
    }
  }

  carregarAssistidos();
}, [token]);


async function handleCadastrar(
  evento: React.SubmitEvent<HTMLFormElement>
) {
  evento.preventDefault();

  if (!token) {
    setErro("Usuário não autenticado.");
    return;
  }

  if (!titulo.trim() || !descricao.trim() || !assistidoId) {
    setErro("Preencha todos os campos obrigatórios.");
    return;
  }

  try {
    setSalvando(true);
    setErro("");

    await cadastrarCasoJuridico(token, {
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      assistidoId,
    });

    aoCadastrar();
  } catch (erro) {
    setErro(
      erro instanceof Error
        ? erro.message
        : "Erro ao cadastrar caso jurídico."
    );
  } finally {
    setSalvando(false);
  }
}


  return (
    <form 
        className="formulario-caso-juridico"  
        onSubmit={handleCadastrar}
    >
      <h2>Cadastrar Novo Caso Jurídico</h2>

      <label htmlFor="caso-titulo">
        Título do caso
      </label>
      <input
        id="caso-titulo"
        type="text"
        value={titulo}
        onChange={(evento) => setTitulo(evento.target.value)}
        placeholder="Digite o título do caso jurídico"
        required
      />

      <label htmlFor="caso-descricao">
        Descrição do caso
      </label>
      <textarea
        id="caso-descricao"
        value={descricao}
        onChange={(evento) => setDescricao(evento.target.value)}
        placeholder="Descreva o caso jurídico"
        rows={4}
        required
      />

        <label htmlFor="caso-assistido">
        Assistido
        </label>

        <select
            id="caso-assistido"
            value={assistidoId}
            onChange={(evento) => setAssistidoId(evento.target.value)}
            required
            disabled={carregandoAssistidos}
        >
            <option value="">
                {carregandoAssistidos
                ? "Carregando assistidos..."
                : "Selecione um assistido"}
            </option>

            {assistidos.map((assistido) => (
                <option key={assistido.id} value={assistido.id}>
                {assistido.nome}
                </option>
            ))}
        </select>

        {erro && (
        <p className="formulario-caso-erro" role="alert">
            {erro}
        </p>
        )}

      <div className="formulario-caso-acoes">
            <button type="button" onClick={aoCancelar}>
            Cancelar
            </button>

            <button type="submit" disabled={salvando || carregandoAssistidos}>
                {salvando ? "Cadastrando..." : "Cadastrar Caso Jurídico"}
            </button>
      </div>
    </form>
  );
}

export default FormularioCasoJuridico;
