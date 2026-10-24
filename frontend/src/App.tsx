import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { useAuth } from "./contexts/AuthContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Assistidos from "./pages/Assistidos";
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


