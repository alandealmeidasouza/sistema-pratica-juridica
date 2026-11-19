
import { useState } from "react";
import type { CasoJuridico } from "../services/casosJuridicosService";
import { useAuth } from "../contexts/AuthContext";
import { atualizarCasoJuridico } from "../services/casosJuridicosService";
import "./FormularioCasoJuridico.css";

type Props = {
  caso: CasoJuridico;
  aoCancelar: () => void;
  aoAtualizar: () => void;
};

function FormularioEditarCasoJuridico({
  caso,
  aoCancelar,
  aoAtualizar,
}: Props) {
  const [titulo, setTitulo] = useState(caso.titulo);
  const [descricao, setDescricao] = useState(caso.descricao);
  const [situacao, setSituacao] = useState(caso.situacao);
  const { token } = useAuth();

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSalvar() {
    if (!token) {
        setErro("Usuário não autenticado.");
        return;
    }

    if (!titulo.trim() || !descricao.trim()) {
        setErro("Título e descrição são obrigatórios.");
        return;
    }

    try {
        setSalvando(true);
        setErro("");

        await atualizarCasoJuridico(token, caso.id, {
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        situacao,
        });

        aoAtualizar();
    } catch (erro) {
        setErro(
        erro instanceof Error
            ? erro.message
            : "Erro ao atualizar caso jurídico."
        );
    } finally {
        setSalvando(false);
    }
    }


  return (
    <div className="formulario-caso-juridico">
      <h2>Editar Caso Jurídico</h2>

      <label htmlFor="editar-caso-titulo">Título</label>
      <input
        id="editar-caso-titulo"
        type="text"
        value={titulo}
        onChange={(evento) => setTitulo(evento.target.value)}
        required
      />

      <label htmlFor="editar-caso-descricao">Descrição</label>
      <textarea
        id="editar-caso-descricao"
        value={descricao}
        onChange={(evento) => setDescricao(evento.target.value)}
        rows={4}
        required
      />

      <label htmlFor="editar-caso-situacao">Situação</label>
      <select
        id="editar-caso-situacao"
        value={situacao}
        onChange={(evento) =>
          setSituacao(
            evento.target.value as CasoJuridico["situacao"]
          )
        }
      >
        <option value="ABERTO">Aberto</option>
        <option value="EM_ANDAMENTO">Em andamento</option>
        <option value="ENCERRADO">Encerrado</option>
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
   
        <button
          type="button"
          className="botao-salvar-caso"
          onClick={handleSalvar}
          disabled={salvando}
        >
          {salvando ? "Salvando..." : "Salvar Alterações"}
        </button>

      </div>
    </div>
  );
}

export default FormularioEditarCasoJuridico;
