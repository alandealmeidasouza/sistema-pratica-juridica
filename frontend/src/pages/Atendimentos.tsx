import "./Atendimentos.css";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

import {
  buscarAtendimentos,
  type Atendimento,
} from "../services/atendimentosService";

function Atendimentos() {
  const { token } = useAuth();

  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!token) {
      setCarregando(false);
      return;
    }

    let ativo = true;

    async function carregarAtendimentos() {
      try {
        const dados = await buscarAtendimentos(token!);

        if (ativo) {
          setAtendimentos(dados);
        }
      } catch {
        if (ativo) {
          setErro("Não foi possível carregar os atendimentos.");
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarAtendimentos();

    return () => {
      ativo = false;
    };
  }, [token]);

  return (
    <div className="atendimentos-pagina">
      <h1>Atendimentos</h1>

      <p>
        Consulte os atendimentos realizados na Prática Jurídica.
      </p>

      <section className="atendimentos-lista">
        <h2>Lista de Atendimentos</h2>

        {carregando && <p>Carregando atendimentos...</p>}

        {erro && <p role="alert">{erro}</p>}

        {!carregando && !erro && atendimentos.length === 0 && (
          <p>Nenhum atendimento encontrado.</p>
        )}

        {!carregando && !erro && atendimentos.length > 0 && (
          <div className="atendimentos-tabela-container">
            <table className="atendimentos-tabela">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Assistido</th>
                  <th>Descrição</th>
                  <th>Caso Jurídico</th>
                  <th>Responsável</th>
                </tr>
              </thead>

              <tbody>
                {atendimentos.map((atendimento) => (
                  <tr key={atendimento.id}>
                    <td>
                      {new Date(atendimento.data).toLocaleDateString("pt-BR", {
                        timeZone: "UTC",
                      })}
                    </td>
                    <td>{atendimento.assistido.nome}</td>
                    <td>{atendimento.descricao}</td>
                    <td>
                      {atendimento.caso?.titulo || "Atendimento inicial"}
                    </td>
                    <td>{atendimento.responsavel?.nome ?? "Não informado"}</td>
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

export default Atendimentos;
