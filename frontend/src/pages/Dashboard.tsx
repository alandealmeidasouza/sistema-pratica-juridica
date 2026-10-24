import { useEffect, useState } from "react";

import {
  Scale,
  ClipboardList,
  ListChecks,
  CalendarClock,
} from "lucide-react";

import CardIndicador from "../components/CardIndicador";

import { useAuth } from "../contexts/AuthContext";

import {
  buscarResumoDashboard,
  type ResumoDashboard,
} from "../services/dashboardService";

import "./Dashboard.css";

function Dashboard() {
  const { usuario, token } = useAuth();

  const [resumo, setResumo] = useState<ResumoDashboard | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!token) {
      setCarregando(false);
      return;
    }

    let ativo = true;

    async function carregarResumo() {
      try {
        const dados = await buscarResumoDashboard(token!);

        if (ativo) {
          setResumo(dados);
        }
      } catch {
        if (ativo) {
          setErro("Não foi possível carregar os indicadores.");
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarResumo();

    return () => {
      ativo = false;
    };
  }, [token]);

  return (
    <>
      <h1>Painel de Controle</h1>

      <h2>Bem-vindo(a), {usuario?.nome}!</h2>

      <p>
        Acompanhe as principais informações da
        Prática Jurídica.
      </p>

      {carregando && <p>Carregando indicadores...</p>}

      {erro && <p role="alert">{erro}</p>}

      {!carregando && !erro && resumo && (
        <section
          className="dashboard-indicadores"
          aria-label="Indicadores do sistema"
        >
          <CardIndicador
            titulo="Total de Casos Jurídicos"
            valor={resumo.totalCasos}
            icone={Scale}
          />

          <CardIndicador
            titulo="Total de Atendimentos"
            valor={resumo.totalAtendimentos}
            icone={ClipboardList}
          />

          <CardIndicador
            titulo="Atividades Pendentes"
            valor={resumo.atividadesPendentes}
            icone={ListChecks}
          />

          <CardIndicador
            titulo="Prazos Pendentes"
            valor={resumo.prazosPendentes}
            icone={CalendarClock}
          />
        </section>
      )}
    </>
  );
}

export default Dashboard;




