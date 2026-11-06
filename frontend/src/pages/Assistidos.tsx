import FormularioAssistido from "../components/FormularioAssistido";
import { useEffect, useState } from "react";
import { Plus, Pencil } from "lucide-react";

import { useAuth } from "../contexts/AuthContext";

import {
  buscarAssistidos,
  type Assistido,
} from "../services/assistidosService";

import "./Assistidos.css";

function Assistidos() {
  const { token } = useAuth();

  const [assistidos, setAssistidos] = useState<Assistido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [assistidoSelecionado, setAssistidoSelecionado] =
  useState<Assistido | null>(null);

  useEffect(() => {
    if (!token) {
      setCarregando(false);
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
          setCarregando(false);
        }
      }
    }

    carregarAssistidos();

    return () => {
      ativo = false;
    };
  }, [token]);

  async function handleAssistidoCadastrado() {
  if (!token) return;

  try {
    const dados = await buscarAssistidos(token);
    setAssistidos(dados);
    setErro("");
  } catch {
    setErro("Não foi possível atualizar a lista de assistidos.");
  }
}

function handleEditarAssistido(assistido: Assistido) {
  setAssistidoSelecionado(assistido);
  setMostrarFormulario(true);
}

  return (
    <div className="assistidos-pagina">
      <div className="assistidos-cabecalho">
        <div>
          <h1>Assistidos</h1>
          <p>
            Gerencie os dados das pessoas atendidas
            pela Prática Jurídica.
          </p>
        </div>

        <button
          type="button"
          className="assistidos-botao"
          onClick={() => {
            setAssistidoSelecionado(null);
            setMostrarFormulario(true);
          }}
        >
          <Plus size={18} />
          Novo Assistido
        </button>
      </div>

      {mostrarFormulario && (
        <FormularioAssistido
          key={assistidoSelecionado?.id ?? "novo"}
          assistido={assistidoSelecionado}
          aoCancelar={() => setMostrarFormulario(false)}
          aoCadastrar={handleAssistidoCadastrado}
        />
      )}

      <section className="assistidos-lista">
        <h2>Lista de Assistidos</h2>

        {carregando && <p>Carregando assistidos...</p>}

        {erro && <p role="alert">{erro}</p>}

        {!carregando && !erro && assistidos.length === 0 && (
          <p>Nenhum assistido encontrado.</p>
        )}

        {!carregando && !erro && assistidos.length > 0 && (
          
        <div className="assistidos-tabela-container">
          <table className="assistidos-tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {assistidos.map((assistido) => (
                <tr key={assistido.id}>
                  <td>{assistido.nome}</td>
                  <td>{assistido.cpf}</td>
                  <td>{assistido.telefone}</td>
                  <td>{assistido.email || "Não informado"}</td>

                  <td>
                    <button
                      type="button"
                      className="assistidos-botao-editar"
                      aria-label={`Editar ${assistido.nome}`}
                      onClick={() => handleEditarAssistido(assistido)}
                    >
                      <Pencil size={16} />
                      Editar
                    </button>
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

export default Assistidos;


