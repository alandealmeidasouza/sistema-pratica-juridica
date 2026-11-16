
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

type Usuario = {
  id: string;
  nome: string;
  email: string;
  perfil: "ADMIN" | "PROFESSOR" | "ALUNO";
};

type AuthContextType = {
  usuario: Usuario | null;
  token: string | null;
  entrar: (usuario: Usuario, token: string) => void;
  sair: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: ReactNode }) {
  
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    try {
      const usuarioSalvo = sessionStorage.getItem("usuario");

      return usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem("token");
  });

  function entrar(usuario: Usuario, token: string) {
    sessionStorage.setItem("usuario", JSON.stringify(usuario));
    sessionStorage.setItem("token", token);

    setUsuario(usuario);
    setToken(token);
  }

  function sair() {
    sessionStorage.removeItem("usuario");
    sessionStorage.removeItem("token");

    setUsuario(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider
      value={{ usuario, token, entrar, sair }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error(
      "useAuth deve ser utilizado dentro de AuthProvider."
    );
  }

  return contexto;
}
