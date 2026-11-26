import { Link } from 'react-router-dom'
import { useEstado } from '../dados/Estado'
import { faixaAcerto, fmtPct } from '../dominio/log'
import { porMateria, porSemana, resumoGeral } from '../dominio/painel'
import { GraficoColunas, GraficoLinha, Minilinha, type Ponto } from '../componentes/Graficos'

const curta = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
const pct0 = (v: number) => `${Math.round(v * 100)}%`

export function Painel() {
  const { estado } = useEstado()
  const meta = estado.parametros.metaAcerto
  const r = resumoGeral(estado)
  const semanas = porSemana(estado.log)
  const materias = porMateria(estado)
  const fracas = [...materias].sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0))

  if (estado.log.length === 0) {
    return (
      <>
        <header className="topo">
          <h1>Painel</h1>
        </header>
        <section className="cartao">
          <p className="vazio">Os gráficos aparecem quando houver questões no Log.</p>
          <Link to="/registrar" className="botao">
            Registrar questões
          </Link>
        </section>
      </>
    )
  }

  const colunas: Ponto[] = semanas.map((s) => ({
    rotulo: curta(s.semana),
    valor: s.resolvidas,
    dica: (
      <>
        <strong>Semana de {curta(s.semana)}</strong>
        <span>{s.resolvidas} questões</span>
      </>
    ),
  }))
  const linha: Ponto[] = semanas.map((s) => ({
    rotulo: curta(s.semana),
    valor: s.pct,
    dica: (
      <>
        <strong>Semana de {curta(s.semana)}</strong>
        <span>
          {s.pct === null ? 'Sem questões' : `${fmtPct(s.pct)} de acerto · ${s.acertos}/${s.resolvidas}`}
        </span>
      </>
    ),
  }))

  return (
    <>
      <header className="topo">
        <div>
          <div className="sobre">Visão geral e gráficos</div>
          <h1>Painel</h1>
        </div>
      </header>

      <section className="kpis quatro" aria-label="Resumo geral">
        <div className="kpi">
          <span className="kpi-rotulo">Questões</span>
          <b>{r.resolvidas}</b>
          <span className="discreto">{r.acertos} acertos</span>
        </div>
        <div className="kpi">
          <span className="kpi-rotulo">Acerto geral</span>
          <b>{fmtPct(r.pct)}</b>
          <span className="discreto">meta {pct0(meta)}</span>
        </div>
        <div className="kpi">
          <span className="kpi-rotulo">Giros completos</span>
          <b>{r.girosCompletos}</b>
          <span className="discreto">giro {estado.giro.numero} em andamento</span>
        </div>
        <div className="kpi">
          <span className="kpi-rotulo">Por dia de estudo</span>
          <b>{Math.round(r.mediaPorDia)}</b>
          <span className="discreto">{r.diasEstudados} dias com questões</span>
        </div>
      </section>

      <div className="grade graficos">
        <section className="cartao">
          <div className="secao-titulo">
            <h2>Questões por semana</h2>
          </div>
          <GraficoColunas pontos={colunas} formato={(v) => String(v)} rotuloEixo="Questões resolvidas por semana" />
        </section>
        <section className="cartao">
          <div className="secao-titulo">
            <h2>Acerto semanal</h2>
          </div>
          <GraficoLinha
            pontos={linha}
            formato={pct0}
            rotuloEixo="Percentual de acerto por semana"
            referencia={{ valor: meta, rotulo: `meta ${pct0(meta)}` }}
          />
        </section>
      </div>

      <section className="cartao" style={{ marginTop: 14 }}>
        <div className="secao-titulo">
          <h2>Acerto por matéria</h2>
          <span className="discreto">da mais fraca para a mais forte</span>
        </div>
        <ul className="barras-materia">
          {fracas.map((l) => {
            const p = l.pct ?? 0
            return (
              <li key={l.materia.id}>
                <span className="bm-nome">{l.materia.nome}</span>
                <span className="bm-trilho" aria-hidden="true">
                  <span className="bm-barra" style={{ width: `${p * 100}%` }} />
                  <span className="bm-meta" style={{ left: `${meta * 100}%` }} />
                </span>
                <span className="bm-valor">
                  <span className={`pct ${faixaAcerto(p, meta)}`}>{fmtPct(l.pct)}</span>
                  <span className="discreto"> · {l.resolvidas}</span>
                </span>
              </li>
            )
          })}
        </ul>
        <p className="discreto legenda-meta">
          <span className="bm-meta-amostra" aria-hidden="true" /> meta de {pct0(meta)} · número ao lado = questões
          resolvidas
        </p>
      </section>

      <section className="cartao" style={{ marginTop: 14 }}>
        <div className="secao-titulo">
          <h2>Por matéria</h2>
          <span className="discreto">evolução semanal do acerto</span>
        </div>
        <div className="tabela-rolagem">
          <table className="tabela">
            <thead>
              <tr>
                <th scope="col">Matéria</th>
                <th scope="col" className="num">Questões</th>
                <th scope="col" className="num">Acertos</th>
                <th scope="col" className="num">%</th>
                <th scope="col">Evolução</th>
                <th scope="col">Giro</th>
              </tr>
            </thead>
            <tbody>
              {materias.map((l) => (
                <tr key={l.materia.id}>
                  <th scope="row">{l.materia.nome}</th>
                  <td className="num">{l.resolvidas}</td>
                  <td className="num">{l.acertos}</td>
                  <td className="num">
                    <span className={`pct ${faixaAcerto(l.pct ?? 0, meta)}`}>{fmtPct(l.pct)}</span>
                  </td>
                  <td>
                    <Minilinha
                      valores={l.semanas.map((s) => s.pct)}
                      meta={meta}
                      rotulo={`Acerto semanal de ${l.materia.nome}: ${l.semanas.map((s) => fmtPct(s.pct)).join(', ')}`}
                    />
                  </td>
                  <td>{l.materia.entraNoGiro ? <span className="chip primaria">Sim</span> : <span className="chip">Não</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <details className="cartao tabela-semanas" style={{ marginTop: 14 }}>
        <summary>Ver os números por semana</summary>
        <div className="tabela-rolagem">
          <table className="tabela">
            <thead>
              <tr>
                <th scope="col">Semana</th>
                <th scope="col" className="num">Questões</th>
                <th scope="col" className="num">Acertos</th>
                <th scope="col" className="num">%</th>
              </tr>
            </thead>
            <tbody>
              {semanas.map((s) => (
                <tr key={s.semana}>
                  <th scope="row">{curta(s.semana)}</th>
                  <td className="num">{s.resolvidas}</td>
                  <td className="num">{s.acertos}</td>
                  <td className="num">{fmtPct(s.pct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  )
}
