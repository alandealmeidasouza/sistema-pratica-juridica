
const API_URL = "http://localhost:3000";

export type ResumoDashboard = {
  totalCasos: number;
  totalAtividades: number;
  atividadesPendentes: number;
  totalPrazos: number;
  prazosPendentes: number;
  totalDocumentos: number;
  totalAtendimentos: number;
};

export async function buscarResumoDashboard(
  token: string
): Promise<ResumoDashboard> {
  const resposta = await fetch(
    `${API_URL}/dashboard/resumo`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!resposta.ok) {
    throw new Error(
      "Não foi possível carregar os indicadores do Dashboard."
    );
  }

  const dados: { resumo: ResumoDashboard } =
    await resposta.json();

  return dados.resumo;
}
