
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
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);

  function entrar(usuario: Usuario, token: string) {
    setUsuario(usuario);
    setToken(token);
  }

  function sair() {
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
