import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import FormularioUsuario from "../components/FormularioUsuario";
import FormularioEditarUsuario from "../components/FormularioEditarUsuario";
import "./GerenciamentoUsuarios.css";

import {
  listarUsuariosGerenciamento,
  alterarSituacaoUsuario,
  type UsuarioGerenciamento
} from "../services/usuariosService";

export default function GerenciamentoUsuarios() {
  const { token } = useAuth();

  const [usuarios, setUsuarios] = useState<UsuarioGerenciamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const [filtroPerfil, setFiltroPerfil] = useState("TODOS");
  const [filtroSituacao, setFiltroSituacao] = useState("TODOS");

  const [exibirFormulario, setExibirFormulario] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] =
  useState<UsuarioGerenciamento | null>(null);

  const [mensagemOperacao, setMensagemOperacao] = useState("");
  const [operacaoBemSucedida, setOperacaoBemSucedida] = useState(false);
  const [atualizarLista, setAtualizarLista] = useState(0);
  const [alterandoSituacao, setAlterandoSituacao] =
  useState(false);
  const botaoNovoUsuarioRef = useRef<HTMLButtonElement>(null);
  const botaoEditarUsuarioRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!exibirFormulario) {
      botaoNovoUsuarioRef.current?.focus();
    }
  }, [exibirFormulario]);

  useEffect(() => {
    if (!usuarioSelecionado && botaoEditarUsuarioRef.current) {
      botaoEditarUsuarioRef.current.focus();
      botaoEditarUsuarioRef.current = null;
    }
  }, [usuarioSelecionado]);

  useEffect(() => {
  if (!token) {
    setCarregando(false);
    return;
  }

  async function carregarUsuarios(tokenAtual: string) {
    setCarregando(true);
    setErro("");

    try {
      const dados = await listarUsuariosGerenciamento(tokenAtual);

      setUsuarios(dados);

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

  carregarUsuarios(token);
}, [token, atualizarLista]);

  async function handleAlterarSituacao(
    usuario: UsuarioGerenciamento
  ) {
    if (!token || alterandoSituacao) return;

    const novaSituacao = !usuario.ativo;
    const acao = novaSituacao ? "ativar" : "desativar";

    const confirmou = window.confirm(
      `Deseja realmente ${acao} o usuário ${usuario.nome}?`
    );

    if (!confirmou) return;

    setMensagemOperacao("");
    setAlterandoSituacao(true);

    try {
      const dados = await alterarSituacaoUsuario(
        token,
        usuario.id,
        novaSituacao
      );

      setMensagemOperacao(dados.mensagem);
      setOperacaoBemSucedida(true);
      setAtualizarLista((anterior) => anterior + 1);

    } catch (erro) {
      setMensagemOperacao(
        erro instanceof Error
          ? erro.message
          : "Erro ao alterar situação do usuário."
      );

      setOperacaoBemSucedida(false);

    } finally {
      setAlterandoSituacao(false);
    }
  }

  const usuariosFiltrados = usuarios.filter((usuario) => {
  const termo = pesquisa.trim().toLowerCase();

  const correspondePesquisa =
    usuario.nome.toLowerCase().includes(termo) ||
    usuario.email.toLowerCase().includes(termo);

  const correspondePerfil =
    filtroPerfil === "TODOS" ||
    usuario.perfil === filtroPerfil;

  const correspondeSituacao =
    filtroSituacao === "TODOS" ||
    (filtroSituacao === "ATIVO" && usuario.ativo) ||
    (filtroSituacao === "INATIVO" &&
      !usuario.ativo &&
      usuario.senhaDefinida) ||
    (filtroSituacao === "PENDENTE" &&
      !usuario.ativo &&
      !usuario.senhaDefinida);

  return (
    correspondePesquisa &&
    correspondePerfil &&
    correspondeSituacao
  );
});

  return (
  <div className="pagina-gerenciamento-usuarios">
    <h1>Gerenciamento de usuários</h1>

    <p>Gerencie os usuários cadastrados no sistema.</p>

    <button
      ref={botaoNovoUsuarioRef}
      type="button"
      className="botao-novo-usuario"
      onClick={() => {
        setMensagemOperacao("");
        setExibirFormulario(true);
      }}
    >
      + Novo usuário
    </button>

    {mensagemOperacao && (
      <div
        className={`mensagem-cadastro ${
          operacaoBemSucedida
            ? "mensagem-cadastro-sucesso"
            : "mensagem-cadastro-aviso"
        }`}
        role="status"
      >
        {mensagemOperacao}
      </div>
    )}

    {exibirFormulario && (
      <div className="modal-usuario-overlay">
        <div
          className="modal-usuario"
          onKeyDown={(e) => {
            if (e.key !== "Tab") return;

            const elementos = e.currentTarget.querySelectorAll<HTMLElement>(
              "input:not(:disabled), select:not(:disabled), button:not(:disabled)"
            );

            if (elementos.length === 0) return;

            const primeiro = elementos[0];
            const ultimo = elementos[elementos.length - 1];

            if (e.shiftKey && document.activeElement === primeiro) {
              e.preventDefault();
              ultimo.focus();
            } else if (!e.shiftKey && document.activeElement === ultimo) {
              e.preventDefault();
              primeiro.focus();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Cadastrar usuário"
        >
          <FormularioUsuario
            aoSalvar={(mensagem, conviteEnviado) => {
              setMensagemOperacao(mensagem);
              setOperacaoBemSucedida(conviteEnviado);
              setExibirFormulario(false);
              setAtualizarLista((anterior) => anterior + 1);
            }}
            aoCancelar={() => setExibirFormulario(false)}
          />
        </div>
      </div>
    )}

    {usuarioSelecionado && (
      <div className="modal-usuario-overlay">
        <div
          className="modal-usuario"
          role="dialog"
          aria-modal="true"
          aria-label="Editar usuário"
          onKeyDown={(e) => {
            if (e.key !== "Tab") return;

            const elementos =
              e.currentTarget.querySelectorAll<HTMLElement>(
                "input:not(:disabled), select:not(:disabled), button:not(:disabled)"
              );

            if (elementos.length === 0) return;

            const primeiro = elementos[0];
            const ultimo = elementos[elementos.length - 1];

            if (e.shiftKey && document.activeElement === primeiro) {
              e.preventDefault();
              ultimo.focus();
            } else if (
              !e.shiftKey &&
              document.activeElement === ultimo
            ) {
              e.preventDefault();
              primeiro.focus();
            }
          }}
        >
          <FormularioEditarUsuario
            usuario={usuarioSelecionado}
            aoSalvar={(mensagem) => {
              setMensagemOperacao(mensagem);
              setOperacaoBemSucedida(true);
              setUsuarioSelecionado(null);
              setAtualizarLista((anterior) => anterior + 1);
            }}
            aoCancelar={() => setUsuarioSelecionado(null)}
          />
        </div>
      </div>
    )}

    <div className="filtros-usuarios">
        <input
            id="pesquisa-usuarios"
            type="search"
            placeholder="Pesquisar por nome ou email..."
            aria-label="Pesquisar usuários por nome ou email"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="pesquisa-usuarios"
        />

        <select
          id="filtro-perfil"
          className="filtro-perfil-usuarios"
          aria-label="Filtrar usuários por perfil"
          value={filtroPerfil}
          onChange={(e) => setFiltroPerfil(e.target.value)}
        >
          <option value="TODOS">Todos os perfis</option>
          <option value="ADMIN">Administrador</option>
          <option value="PROFESSOR">Professor</option>
          <option value="ALUNO">Aluno</option>
        </select>

        <select
          id="filtro-situacao"
          className="filtro-situacao-usuarios"
          aria-label="Filtrar usuários por situação"
          value={filtroSituacao}
          onChange={(e) => setFiltroSituacao(e.target.value)}
        >
          <option value="TODOS">Todas as situações</option>
          <option value="ATIVO">Ativos</option>
          <option value="INATIVO">Inativos</option>
          <option value="PENDENTE">Pendentes</option>
        </select>

        <button
            type="button"
            className="botao-limpar-filtros"
            onClick={() => {
                setPesquisa("");
                setFiltroPerfil("TODOS");
                setFiltroSituacao("TODOS");
            }}
        >
            Limpar filtros
        </button>
        
    </div>

    {carregando && <p>Carregando usuários...</p>}

    {erro && <p role="alert">{erro}</p>}

    {!carregando && !erro && (
      <div className="tabela-usuarios-container">
        <table className="tabela-usuarios">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Perfil</th>
              <th>Situação</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {usuariosFiltrados.map((usuario) => (
              <tr key={usuario.id}>
                <td>{usuario.nome}</td>
                <td>{usuario.email}</td>
                <td>{usuario.perfil}</td>
                <td>
                    <span
                      className={`situacao-usuario ${
                        usuario.ativo
                          ? "usuario-ativo"
                          : usuario.senhaDefinida
                            ? "usuario-inativo"
                            : "usuario-pendente"
                      }`}
                    >
                      {usuario.ativo
                        ? "Ativo"
                        : usuario.senhaDefinida
                          ? "Inativo"
                          : "Pendente"}
                    </span>
                </td>
                <td>
                  <div className="acoes-usuario">
                    <button
                      type="button"
                      className="botao-editar-usuario"
                      disabled={alterandoSituacao}
                      onClick={(e) => {
                        setMensagemOperacao("");
                        botaoEditarUsuarioRef.current = e.currentTarget;
                        setUsuarioSelecionado(usuario);
                      }}
                    >
                      Editar
                    </button>

                    {usuario.senhaDefinida && (
                      <button
                        type="button"
                        className={
                          usuario.ativo
                            ? "botao-desativar-usuario"
                            : "botao-ativar-usuario"
                        }
                        disabled={alterandoSituacao}
                        onClick={() => handleAlterarSituacao(usuario)}
                      >
                        {usuario.ativo ? "Desativar" : "Ativar"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {usuariosFiltrados.length === 0 && (
              <tr>
                <td colSpan={5}>Nenhum usuário encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )}
  </div>
);
}