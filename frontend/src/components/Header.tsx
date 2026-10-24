import { Bell, UserCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import "./Header.css"

function Header() {
  const { usuario } = useAuth();

  return (
    <header className="header">
      <div className="header-titulo">
        <h2>Sistema de Gestão da Prática Jurídica</h2>
      </div>

      <div className="header-usuario">
        <Bell size={22} aria-label="Notificações" />

        <div className="usuario-info">
          <span>{usuario?.nome}</span>
          <small>{usuario?.perfil}</small>
        </div>

        <UserCircle size={35} />
      </div>
    </header>
  );
}

export default Header;
