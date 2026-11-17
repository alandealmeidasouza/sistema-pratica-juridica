
import { useEffect, useState, type SubmitEvent } from "react";
import { useAuth } from "../contexts/AuthContext";

import {
  cadastrarAtendimento,
  atualizarAtendimento,
  type Atendimento,
} from "../services/atendimentosService";

import {
  buscarAssistidos,
  type Assistido,
} from "../services/assistidosService";

import {
  buscarCasosJuridicos,
  type CasoJuridico,
} from "../services/casosJuridicosService";

type Props = {
  aoCancelar: () => void;
  aoCadastrar: () => void;
  atendimento?: Atendimento | null;
};

function FormularioAtendimento({
  aoCancelar,
  aoCadastrar,
  atendimento,
}: Props) {
  const { token } = useAuth();

  const [assistidos, setAssistidos] = useState<Assistido[]>([]);
  const [carregandoAssistidos, setCarregandoAssistidos] = useState(true);

  const [casos, setCasos] = useState<CasoJuridico[]>([]);
  const [carregandoCasos, setCarregandoCasos] = useState(true);

  const [descricao, setDescricao] = useState(atendimento?.descricao ?? "");
  const [assistidoId, setAssistidoId] = useState(atendimento?.assistidoId ?? "");
  const [casoId, setCasoId] = useState( atendimento?.casoId ?? "");

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const casosDoAssistido = casos.filter(
  (caso) => caso.assistidoId === assistidoId
  );

    useEffect(() => {
    if (!token) {
        setCarregandoAssistidos(false);
        return;
    }

    let ativo = true;

    async function carregarAssistidos() {
        try {
        const dados = await buscarAssistidos(token!);

        if (ativo) {
            setAssistidos(dados);
        }
        } catch {
        if (ativo) {
            setErro("Não foi possível carregar os assistidos.");
        }
        } finally {
        if (ativo) {
            setCarregandoAssistidos(false);
        }
        }
    }

    carregarAssistidos();

    return () => {
        ativo = false;
    };
    }, [token]);


    useEffect(() => {
    if (!token) {
        setCarregandoCasos(false);
        return;
    }

    let ativo = true;

    async function carregarCasos() {
        try {
        const dados = await buscarCasosJuridicos(token!);

        if (ativo) {
            setCasos(dados);
        }
        } catch {
        if (ativo) {
            setErro("Não foi possível carregar os casos jurídicos.");
        }
        } finally {
        if (ativo) {
            setCarregandoCasos(false);
        }
        }
    }

    carregarCasos();

    return () => {
        ativo = false;
    };
    }, [token]);


  async function handleSubmit(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!token) {
      setErro("Usuário não autenticado.");
      return;
    }

    setErro("");
    setSalvando(true);

    try {
      if (atendimento) {
        // Edita um atendimento existente.
        await atualizarAtendimento(token, atendimento.id, {
          descricao: descricao.trim(),
          ...(casoId.trim() && { casoId: casoId.trim() }),
        });

        alert("Atendimento atualizado com sucesso!");
      } else {
        // Cadastra um novo atendimento.
        await cadastrarAtendimento(token, {
          descricao: descricao.trim(),
          assistidoId,
          ...(casoId.trim() && { casoId: casoId.trim() }),
        });

        alert("Atendimento cadastrado com sucesso!");
      }

      aoCadastrar();
      aoCancelar();
    } catch (erro) {
      setErro(
        erro instanceof Error
          ? erro.message
          : atendimento
            ? "Erro ao atualizar atendimento."
            : "Erro ao cadastrar atendimento."
      );
    } finally {
      setSalvando(false);
    }
  }


  return (
    <form
      className="formulario-atendimento"
      onSubmit={handleSubmit}
    >
      <h2>
        {atendimento ? "Editar Atendimento" : "Cadastrar Novo Atendimento"}
      </h2>

      <label htmlFor="atendimento-assistido">
        Assistido
      </label>
      <select
        id="atendimento-assistido"
        value={assistidoId}
        onChange={(evento) => {
            setAssistidoId(evento.target.value);
            setCasoId("");
        }}
        required
        disabled={carregandoAssistidos || Boolean(atendimento)}
      >
        <option value="">Selecione um assistido</option>

        {assistidos.map((assistido) => (
          <option key={assistido.id} value={assistido.id}>
            {assistido.nome}
          </option>
        ))}
      </select>

      <label htmlFor="atendimento-descricao">
        Descrição do atendimento
      </label>
      <textarea
        id="atendimento-descricao"
        value={descricao}
        onChange={(evento) => setDescricao(evento.target.value)}
        placeholder="Descreva o atendimento realizado"
        required
        rows={4}
      />

      <label htmlFor="atendimento-caso">
        Caso jurídico (opcional)
      </label>
      <select
        id="atendimento-caso"
        value={casoId}
        onChange={(evento) => setCasoId(evento.target.value)}
        disabled={
          !assistidoId ||
          carregandoCasos ||
          Boolean(atendimento?.casoId)
        }
        >
          <option value="">Atendimento inicial (sem caso jurídico)</option>

          {casosDoAssistido.map((caso) => (
            <option key={caso.id} value={caso.id}>
              {caso.titulo}
            </option>
          ))}
        </select>

      {erro && <p role="alert">{erro}</p>}

      <div className="formulario-atendimento-acoes">
        <button
          type="button"
          onClick={aoCancelar}
          disabled={salvando}
        >
          Cancelar
        </button>

        <button type="submit" disabled={salvando}>
          {salvando
            ? "Salvando..."
            : atendimento
              ? "Salvar Alterações"
              : "Cadastrar Atendimento"}
        </button>
      </div>
    </form>
  );
}

export default FormularioAtendimento;
