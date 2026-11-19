import "./CasosJuridicos.css"
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import FormularioCasoJuridico from "../components/FormularioCasoJuridico";
import FormularioEditarCasoJuridico from "../components/FormularioEditarCasoJuridico";
import FormularioResponsaveisCaso from "../components/FormularioResponsaveisCaso";

import {
  buscarCasosJuridicos,
  type CasoJuridico,
} from "../services/casosJuridicosService";

function CasosJuridicos() {
    const { token, usuario } = useAuth();

    const [casos, setCasos] = useState<CasoJuridico[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [atualizarLista, setAtualizarLista] = useState(0);
    const [casoEmEdicao, setCasoEmEdicao] = useState<CasoJuridico | null>(null);
    const [casoParaResponsaveis, setCasoParaResponsaveis] =
    useState<CasoJuridico | null>(null);

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
        onClick={() => {
          setCasoEmEdicao(null);
          setCasoParaResponsaveis(null);
          setMostrarFormulario(true);
        }}
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

        {casoEmEdicao && (
          <FormularioEditarCasoJuridico
            key={casoEmEdicao.id}
            caso={casoEmEdicao}
            aoCancelar={() => setCasoEmEdicao(null)}
            aoAtualizar={() => {
              setCasoEmEdicao(null);
              setAtualizarLista((valorAnterior) => valorAnterior + 1);
            }}
          />
        )}

        {usuario?.perfil === "ADMIN" &&
          casoParaResponsaveis &&
          token && (
            <FormularioResponsaveisCaso
              key={casoParaResponsaveis.id}
              casoId={casoParaResponsaveis.id}
              token={token}
              alunoIdAtual={casoParaResponsaveis.alunoId}
              professorIdAtual={casoParaResponsaveis.professorId}
              aoCancelar={() => {
                setCasoParaResponsaveis(null);
              }}
              aoSalvar={() => {
                setCasoParaResponsaveis(null);
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
                        {(usuario?.perfil === "ADMIN" ||
                          usuario?.perfil === "PROFESSOR") && (
                          <th>Ações</th>
                        )}
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

                            {(usuario?.perfil === "ADMIN" ||
                              usuario?.perfil === "PROFESSOR") && (
                              <td>
                                {(usuario.perfil === "ADMIN" ||
                                  caso.professorId === usuario.id) && (
                                  <button
                                    type="button"
                                    className="botao-editar-caso"
                                    onClick={() => {
                                      setMostrarFormulario(false);
                                      setCasoParaResponsaveis(null);
                                      setCasoEmEdicao(caso);
                                    }}
                                  >
                                    Editar
                                  </button>
                                )}

                                {usuario?.perfil === "ADMIN" && (
                                  <button
                                    type="button"
                                    className="botao-atribuir-responsaveis"
                                    onClick={() => {
                                      setMostrarFormulario(false);
                                      setCasoEmEdicao(null);
                                      setCasoParaResponsaveis(caso);
                                    }}
                                  >
                                    Atribuir Responsáveis
                                  </button>
                                )}
                              </td>
                            )}
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
