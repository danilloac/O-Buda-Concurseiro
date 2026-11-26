export function Anel({ valor, total, tamanho = 76 }: { valor: number; total: number; tamanho?: number }) {
  const r = tamanho / 2 - 7
  const c = 2 * Math.PI * r
  const frac = total > 0 ? Math.min(1, valor / total) : 0
  return (
    <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} role="img" aria-label={`${valor} de ${total}`}>
      <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke="var(--superficie-2)" strokeWidth="8" />
      <circle
        cx={tamanho / 2}
        cy={tamanho / 2}
        r={r}
        fill="none"
        stroke="var(--ideal)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${c * frac} ${c}`}
        transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--texto)">
        {Math.round(frac * 100)}%
      </text>
    </svg>
  )
}
