import "./Sidebar.css";
import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Scale,
  CheckSquare,
  CalendarClock,
  FileText,
  UserCog,
  LogOut,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";

function Sidebar() {
  const { usuario, sair } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Scale size={30} />
        <span>Prática Jurídica</span>
      </div>

      <nav className="sidebar-menu" aria-label="Menu principal">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `menu-item ${isActive ? "ativo" : ""}`
          }
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/assistidos"
          className={({ isActive }) =>
            `menu-item ${isActive ? "ativo" : ""}`
          }
        >
          <Users size={20} />
          <span>Assistidos</span>
        </NavLink>

        
        <NavLink
          to="/atendimentos"
          className={({ isActive }) =>
            `menu-item ${isActive ? "ativo" : ""}`
          }
        >
          <ClipboardList size={20} />
          <span>Atendimentos</span>
        </NavLink>

        <button type="button" className="menu-item">
          <Scale size={20} />
          <span>Casos Jurídicos</span>
        </button>

        <button type="button" className="menu-item">
          <CheckSquare size={20} />
          <span>Atividades</span>
        </button>

        <button type="button" className="menu-item">
          <CalendarClock size={20} />
          <span>Prazos</span>
        </button>

        <button type="button" className="menu-item">
          <FileText size={20} />
          <span>Documentos</span>
        </button>

        {usuario?.perfil === "ADMIN" && (
          <button type="button" className="menu-item">
            <UserCog size={20} />
            <span>Usuários</span>
          </button>
        )}
      </nav>

      <div className="sidebar-rodape">
        <button
          type="button"
          className="menu-item"
          onClick={sair}
        >
          <LogOut size={20} />
          <span>Sair do sistema</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;

