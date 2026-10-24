import "./CardIndicador.css";
import type { LucideIcon } from "lucide-react";

type CardIndicadorProps = {
  titulo: string;
  valor: number;
  icone: LucideIcon;
};

function CardIndicador({
  titulo,
  valor,
  icone: Icone,
}: CardIndicadorProps) {
  return (
    <article className="card-indicador">
      <div className="card-indicador-informacoes">
        <p>{titulo}</p>
        <strong>{valor}</strong>
      </div>

      <div className="card-indicador-icone">
        <Icone size={26} />
      </div>
    </article>
  );
}

export default CardIndicador;
