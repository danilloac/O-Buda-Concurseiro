import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useEstado } from '../dados/Estado'
import { GraficoColunas, GraficoLinha, type Ponto } from '../componentes/Graficos'
import { hojeISO } from '../dominio/datas'
import { resumoDoGiro } from '../dominio/giro'
import { duracaoMedia, linhasDoHistorico } from '../dominio/historico'
import { faixaAcerto, fmtPct } from '../dominio/log'

const dm = (iso: string) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '?')
const pct0 = (v: number) => `${Math.round(v * 100)}%`

export function Historico() {
  const { estado } = useEstado()
  const hoje = hojeISO()
  const meta = estado.parametros.metaAcerto
  const resumo = resumoDoGiro(estado)
  const linhas = useMemo(
    () => linhasDoHistorico(estado, hoje, resumo.concluidas, resumo.totalMaterias),
    [estado, hoje, resumo.concluidas, resumo.totalMaterias],
  )
  const fechados = linhas.filter((l) => !l.emAndamento)
  const media = duracaoMedia(linhas)
  const nome = (l: (typeof linhas)[number]) => `Giro ${l.numero}${l.emAndamento ? ' (em andamento)' : ''}`

  const colunas: Ponto[] = linhas.map((l) => ({
    rotulo: `G${l.numero}`,
    valor: l.questoes,
    dica: (
      <>
        <b>{nome(l)}</b>
        <br />
        {l.questoes} questões no Log
      </>
    ),
  }))
  const acerto: Ponto[] = linhas.map((l) => ({
    rotulo: `G${l.numero}`,
    valor: l.acerto,
    dica: (
      <>
        <b>{nome(l)}</b>
        <br />
        {l.acerto === null ? 'sem questões' : `${fmtPct(l.acerto)} de acerto`}
      </>
    ),
  }))

  return (
    <>
      <header className="topo">
        <div>
          <div className="sobre">Giro {estado.giro.numero} em andamento desde {dm(estado.giro.inicio)}</div>
          <h1>Histórico dos giros</h1>
        </div>
      </header>

      <section className="kpis" aria-label="Resumo dos giros">
        <div className="kpi">
          <span className="kpi-rotulo">Giros fechados</span>
          <b>{fechados.length}</b>
          <span className="discreto">
            {resumo.concluidas} de {resumo.totalMaterias} matérias no atual
          </span>
        </div>
        <div className="kpi">
          <span className="kpi-rotulo">Duração média</span>
          <b>{media === null ? '—' : `${String(Math.round(media * 10) / 10).replace('.', ',')} d`}</b>
          <span className="discreto">por giro fechado</span>
        </div>
        <div className="kpi">
          <span className="kpi-rotulo">Último fechamento</span>
          <b>{fechados.length ? dm(fechados.at(-1)!.fim) : '—'}</b>
          <span className="discreto">{fechados.length ? `giro ${fechados.at(-1)!.numero}` : 'nenhum ainda'}</span>
        </div>
      </section>

      <div className="grade graficos">
        <section className="cartao">
          <div className="secao-titulo">
            <h2>Questões por giro</h2>
            <span className="discreto">do Log</span>
          </div>
          <GraficoColunas pontos={colunas} formato={(v) => String(v)} rotuloEixo="Questões resolvidas em cada giro" />
        </section>
        <section className="cartao">
          <div className="secao-titulo">
            <h2>Acerto por giro</h2>
          </div>
          <GraficoLinha pontos={acerto} formato={pct0} rotuloEixo="Percentual de acerto em cada giro" referencia={{ valor: meta, rotulo: `meta ${pct0(meta)}` }} />
        </section>
      </div>

      <section className="cartao" style={{ marginTop: 14 }}>
        <div className="secao-titulo">
          <h2>Giro a giro</h2>
          <Link className="botao secundario pequeno" to="/giro">
            Ir para o giro atual
          </Link>
        </div>
        <div className="tabela-rolagem">
          <table className="tabela">
            <thead>
              <tr>
                <th scope="col">Giro</th>
                <th scope="col">Período</th>
                <th scope="col" className="num">Dias</th>
                <th scope="col" className="num">Matérias</th>
                <th scope="col" className="num">Questões</th>
                <th scope="col" className="num">Acerto</th>
                <th scope="col">Caderno de erros</th>
                <th scope="col">Revisão</th>
              </tr>
            </thead>
            <tbody>
              {[...linhas].reverse().map((l) => (
                <tr key={l.numero} className={l.emAndamento ? 'linha-atual' : ''}>
                  <th scope="row">
                    {l.numero}
                    {l.emAndamento && <span className="chip primaria hist-chip">atual</span>}
                  </th>
                  <td className="sem-quebra">
                    {dm(l.inicio)} → {l.emAndamento ? 'hoje' : dm(l.fim)}
                  </td>
                  <td className="num">{l.dias ?? '—'}</td>
                  <td className="num">{l.concluidas === null ? '—' : `${l.concluidas}/${l.totalMaterias}`}</td>
                  <td className="num">{l.questoes || '—'}</td>
                  <td className="num">
                    <span className={`pct ${l.acerto === null ? '' : faixaAcerto(l.acerto, meta)}`}>{fmtPct(l.acerto)}</span>
                  </td>
                  <td className="sem-quebra">{l.erros}</td>
                  <td className="sem-quebra">{l.revisao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="discreto legenda-meta">
          Os giros 1 a 5 vêm da aba Histórico da planilha, que conta dias com caderno de erros e com revisão. Os próximos giros
          fechados no app contam matérias. O Log começa em 21/10, por isso o giro 1 não tem questões.
        </p>
      </section>
    </>
  )
}
