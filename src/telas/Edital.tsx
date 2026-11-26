import { useMemo, useState } from 'react'
import { useEstado } from '../dados/Estado'
import { EDITAL } from '../dados/edital'
import { comparacao, contar, marcarItem, noRecorte, pctVisto, porMateria, proximoStatus, statusDe, type Contagem, type Recorte } from '../dominio/edital'
import { fmtPct } from '../dominio/log'
import type { StatusEdital } from '../dominio/tipos'

const RECORTES: { valor: Recorte; nome: string }[] = [
  { valor: 'todos', nome: 'Os dois' },
  { valor: 'trt8', nome: 'TRT 8' },
  { valor: 'trt4', nome: 'TRT 4' },
]

const CLASSE: Record<StatusEdital, string> = { 'Não visto': 'nao', Teoria: 'teoria', Questões: 'questoes', Revisado: 'revisado' }
const AVANCO: StatusEdital[] = ['Teoria', 'Questões', 'Revisado']

const sem = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

function Trilho({ c, total }: { c: Contagem; total: number }) {
  return (
    <span className="eg-trilho" aria-hidden="true">
      {AVANCO.slice()
        .reverse()
        .map((s) => (c[s] ? <span key={s} className={`eg-seg ${CLASSE[s]}`} style={{ width: `${(c[s] / total) * 100}%` }} /> : null))}
    </span>
  )
}

export function Edital() {
  const { estado, atualizar } = useEstado()
  const [recorte, setRecorte] = useState<Recorte>('todos')
  const [busca, setBusca] = useState('')
  const nomes = useMemo(() => new Map(estado.materias.map((m) => [m.id, m.nome])), [estado.materias])
  const itens = useMemo(() => noRecorte(EDITAL, recorte), [recorte])
  const comp = comparacao(EDITAL)
  const geral = contar(itens, estado.edital)
  const termo = sem(busca.trim())
  const filtrados = termo ? itens.filter((i) => sem(`${i.item} ${nomes.get(i.materiaId) ?? ''}`).includes(termo)) : itens
  const grupos = useMemo(() => porMateria(filtrados, estado.edital, estado.log), [filtrados, estado.edital, estado.log])

  return (
    <>
      <header className="topo">
        <div>
          <div className="sobre">TRT 8 e TRT 4 · FCC</div>
          <h1>Edital verticalizado</h1>
        </div>
      </header>

      <div className="segmentado recorte" role="radiogroup" aria-label="Qual edital">
        {RECORTES.map((r) => (
          <button key={r.valor} role="radio" aria-checked={recorte === r.valor} className={recorte === r.valor ? 'ativo' : ''} onClick={() => setRecorte(r.valor)}>
            {r.nome} <span className="discreto">{noRecorte(EDITAL, r.valor).length}</span>
          </button>
        ))}
      </div>

      <section className="kpis" aria-label="Resumo do edital">
        <div className="kpi">
          <span className="kpi-rotulo">Visto</span>
          <b>{fmtPct(pctVisto(geral))}</b>
          <span className="discreto">
            {itens.length - geral['Não visto']} de {itens.length} itens
          </span>
        </div>
        <div className="kpi">
          <span className="kpi-rotulo">Revisados</span>
          <b>{geral.Revisado}</b>
          <span className="discreto">{geral.Questões} com questões</span>
        </div>
        <div className="kpi">
          <span className="kpi-rotulo">Em comum</span>
          <b>{comp.ambos}</b>
          <span className="discreto">
            só TRT 8: {comp.so8} · só TRT 4: {comp.so4}
          </span>
        </div>
      </section>

      <section className="cartao">
        <div className="secao-titulo">
          <h2>Por matéria</h2>
          <input className="busca" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar item…" aria-label="Buscar item do edital" />
        </div>
        <p className="discreto legenda eg-legenda">
          {AVANCO.map((s) => (
            <span key={s}>
              <span className={`eg-amostra ${CLASSE[s]}`} aria-hidden="true" /> {s}
            </span>
          ))}
          <span>Toque no status de um item para avançar.</span>
        </p>

        {grupos.length === 0 && <p className="vazio">Nenhum item com “{busca}”.</p>}
        <div className="edital">
          {grupos.map((g) => {
            const vistos = g.itens.length - g.contagem['Não visto']
            return (
              <details key={`${g.materiaId}|${recorte}|${termo ? 'b' : ''}`} className="eg" open={!!termo}>
                <summary>
                  <span className="eg-nome">{nomes.get(g.materiaId) ?? g.materiaId}</span>
                  <span className="eg-conta">
                    {vistos}/{g.itens.length}
                  </span>
                  <Trilho c={g.contagem} total={g.itens.length} />
                  <span className="eg-log discreto">{g.questoes ? `Log: ${fmtPct(g.acerto)} em ${g.questoes} questões` : 'sem questões no Log'}</span>
                </summary>
                <ol className="eg-itens">
                  {g.itens.map((i) => {
                    const s = statusDe(estado.edital, i.n)
                    return (
                      <li key={i.n}>
                        <span className="eg-n">{i.n}</span>
                        <span className="eg-texto">
                          {i.item}
                          {i.edital !== 'Ambos' && <span className="chip eg-so">{i.edital}</span>}
                        </span>
                        <button
                          className={`eg-status ${CLASSE[s]}`}
                          aria-label={`${i.item}: ${s}. Mudar para ${proximoStatus(s)}`}
                          onClick={() => atualizar((e) => marcarItem(e, i.n, proximoStatus(s)))}
                        >
                          {s}
                        </button>
                      </li>
                    )
                  })}
                </ol>
              </details>
            )
          })}
        </div>
        <p className="discreto legenda-meta">
          O acerto vem do Log da matéria inteira. O acerto por item depende do mapa tópico → item do edital, que ainda não veio da
          planilha.
        </p>
      </section>
    </>
  )
}
