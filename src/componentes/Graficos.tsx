import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Largura real do contêiner, para desenhar o SVG sem distorcer o texto. */
function useLargura<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e.contentRect.width)))
    ro.observe(el)
    setW(Math.floor(el.getBoundingClientRect().width))
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

export interface Ponto {
  rotulo: string // eixo x, curto (ex.: 19/10)
  valor: number | null
  dica: ReactNode // conteúdo do tooltip
}

interface Props {
  pontos: Ponto[]
  altura?: number
  formato: (v: number) => string
  rotuloEixo: string
}

const M = { topo: 16, dir: 12, base: 26, esq: 40 }

function ticks(max: number, n = 4): number[] {
  if (max <= 0) return [0]
  const bruto = max / n
  const mag = 10 ** Math.floor(Math.log10(bruto))
  const passo = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((p) => p >= bruto) ?? bruto
  const lista: number[] = []
  for (let v = 0; v <= max + 1e-9; v += passo) lista.push(Math.round(v * 1000) / 1000)
  if (lista[lista.length - 1] < max) lista.push(lista[lista.length - 1] + passo)
  return lista
}

function Dica({ x, y, largura, children }: { x: number; y: number; largura: number; children: ReactNode }) {
  const esquerda = x > largura - 150
  return (
    <div
      className="dica-grafico"
      role="status"
      style={{ left: esquerda ? undefined : x + 12, right: esquerda ? largura - x + 12 : undefined, top: Math.max(0, y - 10) }}
    >
      {children}
    </div>
  )
}

/** Colunas verticais de uma série (ex.: questões por semana). */
export function GraficoColunas({ pontos, altura = 200, formato, rotuloEixo }: Props) {
  const [ref, largura] = useLargura<HTMLDivElement>()
  const [ativo, setAtivo] = useState<number | null>(null)
  const max = Math.max(1, ...pontos.map((p) => p.valor ?? 0))
  const ys = ticks(max)
  const topoEscala = ys[ys.length - 1]
  const w = Math.max(0, largura - M.esq - M.dir)
  const h = altura - M.topo - M.base
  const banda = pontos.length ? w / pontos.length : 0
  const barra = Math.min(48, banda * 0.6)
  const y = (v: number) => M.topo + h - (v / topoEscala) * h

  return (
    <div ref={ref} className="grafico" aria-label={rotuloEixo}>
      {largura > 0 && (
        <svg width={largura} height={altura} role="img" aria-label={rotuloEixo}>
          {ys.map((t) => (
            <g key={t}>
              <line x1={M.esq} x2={M.esq + w} y1={y(t)} y2={y(t)} className="grade-linha" />
              <text x={M.esq - 8} y={y(t)} className="eixo-texto" textAnchor="end" dominantBaseline="central">
                {formato(t)}
              </text>
            </g>
          ))}
          {pontos.map((p, i) => {
            const cx = M.esq + banda * i + banda / 2
            const v = p.valor ?? 0
            const topo = y(v)
            const alt = M.topo + h - topo
            const r = Math.min(4, alt / 2, barra / 2)
            return (
              <g key={i}>
                {alt > 0 && (
                  <path
                    className={`marca-barra${ativo === i ? ' ativa' : ''}`}
                    d={`M${cx - barra / 2},${M.topo + h} V${topo + r} Q${cx - barra / 2},${topo} ${cx - barra / 2 + r},${topo} H${cx + barra / 2 - r} Q${cx + barra / 2},${topo} ${cx + barra / 2},${topo + r} V${M.topo + h} Z`}
                  />
                )}
                <text x={cx} y={altura - 8} className="eixo-texto" textAnchor="middle">
                  {p.rotulo}
                </text>
                <rect
                  x={cx - banda / 2}
                  y={M.topo}
                  width={banda}
                  height={h}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${p.rotulo}: ${formato(v)}`}
                  onPointerEnter={() => setAtivo(i)}
                  onPointerLeave={() => setAtivo(null)}
                  onFocus={() => setAtivo(i)}
                  onBlur={() => setAtivo(null)}
                />
              </g>
            )
          })}
          <line x1={M.esq} x2={M.esq + w} y1={M.topo + h} y2={M.topo + h} className="eixo-linha" />
        </svg>
      )}
      {ativo !== null && pontos[ativo] && (
        <Dica x={M.esq + banda * ativo + banda / 2} y={y(pontos[ativo].valor ?? 0)} largura={largura}>
          {pontos[ativo].dica}
        </Dica>
      )}
    </div>
  )
}

/** Linha de uma série em 0–100%, com uma linha de referência (meta). */
export function GraficoLinha({
  pontos,
  altura = 200,
  formato,
  rotuloEixo,
  referencia,
}: Props & { referencia?: { valor: number; rotulo: string } }) {
  const [ref, largura] = useLargura<HTMLDivElement>()
  const [ativo, setAtivo] = useState<number | null>(null)
  const w = Math.max(0, largura - M.esq - M.dir)
  const h = altura - M.topo - M.base
  const passo = pontos.length > 1 ? w / (pontos.length - 1) : 0
  const x = (i: number) => M.esq + (pontos.length > 1 ? passo * i : w / 2)
  const y = (v: number) => M.topo + h - v * h
  const ys = [0, 0.25, 0.5, 0.75, 1]

  // Quebra a linha nas semanas sem questões.
  const trechos: string[] = []
  let atual = ''
  pontos.forEach((p, i) => {
    if (p.valor === null) {
      if (atual) trechos.push(atual)
      atual = ''
    } else atual += `${atual ? 'L' : 'M'}${x(i)},${y(p.valor)} `
  })
  if (atual) trechos.push(atual)

  return (
    <div ref={ref} className="grafico" aria-label={rotuloEixo}>
      {largura > 0 && (
        <svg width={largura} height={altura} role="img" aria-label={rotuloEixo}>
          {ys.map((t) => (
            <g key={t}>
              <line x1={M.esq} x2={M.esq + w} y1={y(t)} y2={y(t)} className="grade-linha" />
              <text x={M.esq - 8} y={y(t)} className="eixo-texto" textAnchor="end" dominantBaseline="central">
                {formato(t)}
              </text>
            </g>
          ))}
          {referencia && (
            <g>
              <line
                x1={M.esq}
                x2={M.esq + w}
                y1={y(referencia.valor)}
                y2={y(referencia.valor)}
                className="referencia"
              />
              <text x={M.esq + w} y={y(referencia.valor) - 6} className="eixo-texto forte" textAnchor="end">
                {referencia.rotulo}
              </text>
            </g>
          )}
          {ativo !== null && <line x1={x(ativo)} x2={x(ativo)} y1={M.topo} y2={M.topo + h} className="mira" />}
          {trechos.map((d, i) => (
            <path key={i} d={d} className="marca-linha" />
          ))}
          {pontos.map((p, i) =>
            p.valor === null ? null : (
              <circle
                key={i}
                cx={x(i)}
                cy={y(p.valor)}
                r={ativo === i || i === pontos.length - 1 ? 5 : 4}
                className="marca-ponto"
              />
            ),
          )}
          {pontos.map((p, i) => (
            <text key={i} x={x(i)} y={altura - 8} className="eixo-texto" textAnchor="middle">
              {p.rotulo}
            </text>
          ))}
          {pontos.map((p, i) => (
            <rect
              key={i}
              x={x(i) - (passo || w) / 2}
              y={M.topo}
              width={passo || w}
              height={h}
              fill="transparent"
              tabIndex={0}
              aria-label={`${p.rotulo}: ${p.valor === null ? 'sem questões' : formato(p.valor)}`}
              onPointerEnter={() => setAtivo(i)}
              onPointerLeave={() => setAtivo(null)}
              onFocus={() => setAtivo(i)}
              onBlur={() => setAtivo(null)}
            />
          ))}
        </svg>
      )}
      {ativo !== null && pontos[ativo] && (
        <Dica x={x(ativo)} y={y(pontos[ativo].valor ?? 0)} largura={largura}>
          {pontos[ativo].dica}
        </Dica>
      )}
    </div>
  )
}

/** Minigráfico de linha (0–100%) para a tabela por matéria. */
export function Minilinha({ valores, meta, rotulo }: { valores: (number | null)[]; meta: number; rotulo: string }) {
  const W = 96
  const H = 28
  const n = valores.length
  const x = (i: number) => (n > 1 ? 4 + ((W - 8) * i) / (n - 1) : W / 2)
  const y = (v: number) => 3 + (H - 6) * (1 - v)
  let d = ''
  let aberto = false
  valores.forEach((v, i) => {
    if (v === null) aberto = false
    else {
      d += `${aberto ? 'L' : 'M'}${x(i)},${y(v)} `
      aberto = true
    }
  })
  const ultimo = [...valores.keys()].reverse().find((i) => valores[i] !== null)
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={rotulo} className="minilinha">
      <line x1={0} x2={W} y1={y(meta)} y2={y(meta)} className="referencia fina" />
      <path d={d} className="marca-linha fina" />
      {ultimo !== undefined && <circle cx={x(ultimo)} cy={y(valores[ultimo]!)} r={3} className="marca-ponto" />}
    </svg>
  )
}
