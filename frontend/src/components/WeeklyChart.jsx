/** Barras SVG de los últimos 7 días; las etiquetas de día son HTML para que su tamaño no escale con la gráfica. */
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
