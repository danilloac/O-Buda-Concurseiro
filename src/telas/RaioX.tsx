import { useMemo, useState } from 'react'
import { useEstado } from '../dados/Estado'
import { faixaAcerto, fmtPct } from '../dominio/log'
import { raioX } from '../dominio/raiox'
import { adicionarNaRevisao, estaNaRevisao } from '../dominio/revisao'

const MINIMOS = [1, 3, 5, 10, 20]

function Variacao({ v }: { v: number | null }) {
  if (v === null) return <span className="discreto">—</span>
  const pontos = Math.round(v * 100)
  if (pontos === 0) return <span className="variacao">= 0</span>
  return (
    <span className={`variacao ${pontos > 0 ? 'sobe' : 'desce'}`}>
      {pontos > 0 ? '▲' : '▼'} {Math.abs(pontos)} p.p.
    </span>
  )
}

export function RaioX() {
  const { estado, atualizar } = useEstado()
  const [materiaId, setMateriaId] = useState('')
  const [minimo, setMinimo] = useState(5)
  const meta = estado.parametros.metaAcerto
  const nomes = useMemo(() => new Map(estado.materias.map((m) => [m.id, m.nome])), [estado.materias])
  const linhas = useMemo(() => raioX(estado.log, { materiaId, minimo }), [estado.log, materiaId, minimo])
  const abaixo = linhas.filter((l) => l.pct < meta).length

  return (
    <>
      <header className="topo">
        <div>
          <div className="sobre">Diagnóstico por tópico</div>
          <h1>Raio-X</h1>
        </div>
      </header>

      <section className="cartao filtros">
        <label className="campo">
          <span>Matéria</span>
          <select id="rx-materia" value={materiaId} onChange={(e) => setMateriaId(e.target.value)}>
            <option value="">Todas</option>
            {estado.materias
              .filter((m) => estado.log.some((l) => l.materiaId === m.id))
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
          </select>
        </label>
        <div className="campo">
          <span>Mínimo de questões no tópico</span>
          <div className="atalhos" role="group" aria-label="Mínimo de questões">
            {MINIMOS.map((n) => (
              <button key={n} className={n === minimo ? 'ativo' : ''} aria-pressed={n === minimo} onClick={() => setMinimo(n)}>
                {n}+
              </button>
            ))}
          </div>
        </div>
        <p className="discreto resumo-filtro">
          {linhas.length} tópicos · <strong className="pct fraco">{abaixo} abaixo da meta</strong> de {Math.round(meta * 100)}%
        </p>
      </section>

      <section className="cartao" style={{ marginTop: 14 }}>
        {linhas.length === 0 ? (
          <p className="vazio">Nenhum tópico com {minimo} ou mais questões neste filtro.</p>
        ) : (
          <div className="tabela-rolagem">
            <table className="tabela raiox">
              <thead>
                <tr>
                  <th scope="col">Tópico</th>
                  <th scope="col" className="num">Questões</th>
                  <th scope="col" className="num">Acerto</th>
                  <th scope="col" className="num col-semana">Última sem.</th>
                  <th scope="col" className="num col-semana">Anterior</th>
                  <th scope="col" className="num">Variação</th>
                  <th scope="col"><span className="sr">Revisão</span></th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => {
                  const nome = nomes.get(l.materiaId) ?? l.materiaId
                  const naFila = estaNaRevisao(estado.revisao, nome, l.topico)
                  return (
                    <tr key={l.chave}>
                      <th scope="row" className="quebra">
                        <span className="registro-topico">{l.topico || 'Sem tópico'}</span>
                        <span className="discreto">{nome}</span>
                      </th>
                      <td className="num">
                        {l.acertos}/{l.resolvidas}
                      </td>
                      <td className="num">
                        <span className={`pct ${faixaAcerto(l.pct, meta)}`}>{fmtPct(l.pct)}</span>
                      </td>
                      <td className="num col-semana">{l.ultimaSemana.resolvidas ? fmtPct(l.ultimaSemana.pct) : '—'}</td>
                      <td className="num col-semana">{l.semanaAnterior.resolvidas ? fmtPct(l.semanaAnterior.pct) : '—'}</td>
                      <td className="num">
                        <Variacao v={l.variacao} />
                      </td>
                      <td>
                        {!l.topico ? null : naFila ? (
                          <span className="chip">Na revisão</span>
                        ) : (
                          <button
                            className="botao secundario pequeno"
                            onClick={() => atualizar((e) => adicionarNaRevisao(e, { materia: nome, topico: l.topico, acumulado: l.pct }))}
                          >
                            + Revisão
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
