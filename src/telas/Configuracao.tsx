import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useEstado } from '../dados/Estado'
import {
  alterarLembrete,
  alterarMateria,
  alterarParametros,
  novaMateria,
  novoLembrete,
  removerLembrete,
  removerProva,
  salvarProva,
  validarMetas,
} from '../dominio/config'
import { MULTIPLICADOR_NIVEL, metasDaMateria, resumoDoGiro, semanasPorGiro } from '../dominio/giro'
import type { DestinoExtra, Materia, NivelExperiencia, NivelMateria, Parametros } from '../dominio/tipos'

const NIVEIS: NivelExperiencia[] = ['Iniciante', 'Intermediário', 'Avançado']
const NIVEIS_MATERIA: NivelMateria[] = ['Facilidade', 'Dificuldade', 'Lei seca']
const DESTINOS: DestinoExtra[] = ['Núcleo', 'Cauda', 'Caderno único']
const virgula = (v: number, casas = 1) => String(Math.round(v * 10 ** casas) / 10 ** casas).replace('.', ',')

/** Campo numérico que aceita apagar e redigitar: só grava quando o valor é válido. */
function Numero({ rotulo, valor, onValor, min = 0, max, passo = 1, sufixo }: {
  rotulo: string
  valor: number
  onValor: (v: number) => void
  min?: number
  max?: number
  passo?: number
  sufixo?: ReactNode
}) {
  const [texto, setTexto] = useState(String(valor))
  useEffect(() => setTexto(String(valor)), [valor])
  return (
    <label className="campo">
      <span>{rotulo}</span>
      <span className="com-sufixo">
        <input
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={passo}
          value={texto}
          onChange={(ev) => {
            setTexto(ev.target.value)
            const n = Number(ev.target.value.replace(',', '.'))
            if (ev.target.value !== '' && Number.isFinite(n) && n >= min && (max === undefined || n <= max)) onValor(n)
          }}
          onBlur={() => setTexto(String(valor))}
        />
        {sufixo && <span className="sufixo">{sufixo}</span>}
      </span>
    </label>
  )
}

function CartaoMateria({ m }: { m: Materia }) {
  const { estado, atualizar } = useEstado()
  const muda = (patch: Partial<Omit<Materia, 'id'>>) => atualizar((e) => alterarMateria(e, m.id, patch))
  const metas = metasDaMateria(m, estado.parametros)
  const erro = validarMetas(m)
  return (
    <details className="cfg-materia">
      <summary>
        <span className="cfg-nome">{m.nome}</span>
        <span className="cfg-metas discreto">
          {m.entraNoGiro ? `${metas.minimo} · ${metas.ideal} · ${metas.maximo}` : 'fora do giro'}
        </span>
        <span className="chip">{m.nivel}</span>
      </summary>
      <div className="cfg-corpo">
        <div className="linha-campos">
          <label className="campo cresce">
            <span>Nome</span>
            <input value={m.nome} onChange={(ev) => ev.target.value.trim() && muda({ nome: ev.target.value })} />
          </label>
          <label className="campo">
            <span>Nível</span>
            <select value={m.nivel} onChange={(ev) => muda({ nivel: ev.target.value as NivelMateria })}>
              {NIVEIS_MATERIA.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>
        <button className={`check${m.entraNoGiro ? ' feito' : ''}`} aria-pressed={m.entraNoGiro} onClick={() => muda({ entraNoGiro: !m.entraNoGiro })}>
          <span className="caixa">{m.entraNoGiro ? '✓' : ''}</span> Entra no giro
        </button>
        {m.entraNoGiro && (
          <>
            <div className="linha-campos cfg-metas-campos">
              <Numero rotulo="Mínimo" valor={m.minimo} onValor={(v) => muda({ minimo: v })} />
              <Numero rotulo="Ideal" valor={m.ideal} onValor={(v) => muda({ ideal: v })} />
              <Numero rotulo="Máximo" valor={m.maximo} onValor={(v) => muda({ maximo: v })} />
              <Numero rotulo="Cauda no ideal" valor={m.caudaNoIdeal} onValor={(v) => muda({ caudaNoIdeal: v })} />
            </div>
            <label className="campo">
              <span>Questões além do ideal vão para</span>
              <select value={m.extraVaiPara} onChange={(ev) => muda({ extraVaiPara: ev.target.value as DestinoExtra })}>
                {DESTINOS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            {erro ? (
              <p className="erro">{erro}</p>
            ) : (
              <p className="discreto cfg-nota">
                Metas base do nível Intermediário. Com o nível {estado.parametros.nivel} (×{virgula(MULTIPLICADOR_NIVEL[estado.parametros.nivel], 2)}) e blocos de{' '}
                {estado.parametros.tamanhoBloco}, o giro pede {metas.minimo} · {metas.ideal} · {metas.maximo}
                {metas.cauda ? `, cauda ${metas.cauda}` : ''}.
              </p>
            )}
          </>
        )}
      </div>
    </details>
  )
}

export function Configuracao() {
  const { estado, atualizar } = useEstado()
  const p = estado.parametros
  const par = (patch: Partial<Parametros>) => atualizar((e) => alterarParametros(e, patch))
  const resumo = resumoDoGiro(estado)
  const semanas = semanasPorGiro(estado, resumo)
  const [novaMat, setNovaMat] = useState('')
  const [prova, setProva] = useState({ nome: '', banca: '', data: '' })
  const [lembrete, setLembrete] = useState({ nome: '', nota: '' })
  const [apagar, setApagar] = useState<string | null>(null)

  const doGiro = estado.giro.ordem.map((id) => estado.materias.find((m) => m.id === id)).filter((m): m is Materia => !!m)
  const fora = estado.materias.filter((m) => !m.entraNoGiro)

  const addProva = (ev: FormEvent) => {
    ev.preventDefault()
    if (!prova.nome.trim() || !prova.data) return
    atualizar((e) => salvarProva(e, prova))
    setProva({ nome: '', banca: '', data: '' })
  }

  return (
    <>
      <header className="topo">
        <div>
          <div className="sobre">Formulário e configuração inicial</div>
          <h1>Configuração</h1>
        </div>
        <span className="chip primaria">≈ {virgula(semanas)} semanas por giro</span>
      </header>

      <div className="grade duas cfg-grade">
        <section className="cartao formulario">
          <h2>Seu plano</h2>
          <label className="campo">
            <span>Concurso</span>
            <input value={p.concurso} onChange={(ev) => par({ concurso: ev.target.value })} />
          </label>
          <div className="linha-campos">
            <Numero rotulo="Horas por dia" valor={p.horasPorDia} passo={0.5} max={16} onValor={(v) => par({ horasPorDia: v })} sufixo="h" />
            <Numero rotulo="Dias por semana" valor={p.diasPorSemana} min={1} max={7} onValor={(v) => par({ diasPorSemana: v })} />
          </div>
          <div className="campo">
            <span id="cfg-nivel">Nível em questões</span>
            <div className="segmentado" role="radiogroup" aria-labelledby="cfg-nivel">
              {NIVEIS.map((n) => (
                <button key={n} role="radio" aria-checked={p.nivel === n} className={p.nivel === n ? 'ativo' : ''} onClick={() => par({ nivel: n })}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="linha-campos">
            <Numero rotulo="Meta de acerto" valor={Math.round(p.metaAcerto * 100)} max={100} onValor={(v) => par({ metaAcerto: v / 100 })} sufixo="%" />
            <Numero rotulo="Erros por dia" valor={p.errosPorDia} onValor={(v) => par({ errosPorDia: v })} />
          </div>
          <p className="discreto cfg-nota">
            O giro tem {resumo.totalMaterias} matérias e {resumo.meta} inéditas no ideal. Com {p.horasPorDia}h por dia em {p.diasPorSemana} dias, fecha em
            cerca de {virgula(semanas)} semanas.
          </p>
        </section>

        <section className="cartao formulario">
          <h2>Tempos e regras</h2>
          <div className="linha-campos">
            <Numero rotulo="Por inédita" valor={p.minPorInedita} passo={0.5} min={0.5} onValor={(v) => par({ minPorInedita: v })} sufixo="min" />
            <Numero rotulo="Por erro" valor={p.minPorErro} passo={0.5} onValor={(v) => par({ minPorErro: v })} sufixo="min" />
          </div>
          <div className="linha-campos">
            <Numero rotulo="Por revisão" valor={p.minPorRevisao} onValor={(v) => par({ minPorRevisao: v })} sufixo="min" />
            <Numero rotulo="Uma revisão a cada" valor={p.ritmoRevisaoHoras} passo={0.5} min={0.5} onValor={(v) => par({ ritmoRevisaoHoras: v })} sufixo="h" />
          </div>
          <div className="linha-campos">
            <Numero rotulo="Bloco de questões" valor={p.tamanhoBloco} min={1} max={10} onValor={(v) => par({ tamanhoBloco: v })} />
            <Numero rotulo="Revisa a matéria de" valor={p.espacamentoRevisao} min={1} max={20} onValor={(v) => par({ espacamentoRevisao: v })} sufixo="atrás" />
          </div>
          <p className="discreto cfg-nota">Os tempos montam o plano de Hoje. A revisão do dia é da matéria que ficou essa quantidade de posições atrás no ciclo.</p>
        </section>
      </div>

      <section className="cartao" style={{ marginTop: 14 }}>
        <div className="secao-titulo">
          <h2>Matérias</h2>
          <span className="discreto">mín · ideal · máx por giro</span>
        </div>
        <h3 className="cfg-sub">No giro, na ordem do ciclo</h3>
        {doGiro.map((m) => (
          <CartaoMateria key={m.id} m={m} />
        ))}
        {fora.length > 0 && <h3 className="cfg-sub">Fora do giro</h3>}
        {fora.map((m) => (
          <CartaoMateria key={m.id} m={m} />
        ))}
        <form
          className="cfg-add"
          onSubmit={(ev) => {
            ev.preventDefault()
            atualizar((e) => novaMateria(e, novaMat))
            setNovaMat('')
          }}
        >
          <input className="filtro" value={novaMat} onChange={(ev) => setNovaMat(ev.target.value)} placeholder="Nova matéria" aria-label="Nome da nova matéria" />
          <button className="botao" disabled={!novaMat.trim()}>
            Adicionar
          </button>
        </form>
        <p className="discreto cfg-nota">A ordem do ciclo muda na tela do Giro. Uma matéria nova entra no fim do ciclo.</p>
      </section>

      <div className="grade duas" style={{ marginTop: 14 }}>
        <section className="cartao">
          <div className="secao-titulo">
            <h2>Provas</h2>
          </div>
          <ul className="cfg-lista">
            {estado.provas.map((pr) => (
              <li key={pr.id}>
                <input className="filtro" value={pr.nome} aria-label="Nome da prova" onChange={(ev) => atualizar((e) => salvarProva(e, { ...pr, nome: ev.target.value }))} />
                <input className="filtro curto" value={pr.banca} aria-label="Banca" onChange={(ev) => atualizar((e) => salvarProva(e, { ...pr, banca: ev.target.value }))} />
                <input
                  className="filtro"
                  type="date"
                  value={pr.data}
                  aria-label="Data da prova"
                  onChange={(ev) => ev.target.value && atualizar((e) => salvarProva(e, { ...pr, data: ev.target.value }))}
                />
                {apagar === pr.id ? (
                  <button className="botao perigo pequeno" onClick={() => atualizar((e) => removerProva(e, pr.id))}>
                    Apagar
                  </button>
                ) : (
                  <button className="apagar" aria-label={`Apagar ${pr.nome}`} onClick={() => setApagar(pr.id)}>
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>
          <form className="cfg-lista cfg-nova" onSubmit={addProva}>
            <input className="filtro" value={prova.nome} onChange={(ev) => setProva({ ...prova, nome: ev.target.value })} placeholder="Nova prova" aria-label="Nome da nova prova" />
            <input className="filtro curto" value={prova.banca} onChange={(ev) => setProva({ ...prova, banca: ev.target.value })} placeholder="Banca" aria-label="Banca da nova prova" />
            <input className="filtro" type="date" value={prova.data} onChange={(ev) => setProva({ ...prova, data: ev.target.value })} aria-label="Data da nova prova" />
            <button className="botao pequeno" disabled={!prova.nome.trim() || !prova.data}>
              +
            </button>
          </form>
        </section>

        <section className="cartao">
          <div className="secao-titulo">
            <h2>Lembretes do dia</h2>
          </div>
          <ul className="cfg-lista">
            {estado.lembretes.map((l) => (
              <li key={l.id} className="lembrete-cfg">
                <input className="filtro" value={l.nome} aria-label="Lembrete" onChange={(ev) => atualizar((e) => alterarLembrete(e, l.id, { nome: ev.target.value }))} />
                <input className="filtro" value={l.nota} placeholder="Nota" aria-label={`Nota de ${l.nome}`} onChange={(ev) => atualizar((e) => alterarLembrete(e, l.id, { nota: ev.target.value }))} />
                {apagar === l.id ? (
                  <button className="botao perigo pequeno" onClick={() => atualizar((e) => removerLembrete(e, l.id))}>
                    Apagar
                  </button>
                ) : (
                  <button className="apagar" aria-label={`Apagar ${l.nome}`} onClick={() => setApagar(l.id)}>
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>
          <form
            className="cfg-lista cfg-nova lembrete-cfg"
            onSubmit={(ev) => {
              ev.preventDefault()
              atualizar((e) => novoLembrete(e, lembrete.nome, lembrete.nota))
              setLembrete({ nome: '', nota: '' })
            }}
          >
            <input className="filtro" value={lembrete.nome} onChange={(ev) => setLembrete({ ...lembrete, nome: ev.target.value })} placeholder="Novo lembrete" aria-label="Novo lembrete" />
            <input className="filtro" value={lembrete.nota} onChange={(ev) => setLembrete({ ...lembrete, nota: ev.target.value })} placeholder="Nota" aria-label="Nota do novo lembrete" />
            <button className="botao pequeno" disabled={!lembrete.nome.trim()}>
              +
            </button>
          </form>
        </section>
      </div>
    </>
  )
}
