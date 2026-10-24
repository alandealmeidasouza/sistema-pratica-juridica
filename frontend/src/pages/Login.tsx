import { useState } from "react";
import type { SubmitEvent } from "react";
import { Scale, Mail, LockKeyhole, Eye, EyeOff } from "lucide-react";
import { realizarLogin } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";
import "./Login.css";

function Login() {

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const { entrar } = useAuth();


  async function handleLogin(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    setErro("");
    setCarregando(true);

    try {
      const resultado = await realizarLogin({
        email,
        senha,
      });

      // Armazena os dados no contexto de autenticação
      entrar(resultado.usuario, resultado.token);

      console.log("Login realizado com sucesso!");
      console.log("Usuário:", resultado.usuario.nome);
      console.log("Perfil:", resultado.usuario.perfil);

    } catch (error) {
      if (error instanceof Error) {
        setErro(error.message);
      } else {
        setErro("Ocorreu um erro ao realizar o login.");
      }
    } finally {
      setCarregando(false);
    }
  }


  return (
    <main className="pagina-login">
      <section className="login-container">

        {/* Apresentação do sistema */}
        <div className="login-apresentacao">
          <Scale size={60} strokeWidth={1.5} />

          <h1>Sistema de Gestão da Prática Jurídica</h1>

          <p>
            Gerenciamento de assistidos, atendimentos
            e casos jurídicos em um só lugar.
          </p>
        </div>

        {/* Formulário de login */}
        <div className="login-formulario">
          <div className="login-cabecalho">
            <h2>Acesse sua conta</h2>

            <p>
              Entre com suas credenciais para continuar.
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="campo">
              <label htmlFor="email">
                <Mail size={17} />
                E-mail
              </label>

              <input
                type="email"
                id="email"
                placeholder="Digite seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="senha">
                <LockKeyhole size={17} />
                Senha
              </label>

              <div className="senha-container">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  id="senha"
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="botao-mostrar-senha"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {erro && (
              <p role="alert" className="login-erro">
                {erro}
              </p>
            )}

            <button type="submit" disabled={carregando}>
              {carregando ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

      </section>
    </main>
  );
}

export default Login;
