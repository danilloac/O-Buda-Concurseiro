import { useMemo, useState } from 'react'
import { useEstado } from '../dados/Estado'
import { ImportarEdital } from '../componentes/ImportarEdital'
import { comparacao, concursoDoItem, concursosDoEdital, contar, marcarItem, noRecorte, pctVisto, porMateria, proximoStatus, statusDe, type Contagem, type Recorte } from '../dominio/edital'
import { fmtPct } from '../dominio/log'
import type { StatusEdital } from '../dominio/tipos'


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
  const [importando, setImportando] = useState(false)
  const EDITAL = estado.editalItens
  const concursos = useMemo(() => concursosDoEdital(EDITAL), [EDITAL])
  const recortes: { valor: Recorte; nome: string }[] = [{ valor: 'todos', nome: concursos.length === 2 ? 'Os dois' : 'Todos' }, ...concursos.map((c) => ({ valor: c, nome: c }))]
  const recorteValido = recortes.some((r) => r.valor === recorte) ? recorte : 'todos'
  const [busca, setBusca] = useState('')
  const nomes = useMemo(() => new Map(estado.materias.map((m) => [m.id, m.nome])), [estado.materias])
  const itens = useMemo(() => noRecorte(EDITAL, recorteValido), [EDITAL, recorteValido])
  const comp = comparacao(EDITAL)
  const geral = contar(itens, estado.edital)
  const termo = sem(busca.trim())
  const filtrados = termo ? itens.filter((i) => sem(`${i.item} ${nomes.get(i.materiaId) ?? ''}`).includes(termo)) : itens
  const grupos = useMemo(() => porMateria(filtrados, estado.edital, estado.log), [filtrados, estado.edital, estado.log])

  return (
    <>
      <header className="topo">
        <div>
          <div className="sobre">{estado.parametros.concurso}</div>
          <h1>Edital verticalizado</h1>
        </div>
        {EDITAL.length > 0 && !importando && (
          <button className="botao secundario pequeno" onClick={() => setImportando(true)}>
            Importar edital
          </button>
        )}
      </header>

      {(importando || EDITAL.length === 0) && <ImportarEdital aoFechar={EDITAL.length ? () => setImportando(false) : undefined} />}
      {EDITAL.length > 0 && (
        <>

      {concursos.length > 0 && (
      <div className="segmentado recorte" role="radiogroup" aria-label="Qual edital">
        {recortes.map((r) => (
          <button key={r.valor} role="radio" aria-checked={recorteValido === r.valor} className={recorteValido === r.valor ? 'ativo' : ''} onClick={() => setRecorte(r.valor)}>
            {r.nome} <span className="discreto">{noRecorte(EDITAL, r.valor).length}</span>
          </button>
        ))}
      </div>
      )}

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
        {concursos.length > 0 ? (
          <div className="kpi">
            <span className="kpi-rotulo">Em comum</span>
            <b>{comp.comuns}</b>
            <span className="discreto">{concursos.map((c) => `só ${c}: ${comp.porConcurso[c]}`).join(' · ')}</span>
          </div>
        ) : (
          <div className="kpi">
            <span className="kpi-rotulo">Matérias</span>
            <b>{grupos.length}</b>
            <span className="discreto">no edital</span>
          </div>
        )}
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
              <details key={`${g.materiaId}|${recorteValido}|${termo ? 'b' : ''}`} className="eg" open={!!termo}>
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
                          {concursoDoItem(i) && <span className="chip eg-so">só {concursoDoItem(i)}</span>}
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
      )}
    </>
  )
}
