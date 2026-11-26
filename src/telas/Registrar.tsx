import { sugestoesDeTopico } from '../dominio/edital'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useEstado } from '../dados/Estado'
import { dataCurta, hojeISO } from '../dominio/datas'
import {
  daSemana,
  doDia,
  editar,
  faixaAcerto,
  fmtPct,
  porDia,
  registrar,
  remover,
  totais,
  validar,
  type Rascunho,
} from '../dominio/log'
import { resumoDoGiro } from '../dominio/giro'

const DIAS_POR_PAGINA = 7

interface Campos {
  data: string
  materiaId: string
  topico: string
  resolvidas: string
  acertos: string
  obs: string
}

const paraRascunho = (c: Campos): Rascunho => ({
  ...c,
  resolvidas: c.resolvidas === '' ? NaN : Number(c.resolvidas),
  acertos: c.acertos === '' ? NaN : Number(c.acertos),
})

export function Registrar() {
  const { estado, atualizar } = useEstado()
  const hoje = hojeISO()
  const meta = estado.parametros.metaAcerto
  const nomes = useMemo(() => new Map(estado.materias.map((m) => [m.id, m.nome])), [estado.materias])

  // Matérias do giro primeiro, na ordem do ciclo; depois as outras.
  const opcoes = useMemo(() => {
    const doGiro = estado.giro.ordem.map((id) => estado.materias.find((m) => m.id === id)).filter(Boolean)
    const outras = estado.materias.filter((m) => !estado.giro.ordem.includes(m.id))
    return { doGiro, outras }
  }, [estado.giro.ordem, estado.materias])

  const proxima = resumoDoGiro(estado).proxima
  const vazio = (materiaId = proxima?.id ?? opcoes.doGiro[0]?.id ?? ''): Campos => ({
    data: hoje,
    materiaId,
    topico: '',
    resolvidas: '',
    acertos: '',
    obs: '',
  })

  const [campos, setCampos] = useState<Campos>(() => vazio())
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [filtro, setFiltro] = useState('')
  const [paginas, setPaginas] = useState(1)
  const [apagarId, setApagarId] = useState<string | null>(null)
  const topicoRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!aviso) return
    const t = window.setTimeout(() => setAviso(null), 2500)
    return () => window.clearTimeout(t)
  }, [aviso])

  const sugestoes = useMemo(() => sugestoesDeTopico(estado, campos.materiaId), [estado, campos.materiaId])
  const rascunho = paraRascunho(campos)
  const previa =
    Number.isFinite(rascunho.resolvidas) && rascunho.resolvidas > 0 && Number.isFinite(rascunho.acertos)
      ? Math.min(1, rascunho.acertos / rascunho.resolvidas)
      : null

  const muda = (k: keyof Campos) => (ev: { target: { value: string } }) => {
    setCampos((c) => ({ ...c, [k]: ev.target.value }))
    setErro(null)
  }

  const enviar = (ev: FormEvent) => {
    ev.preventDefault()
    const r = paraRascunho(campos)
    const problema = validar(r)
    if (problema) {
      setErro(problema)
      return
    }
    if (editandoId) {
      atualizar((e) => editar(e, editandoId, r))
      setAviso('Alteração salva')
      setEditandoId(null)
      setCampos(vazio(r.materiaId))
    } else {
      atualizar((e) => registrar(e, r))
      setAviso(`${r.resolvidas} ${r.resolvidas === 1 ? 'questão registrada' : 'questões registradas'}`)
      // Mantém data e matéria para lançar o próximo tópico em seguida.
      setCampos((c) => ({ ...c, topico: '', resolvidas: '', acertos: '', obs: '' }))
      topicoRef.current?.focus()
    }
  }

  const comecarEdicao = (id: string) => {
    const l = estado.log.find((x) => x.id === id)
    if (!l) return
    setEditandoId(id)
    setApagarId(null)
    setErro(null)
    setCampos({
      data: l.data,
      materiaId: l.materiaId,
      topico: l.topico,
      resolvidas: String(l.resolvidas),
      acertos: String(l.acertos),
      obs: l.obs,
    })
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const cancelarEdicao = () => {
    setEditandoId(null)
    setErro(null)
    setCampos(vazio(campos.materiaId))
  }

  const tHoje = totais(doDia(estado.log, hoje))
  const tSemana = totais(daSemana(estado.log, hoje))
  const tTotal = totais(estado.log)

  const filtrado = filtro ? estado.log.filter((l) => l.materiaId === filtro) : estado.log
  const dias = porDia(filtrado)
  const visiveis = dias.slice(0, paginas * DIAS_POR_PAGINA)

  return (
    <>
      <header className="topo">
        <div>
          <div className="sobre">Logs de questões</div>
          <h1>Registrar questões</h1>
        </div>
      </header>

      <section className="kpis" aria-label="Resumo do Log">
        {[
          { rotulo: 'Hoje', t: tHoje },
          { rotulo: 'Esta semana', t: tSemana },
          { rotulo: 'Total', t: tTotal },
        ].map(({ rotulo, t }) => (
          <div key={rotulo} className="kpi">
            <span className="kpi-rotulo">{rotulo}</span>
            <b>{t.resolvidas}</b>
            <span className={`pct ${t.pct === null ? '' : faixaAcerto(t.pct, meta)}`}>{fmtPct(t.pct)} de acerto</span>
          </div>
        ))}
      </section>

      <div className="grade duas">
        <form ref={formRef} className="cartao formulario" onSubmit={enviar} noValidate>
          <div className="secao-titulo">
            <h2>{editandoId ? 'Editar registro' : 'Novo registro'}</h2>
            {editandoId && (
              <button type="button" className="botao secundario pequeno" onClick={cancelarEdicao}>
                Cancelar
              </button>
            )}
          </div>

          <div className="linha-campos">
            <label className="campo">
              <span>Data</span>
              <input id="log-data" type="date" value={campos.data} max={hoje} onChange={muda('data')} />
            </label>
            <label className="campo cresce">
              <span>Matéria</span>
              <select id="log-materia" value={campos.materiaId} onChange={muda('materiaId')}>
                <optgroup label="No giro">
                  {opcoes.doGiro.map((m) => (
                    <option key={m!.id} value={m!.id}>
                      {m!.nome}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Fora do giro">
                  {opcoes.outras.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome}
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>
          </div>

          <label className="campo">
            <span>Tópico (nome do filtro do Tec)</span>
            <input
              id="log-topico"
              ref={topicoRef}
              list="log-topicos"
              value={campos.topico}
              onChange={muda('topico')}
              placeholder={sugestoes[0] ? `Ex.: ${sugestoes[0]}` : 'Opcional'}
              autoComplete="off"
            />
            <datalist id="log-topicos">
              {sugestoes.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </label>

          <div className="linha-campos numeros">
            <label className="campo">
              <span>Resolvidas</span>
              <input
                id="log-resolvidas"
                type="number"
                inputMode="numeric"
                min={1}
                value={campos.resolvidas}
                onChange={muda('resolvidas')}
              />
            </label>
            <label className="campo">
              <span>Acertos</span>
              <input
                id="log-acertos"
                type="number"
                inputMode="numeric"
                min={0}
                value={campos.acertos}
                onChange={muda('acertos')}
              />
            </label>
            <div className="campo previa" aria-live="polite">
              <span>Acerto</span>
              <output className={`pct grande ${previa === null ? '' : faixaAcerto(previa, meta)}`}>
                {fmtPct(previa)}
              </output>
            </div>
          </div>

          <label className="campo">
            <span>Observações</span>
            <input id="log-obs" value={campos.obs} onChange={muda('obs')} placeholder="Banca, simulado, revisão…" />
          </label>

          {erro && (
            <p className="erro" role="alert">
              {erro}
            </p>
          )}
          <div className="acoes-form">
            <button type="submit" className="botao">
              {editandoId ? 'Salvar alteração' : 'Registrar'}
            </button>
            {aviso && (
              <span className="aviso-ok" role="status">
                ✓ {aviso}
              </span>
            )}
          </div>
        </form>

        <section className="cartao">
          <div className="secao-titulo">
            <h2>Histórico</h2>
            <select
              id="log-filtro"
              className="filtro"
              value={filtro}
              onChange={(e) => {
                setFiltro(e.target.value)
                setPaginas(1)
              }}
              aria-label="Filtrar por matéria"
            >
              <option value="">Todas as matérias</option>
              {estado.materias
                .filter((m) => estado.log.some((l) => l.materiaId === m.id))
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
            </select>
          </div>

          {visiveis.length === 0 && <p className="vazio">Nenhum registro ainda.</p>}
          <div className="dias">
            {visiveis.map((d) => (
              <div key={d.data} className="dia">
                <div className="dia-cabeca">
                  <strong>{d.data === hoje ? 'Hoje' : dataCurta(d.data)}</strong>
                  <span className="discreto">
                    {d.totais.resolvidas} questões ·{' '}
                    <span className={`pct ${faixaAcerto(d.totais.pct ?? 0, meta)}`}>{fmtPct(d.totais.pct)}</span>
                  </span>
                </div>
                <ul className="registros">
                  {d.linhas.map((l) => {
                    const pct = l.acertos / l.resolvidas
                    return (
                      <li key={l.id} className={editandoId === l.id ? 'editando' : ''}>
                        <button className="registro" onClick={() => comecarEdicao(l.id)} aria-label={`Editar ${l.topico || nomes.get(l.materiaId)}`}>
                          <span className="registro-texto">
                            <span className="registro-topico">{l.topico || 'Sem tópico'}</span>
                            <span className="discreto">
                              {nomes.get(l.materiaId) ?? l.materiaId}
                              {l.obs ? ` · ${l.obs}` : ''}
                            </span>
                          </span>
                          <span className="registro-num">
                            {l.acertos}/{l.resolvidas}
                          </span>
                          <span className={`pct ${faixaAcerto(pct, meta)}`}>{fmtPct(pct)}</span>
                        </button>
                        {apagarId === l.id ? (
                          <span className="confirma">
                            <button className="botao perigo pequeno" onClick={() => {
                              atualizar((e) => remover(e, l.id))
                              setApagarId(null)
                              if (editandoId === l.id) cancelarEdicao()
                              setAviso('Registro apagado')
                            }}>
                              Apagar
                            </button>
                            <button className="botao secundario pequeno" onClick={() => setApagarId(null)}>
                              Manter
                            </button>
                          </span>
                        ) : (
                          <button className="apagar" aria-label="Apagar registro" onClick={() => setApagarId(l.id)}>
                            ×
                          </button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
          {dias.length > visiveis.length && (
            <button className="botao secundario largo" onClick={() => setPaginas((p) => p + 1)}>
              Mostrar dias anteriores ({dias.length - visiveis.length})
            </button>
          )}
        </section>
      </div>
    </>
  )
}
