import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import "../pages/Dashboard.css";

function LayoutPrincipal() {
  return (
    <div className="dashboard-layout">
      <Header />

      <div className="dashboard-corpo">
        <Sidebar />

        <main className="dashboard-conteudo">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default LayoutPrincipal;
