import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { useAuth } from "./contexts/AuthContext";

import Login from "./pages/Login";
import DefinirSenha from "./pages/DefinirSenha";
import Dashboard from "./pages/Dashboard";
import Assistidos from "./pages/Assistidos";
import Atendimentos from "./pages/Atendimentos";
import CasosJuridicos from "./pages/CasosJuridicos";
import GerenciamentoUsuarios from "./pages/GerenciamentoUsuarios";
import LayoutPrincipal from "./layouts/LayoutPrincipal";

function App() {
  const { usuario } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            usuario ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login />
            )
          }
        />

        <Route path="/definir-senha" element={<DefinirSenha />} />

        {/* Páginas internas protegidas */}
        <Route
          element={
            usuario ? (
              <LayoutPrincipal />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assistidos" element={<Assistidos />} />
          <Route path="/atendimentos" element={<Atendimentos />} />
          <Route path="/casos-juridicos" element={<CasosJuridicos />}/>
          <Route
            path="/gerenciamento-usuarios"
            element={
              usuario?.perfil === "ADMIN" ? (
                <GerenciamentoUsuarios />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
        </Route>

        {/* Redirecionamento para endereços desconhecidos */}
        <Route
          path="*"
          element={
            <Navigate
              to={usuario ? "/dashboard" : "/login"}
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


