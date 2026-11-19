import "./CasosJuridicos.css"
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import FormularioCasoJuridico from "../components/FormularioCasoJuridico";

import {
  buscarCasosJuridicos,
  type CasoJuridico,
} from "../services/casosJuridicosService";

function CasosJuridicos() {
    const { token } = useAuth();

    const [casos, setCasos] = useState<CasoJuridico[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [atualizarLista, setAtualizarLista] = useState(0);

    useEffect(() => {
    if (!token) {
        setCarregando(false);
        return;
    }

    let ativo = true;

    async function carregarCasos() {
        try {
        const dados = await buscarCasosJuridicos(token!);

        if (ativo) {
            setCasos(dados);
            setErro("");
        }
        } catch {
        if (ativo) {
            setErro("Não foi possível carregar os casos jurídicos.");
        }
        } finally {
        if (ativo) {
            setCarregando(false);
        }
        }
    }

    carregarCasos();

    return () => {
        ativo = false;
    };
    }, [token, atualizarLista]);


  return (
    <div className="casos-juridicos-pagina">
      <h1>Casos Jurídicos</h1>

      <p>
        Consulte e acompanhe os casos jurídicos
        registrados na Prática Jurídica.
      </p>

      <button
        type="button"
        className="botao-novo-caso"
        onClick={() => setMostrarFormulario(true)}
        >
        + Novo Caso Jurídico
      </button>
 
        {mostrarFormulario && (
            <FormularioCasoJuridico
                aoCancelar={() => setMostrarFormulario(false)}
                aoCadastrar={() => {
                setMostrarFormulario(false);
                setAtualizarLista((valorAnterior) => valorAnterior + 1);
                }}
            />
        )}

      <section className="casos-juridicos-lista">
            <h2>Lista de Casos Jurídicos</h2>

            {carregando && <p>Carregando casos jurídicos...</p>}

            {erro && <p role="alert">{erro}</p>}

            {!carregando && !erro && casos.length === 0 && (
                <p>Nenhum caso jurídico encontrado.</p>
            )}

            {!carregando && !erro && casos.length > 0 && (
            <div className="casos-juridicos-tabela-container">
                <p>Total de casos jurídicos: {casos.length}</p>

                <table className="casos-juridicos-tabela">
                    <thead>
                        <tr>
                        <th>Título</th>
                        <th>Assistido</th>
                        <th>Aluno</th>
                        <th>Professor</th>
                        <th>Situação</th>
                        </tr>
                    </thead>
                 
                    <tbody>
                        {casos.map((caso) => (
                            <tr key={caso.id}>
                            <td>{caso.titulo}</td>

                            <td>{caso.assistido.nome}</td>

                            <td>{caso.aluno?.nome ?? "Não informado"}</td>

                            <td>{caso.professor?.nome ?? "Não informado"}</td>
                     
                            <td>
                                <span
                                    className={`caso-situacao caso-situacao-${caso.situacao.toLowerCase()}`}
                                >
                                    {caso.situacao === "ABERTO"
                                    ? "Aberto"
                                    : caso.situacao === "EM_ANDAMENTO"
                                        ? "Em andamento"
                                        : "Encerrado"}
                                </span>
                            </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            )}

        </section>
    </div>
  );
}

export default CasosJuridicos;
