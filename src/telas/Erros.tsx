import { useMemo, useState } from 'react'
import { useEstado } from '../dados/Estado'
import { dataCurta, hojeISO } from '../dominio/datas'
import { LIMITES_ERROS, errosPorMateria, errosPorTopico, type LeituraPeso, type Situacao } from '../dominio/erros'
import { fmtPct } from '../dominio/log'
import { adicionarNaRevisao, estaNaRevisao } from '../dominio/revisao'

const LEITURA: Record<LeituraPeso, { texto: string; classe: string }> = {
  mais: { texto: 'Erra mais do que pesa', classe: 'alerta' },
  proporcional: { texto: 'Proporcional', classe: 'neutro' },
  pouco: { texto: 'Erra pouco para o peso', classe: 'bem' },
  'sem-peso': { texto: 'Sem peso de TI', classe: 'neutro' },
}

const SITUACAO: Record<Situacao, { texto: string; classe: string }> = {
  cronico: { texto: 'Crônico', classe: 'alerta' },
  fraco: { texto: 'Fraco', classe: 'atencao' },
  ok: { texto: 'Ok', classe: 'bem' },
  baixa: { texto: 'Baixa incidência', classe: 'neutro' },
}

const ESCALA_MAX = 2.5 // Erra × peso desenhado de 0 a 2,5

export function Erros() {
  const { estado, atualizar } = useEstado()
  const hoje = hojeISO()
  const [filtro, setFiltro] = useState<Situacao | ''>('')
  const nomes = useMemo(() => new Map(estado.materias.map((m) => [m.id, m.nome])), [estado.materias])
  const materias = useMemo(() => errosPorMateria(estado.errosTec), [estado.errosTec])
  const topicos = useMemo(() => errosPorTopico(estado.errosTec, estado.log), [estado.errosTec, estado.log])
  const contagem = (s: Situacao) => topicos.filter((t) => t.situacao === s).length
  const visiveis = filtro ? topicos.filter((t) => t.situacao === filtro) : topicos
  const total = materias.reduce((s, m) => s + m.noCaderno, 0)
  const recorrentes = materias.reduce((s, m) => s + m.recorrentes, 0)

  return (
    <>
      <header className="topo">
        <div>
          <div className="sobre">Leitura do Tec de {dataCurta(estado.errosTec.leitura)}</div>
          <h1>Caderno de erros</h1>
        </div>
      </header>

      <section className="kpis" aria-label="Resumo do caderno de erros">
        <div className="kpi">
          <span className="kpi-rotulo">No caderno</span>
          <b>{total}</b>
          <span className="discreto">questões erradas</span>
        </div>
        <div className="kpi">
          <span className="kpi-rotulo">Recorrentes</span>
          <b>{recorrentes}</b>
          <span className="discreto">erradas de novo</span>
        </div>
        <div className="kpi">
          <span className="kpi-rotulo">Crônicos</span>
          <b>{contagem('cronico')}</b>
          <span className="discreto">tópicos</span>
        </div>
      </section>

      <section className="cartao">
        <div className="secao-titulo">
          <h2>Erra × peso</h2>
          <span className="discreto">% dos seus erros ÷ % da prova</span>
        </div>
        <ul className="erra-peso">
          {materias.map((m) => {
            const l = LEITURA[m.leitura]
            const largura = m.erraPeso === null ? 0 : Math.min(1, m.erraPeso / ESCALA_MAX) * 100
            return (
              <li key={m.materiaId}>
                <span className="ep-nome">{nomes.get(m.materiaId) ?? m.materiaId}</span>
                <span className="ep-trilho" aria-hidden="true">
                  <span className={`ep-barra ${l.classe}`} style={{ width: `${largura}%` }} />
                  <span className="ep-um" style={{ left: `${(1 / ESCALA_MAX) * 100}%` }} />
                </span>
                <span className="ep-valor">{m.erraPeso === null ? '—' : `${m.erraPeso.toFixed(1).replace('.', ',')}×`}</span>
                <span className={`selo ${l.classe}`}>{l.texto}</span>
                <span className="ep-detalhe discreto">
                  {m.noCaderno} no caderno ({fmtPct(m.pctErros)} dos erros
                  {m.pctProva !== null ? `, ${fmtPct(m.pctProva)} da prova` : ''}) · {m.recorrentes} recorrentes · refazendo acerta{' '}
                  {fmtPct(m.acertoRefazer)}
                </span>
              </li>
            )
          })}
        </ul>
        <p className="discreto legenda-meta">
          <span className="bm-meta-amostra" aria-hidden="true" /> 1× = erra na mesma proporção do peso. Acima de{' '}
          {String(LIMITES_ERROS.erraMuito).replace('.', ',')}× é prioridade; abaixo de {String(LIMITES_ERROS.erraPouco).replace('.', ',')}× erra pouco.
        </p>
      </section>

      <section className="cartao" style={{ marginTop: 14 }}>
        <div className="secao-titulo">
          <h2>Tópicos</h2>
          <div className="atalhos" role="group" aria-label="Filtrar por situação">
            <button className={filtro === '' ? 'ativo' : ''} aria-pressed={filtro === ''} onClick={() => setFiltro('')}>
              Todos {topicos.length}
            </button>
            {(Object.keys(SITUACAO) as Situacao[]).map((s) => (
              <button key={s} className={filtro === s ? 'ativo' : ''} aria-pressed={filtro === s} onClick={() => setFiltro(s)}>
                {SITUACAO[s].texto} {contagem(s)}
              </button>
            ))}
          </div>
        </div>
        <div className="tabela-rolagem">
          <table className="tabela">
            <thead>
              <tr>
                <th scope="col">Tópico</th>
                <th scope="col" className="num">Caderno</th>
                <th scope="col" className="num">Refazendo</th>
                <th scope="col" className="num">Inéditas</th>
                <th scope="col">Situação</th>
                <th scope="col"><span className="sr">Revisão</span></th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((t) => {
                const nome = nomes.get(t.materiaId) ?? t.materiaId
                const s = SITUACAO[t.situacao]
                return (
                  <tr key={`${t.materiaId}|${t.topico}`}>
                    <th scope="row" className="quebra">
                      <span className="registro-topico">{t.topico}</span>
                      <span className="discreto">
                        {nome}
                        {t.incidencia ? ` · ${t.incidencia.toLowerCase()}` : ''}
                        {t.recorrentes ? ` · ${t.recorrentes} recorrente${t.recorrentes > 1 ? 's' : ''}` : ''}
                      </span>
                    </th>
                    <td className="num">{t.noCaderno}</td>
                    <td className="num">{fmtPct(t.acertoRefazer)}</td>
                    <td className="num">{fmtPct(t.pctLog)}</td>
                    <td>
                      <span className={`selo ${s.classe}`}>{s.texto}</span>
                    </td>
                    <td>
                      {t.situacao === 'cronico' || t.situacao === 'fraco' ? (
                        estaNaRevisao(estado.revisao, nome, t.topico) ? (
                          <span className="chip">Na revisão</span>
                        ) : (
                          <button
                            className="botao secundario pequeno"
                            onClick={() =>
                              atualizar((e) =>
                                adicionarNaRevisao(e, { materia: nome, topico: t.topico, acumulado: t.pctLog, incidencia: t.incidencia }, hoje),
                              )
                            }
                          >
                            + Revisão
                          </button>
                        )
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="discreto legenda-meta">
          Crônico: tem erro recorrente. Fraco: menos de {Math.round(LIMITES_ERROS.acertoOk * 100)}% nas inéditas do Log. A próxima leitura
          do Tec atualiza estes números.
        </p>
      </section>
    </>
  )
}
