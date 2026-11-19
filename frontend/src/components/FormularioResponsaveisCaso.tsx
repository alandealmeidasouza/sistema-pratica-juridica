import { useEffect, useState } from "react";
import type { UsuarioResponsavel } from "../services/usuariosService";
import { listarUsuarios } from "../services/usuariosService";
import { atribuirResponsaveisCaso } from "../services/casosJuridicosService";
import "./FormularioCasoJuridico.css";

type Props = {
  casoId: string;
  token: string;
  alunoIdAtual: string | null;
  professorIdAtual: string | null;
  aoSalvar: () => void;
  aoCancelar: () => void;
};

export default function FormularioResponsaveisCaso({
  casoId,
  token,
  alunoIdAtual,
  professorIdAtual,
  aoSalvar,
  aoCancelar
}: Props) {
    const [usuarios, setUsuarios] = useState<UsuarioResponsavel[]>([]);

    const [alunoId, setAlunoId] = useState(alunoIdAtual ?? "");
    const [professorId, setProfessorId] = useState(professorIdAtual ?? "");

    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState("");

    useEffect(() => {
    async function carregarUsuarios() {
        try {
        setCarregando(true);
        setErro("");

        const lista = await listarUsuarios(token);

        setUsuarios(lista);
        } catch (erro) {
        setErro(
            erro instanceof Error
            ? erro.message
            : "Erro ao carregar usuários."
        );
        } finally {
        setCarregando(false);
        }
    }

    carregarUsuarios();
    }, [token]);


  async function salvarResponsaveis() {
    if (!alunoId || !professorId) {
        setErro("Selecione um aluno e um professor.");
        return;
    }

    try {
        setCarregando(true);
        setErro("");

        await atribuirResponsaveisCaso(token, casoId, {
        alunoId,
        professorId
        });

        aoSalvar();
    } catch (erro) {
        setErro(
        erro instanceof Error
            ? erro.message
            : "Erro ao atribuir responsáveis."
        );
    } finally {
        setCarregando(false);
    }
    }


  return (
    <div className="formulario-caso-juridico">
        <h2>Atribuir Responsáveis</h2>

        {carregando && <p>Carregando usuários...</p>}

        {erro && (
          <p className="formulario-caso-erro" role="alert">
            {erro}
          </p>
        )}

        <div>
        <label htmlFor="aluno">Aluno responsável:</label>

        <select
            id="aluno"
            value={alunoId}
            onChange={(e) => setAlunoId(e.target.value)}
        >
            <option value="">Selecione um aluno</option>

            {usuarios
            .filter((usuario) => usuario.perfil === "ALUNO")
            .map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                {usuario.nome}
                </option>
            ))}
        </select>
        </div>

        <div>
        <label htmlFor="professor">Professor responsável:</label>

        <select
            id="professor"
            value={professorId}
            onChange={(e) => setProfessorId(e.target.value)}
        >
            <option value="">Selecione um professor</option>

            {usuarios
            .filter((usuario) => usuario.perfil === "PROFESSOR")
            .map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                {usuario.nome}
                </option>
            ))}
        </select>
        </div>

        <div className="formulario-caso-acoes">
          <button
            type="button"
            onClick={aoCancelar}
            disabled={carregando}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="botao-salvar-caso"
            onClick={salvarResponsaveis}
            disabled={carregando}
          >
            {carregando ? "Salvando..." : "Salvar Responsáveis"}
          </button>
        </div>
    </div>
  );
}
