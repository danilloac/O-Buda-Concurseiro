import { sugestoesDeTopico } from '../dominio/edital'
import { useMemo, useState, type FormEvent } from 'react'
import { useEstado } from '../dados/Estado'
import { hojeISO } from '../dominio/datas'

const dm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
import { faixaAcerto, fmtPct } from '../dominio/log'
import {
  REGRAS_REVISAO,
  adicionarNaRevisao,
  alterarTopico,
  desempenhoNoLog,
  idDaMateria,
  mudarStatus,
  removerDaRevisao,
  sugestoesDeRevisao,
} from '../dominio/revisao'
import type { Incidencia, StatusTopico, TopicoRevisao } from '../dominio/tipos'

const STATUS: { valor: StatusTopico; curto: string }[] = [
  { valor: 'Não compreendido', curto: 'Não' },
  { valor: 'Parcialmente compreendido', curto: 'Parcial' },
  { valor: 'Compreendido', curto: 'Compreendido' },
]
const INCIDENCIAS: Incidencia[] = ['Altíssima', 'Alta', 'Moderada', 'Baixa', 'Baixíssima']

function CartaoTopico({ t, apagarId, setApagarId }: { t: TopicoRevisao; apagarId: string | null; setApagarId: (id: string | null) => void }) {
  const { estado, atualizar } = useEstado()
  const hoje = hojeISO()
  const meta = REGRAS_REVISAO.metaSaida
  const d = desempenhoNoLog(estado.log, idDaMateria(estado.materias, t.materia), t.topico)
  const pct = d.resolvidas ? d.pct : t.acumulado
  return (
    <article className={`cartao topico-revisao${t.recorrente ? ' recorrente' : ''}`}>
      <div className="tr-cabeca">
        <div className="tr-titulo">
          <h3>{t.topico}</h3>
          <span className="discreto">
            {t.materia}
            {t.incidencia ? ` · incidência ${t.incidencia.toLowerCase()}` : ''}
            {t.entrouEm ? ` · entrou ${dm(t.entrouEm)}` : ''}
            {t.concluidoEm ? ` · compreendido ${dm(t.concluidoEm)}` : ''}
          </span>
        </div>
        <div className="tr-pct">
          <span className={`pct grande ${pct === null || pct === undefined ? '' : faixaAcerto(pct, meta)}`}>{fmtPct(pct ?? null)}</span>
          <span className="discreto">{d.ultimo ? `último ${dm(d.ultimo)}` : 'sem registro'}</span>
        </div>
      </div>

      <div className="segmentado" role="radiogroup" aria-label={`Status de ${t.topico}`}>
        {STATUS.map((s) => (
          <button
            key={s.valor}
            role="radio"
            aria-checked={t.status === s.valor}
            className={t.status === s.valor ? 'ativo' : ''}
            onClick={() => atualizar((e) => mudarStatus(e, t.id, s.valor, hoje))}
          >
            {s.curto}
          </button>
        ))}
      </div>

      <div className="tr-rodape">
        <input
          id={`obs-${t.id}`}
          className="obs-inline"
          value={t.observacao}
          placeholder="Fonte do material (GRAN, YouTube…)"
          aria-label="Fonte do material"
          onChange={(ev) => {
            const v = ev.target.value
            atualizar((e) => alterarTopico(e, t.id, { observacao: v }))
          }}
        />
        <button
          className={`check${t.recorrente ? ' feito' : ''}`}
          aria-pressed={t.recorrente}
          onClick={() => atualizar((e) => alterarTopico(e, t.id, { recorrente: !t.recorrente }))}
        >
          <span className="caixa">{t.recorrente ? '✓' : ''}</span> Recorrente
        </button>
        {apagarId === t.id ? (
          <span className="confirma">
            <button className="botao perigo pequeno" onClick={() => atualizar((e) => removerDaRevisao(e, t.id))}>
              Tirar da fila
            </button>
            <button className="botao secundario pequeno" onClick={() => setApagarId(null)}>
              Manter
            </button>
          </span>
        ) : (
          <button className="apagar" aria-label={`Tirar ${t.topico} da fila`} onClick={() => setApagarId(t.id)}>
            ×
          </button>
        )}
      </div>
    </article>
  )
}

export function Revisao() {
  const { estado, atualizar } = useEstado()
  const hoje = hojeISO()
  const meta = REGRAS_REVISAO.metaSaida
  const [mostrarFeitos, setMostrarFeitos] = useState(false)
  const [apagarId, setApagarId] = useState<string | null>(null)
  const [novo, setNovo] = useState({ materiaId: estado.giro.ordem[0] ?? '', topico: '', observacao: '', incidencia: '' as Incidencia })

  const fila = estado.revisao.filter((t) => t.status !== 'Compreendido')
  const feitos = estado.revisao.filter((t) => t.status === 'Compreendido')
  const sugestoes = useMemo(() => sugestoesDeRevisao(estado), [estado])
  const nomeDe = (id: string) => estado.materias.find((m) => m.id === id)?.nome ?? id
  const sugestoesTopico = useMemo(() => sugestoesDeTopico(estado, novo.materiaId), [estado, novo.materiaId])

  const adicionar = (ev: FormEvent) => {
    ev.preventDefault()
    if (!novo.topico.trim()) return
    atualizar((e) =>
      adicionarNaRevisao(
        e,
        { materia: nomeDe(novo.materiaId), topico: novo.topico, observacao: novo.observacao, incidencia: novo.incidencia },
        hoje,
      ),
    )
    setNovo((n) => ({ ...n, topico: '', observacao: '' }))
  }

  return (
    <>
      <header className="topo">
        <div>
          <div className="sobre">Fila de teoria</div>
          <h1>Revisão</h1>
        </div>
        <span className="chip primaria">{fila.length} na fila</span>
      </header>

      <p className="discreto regras">
        Entra quem fica abaixo de {Math.round(REGRAS_REVISAO.metaSaida * 100)}% com {REGRAS_REVISAO.minimoQuestoes}+ questões, ou
        abaixo de {Math.round(REGRAS_REVISAO.pctCritico * 100)}% já com {REGRAS_REVISAO.minimoCritico}. Sai ao marcar Compreendido e
        só volta depois de {REGRAS_REVISAO.girosParaVoltar} giros. Os primeiros da fila entram no plano de Hoje.
      </p>

      <div className="grade duas">
        <div className="lista-revisao">
          {fila.length === 0 && (
            <section className="cartao">
              <p className="vazio">Fila vazia. Use as sugestões ao lado ou adicione um tópico.</p>
            </section>
          )}
          {fila.map((t) => (
            <CartaoTopico key={t.id} t={t} apagarId={apagarId} setApagarId={setApagarId} />
          ))}
          {feitos.length > 0 && (
            <button className="botao secundario largo" onClick={() => setMostrarFeitos((v) => !v)} aria-expanded={mostrarFeitos}>
              {mostrarFeitos ? 'Esconder' : 'Mostrar'} compreendidos ({feitos.length})
            </button>
          )}
          {mostrarFeitos && feitos.map((t) => <CartaoTopico key={t.id} t={t} apagarId={apagarId} setApagarId={setApagarId} />)}
        </div>

        <div>
          <section className="cartao">
            <div className="secao-titulo">
              <h2>Sugestões do Log</h2>
              <span className="discreto">{sugestoes.length}</span>
            </div>
            {sugestoes.length === 0 ? (
              <p className="vazio">Nenhum tópico novo bate os critérios agora.</p>
            ) : (
              <ul className="sugestoes">
                {sugestoes.slice(0, 12).map((s) => (
                  <li key={`${s.materia}|${s.topico}`}>
                    <div className="registro-texto">
                      <span className="registro-topico">{s.topico}</span>
                      <span className="discreto">
                        {s.materia} · <span className={`pct ${faixaAcerto(s.pct, meta)}`}>{fmtPct(s.pct)}</span> em {s.resolvidas}
                      </span>
                    </div>
                    <button
                      className="botao secundario pequeno"
                      onClick={() => atualizar((e) => adicionarNaRevisao(e, { materia: s.materia, topico: s.topico, acumulado: s.pct }, hoje))}
                    >
                      + Fila
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <form className="cartao formulario" onSubmit={adicionar}>
            <h2>Adicionar tópico</h2>
            <label className="campo">
              <span>Matéria</span>
              <select id="rev-materia" value={novo.materiaId} onChange={(e) => setNovo({ ...novo, materiaId: e.target.value })}>
                {estado.materias.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="campo">
              <span>Tópico</span>
              <input id="rev-topico" list="rev-topicos" value={novo.topico} onChange={(e) => setNovo({ ...novo, topico: e.target.value })} autoComplete="off" />
              <datalist id="rev-topicos">
                {sugestoesTopico.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </label>
            <div className="linha-campos">
              <label className="campo">
                <span>Incidência</span>
                <select id="rev-incidencia" value={novo.incidencia} onChange={(e) => setNovo({ ...novo, incidencia: e.target.value as Incidencia })}>
                  <option value="">—</option>
                  {INCIDENCIAS.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </label>
              <label className="campo cresce">
                <span>Fonte</span>
                <input id="rev-obs" value={novo.observacao} onChange={(e) => setNovo({ ...novo, observacao: e.target.value })} placeholder="GRAN, YouTube…" />
              </label>
            </div>
            <div className="acoes-form">
              <button type="submit" className="botao" disabled={!novo.topico.trim()}>
                Adicionar à fila
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
