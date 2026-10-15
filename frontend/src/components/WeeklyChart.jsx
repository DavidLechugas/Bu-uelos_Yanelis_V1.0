/**
 * Gráfica ligera de barras (SVG) con los últimos 7 días.
 * Sin dependencias: colores planos caramelo, accesible con
 * role="img" y <title> por barra.
 *
 * Las etiquetas de los días son HTML (.chart-x-axis) bajo
 * la SVG, no texto dentro de ella: así su tamaño (mínimo
 * 14 px) no escala con el ancho de la gráfica y se alinea
 * con las barras (mismo padding proporcional 28/320).
 */
export function WeeklyChart({ data }) {
  const width = 320;
  const height = 170;
  const padding = 28;
  const max = Math.max(...data.map((day) => day.ventas), 1);
  const slot = (width - padding * 2) / data.length;

  return (
    <>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="weekly-chart"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Gráfica de ventas de los últimos 7 días. Total ${data
          .map((d) => d.ventas)
          .reduce((a, b) => a + b, 0)} pesos.`}
      >
        {data.map((day, index) => {
          const barHeight = Math.max(
            (day.ventas / max) * (height - padding * 2),
            2,
          );
          const x = padding + index * slot + 4;
          const y = height - padding - barHeight;
          return (
            <g key={day.dia}>
              <rect
                x={x}
                y={y}
                width={slot - 8}
                height={barHeight}
                rx={3}
                className="chart-bar"
              />
              <title>{`${day.dia}: $${day.ventas.toLocaleString('es-CO')} pesos`}</title>
            </g>
          );
        })}
      </svg>
      <div className="chart-x-axis" aria-hidden="true">
        {data.map((day) => (
          <span key={day.dia}>{day.dia}</span>
        ))}
      </div>
    </>
  );
}
