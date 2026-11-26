import { Link } from 'react-router-dom'
import { useEstado } from '../dados/Estado'
import { contagemRegressiva, dataPorExtenso, hojeISO } from '../dominio/datas'
import { linhasDoGiro, planoDoDia, resumoDoGiro } from '../dominio/giro'
import { doDia, fmtPct, totais } from '../dominio/log'
import { Anel } from '../componentes/Anel'

const ATALHOS = [1, 2, 3, 4, 5]

function saudacao(h = new Date().getHours()) {
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

const fmtHoras = (h: number) => (Number.isInteger(h) ? `${h}h` : `${String(h).replace('.', ',')}h`)

export function Hoje() {
  const { estado, atualizar } = useEstado()
  const hoje = hojeISO()
  const horas = estado.horasHoje?.data === hoje ? estado.horasHoje.horas : estado.parametros.horasPorDia
  const linhas = linhasDoGiro(estado)
  const resumo = resumoDoGiro(estado, linhas)
  const plano = planoDoDia(estado, horas, resumo)
  const proxima = linhas.find((l) => l.materia.id === resumo.proxima?.id)
  const logHoje = totais(doDia(estado.log, hoje))

  const definirHoras = (h: number) =>
    atualizar((e) => ({ ...e, horasHoje: { data: hoje, horas: Math.min(16, Math.max(0, h)) } }))

  const alternarLembrete = (id: string) =>
    atualizar((e) => ({ ...e, lembretes: e.lembretes.map((l) => (l.id === id ? { ...l, feito: !l.feito } : l)) }))

  return (
    <>
      <header className="topo">
        <div>
          <div className="sobre data">{dataPorExtenso()}</div>
          <h1>{saudacao()}! Bora girar.</h1>
        </div>
        <span className="chip primaria">Giro {resumo.numero}</span>
      </header>

      <section className="provas" aria-label="Contagem regressiva">
        {estado.provas.map((p) => {
          const c = contagemRegressiva(p.data, hoje)
          return (
            <div className="prova" key={p.id}>
              <div className="nome">
                {p.nome} · {p.banca}
              </div>
              <div className="dias">
                {Math.max(0, c.dias)}
                <small>dias</small>
              </div>
              <div className="sem">{c.texto}</div>
            </div>
          )
        })}
      </section>

      <div className="grade duas">
        <div>
          <section className="cartao">
            <div className="secao-titulo">
              <h2>Quanto tempo você tem hoje?</h2>
            </div>
            <div className="horas">
              <div className="passo">
                <button aria-label="Menos meia hora" onClick={() => definirHoras(horas - 0.5)}>
                  −
                </button>
                <output aria-live="polite">{fmtHoras(horas)}</output>
                <button aria-label="Mais meia hora" onClick={() => definirHoras(horas + 0.5)}>
                  +
                </button>
              </div>
              <div className="atalhos">
                {ATALHOS.map((h) => (
                  <button key={h} className={h === horas ? 'ativo' : ''} onClick={() => definirHoras(h)}>
                    {h}h
                  </button>
                ))}
              </div>
            </div>

            <ul className="plano" aria-label="Plano de hoje">
              <li>
                <span className="icone erros" aria-hidden="true">✍️</span>
                <div>
                  <h3>Caderno de erros</h3>
                  <div className="detalhe">Comece por aqui · fixo por dia</div>
                </div>
                <span className="num">{plano.erros}</span>
              </li>
              <li>
                <span className="icone revisao" aria-hidden="true">📖</span>
                <div>
                  <h3>
                    Revisão de teoria · {plano.revisoes} × {estado.parametros.minPorRevisao} min
                  </h3>
                  {plano.topicos.length > 0 ? (
                    <ul className="topicos">
                      {plano.topicos.map((t) => (
                        <li key={t.id}>
                          {t.materia} – {t.topico}
                          {t.recorrente ? ' 🔴' : ''}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="detalhe">Fila de revisão vazia</div>
                  )}
                </div>
                <span className="num">{plano.minutosRevisao}′</span>
              </li>
              <li>
                <span className="icone ineditas" aria-hidden="true">🎯</span>
                <div>
                  <h3>Questões inéditas</h3>
                  <div className="detalhe">
                    {plano.blocos} {plano.blocos === 1 ? 'bloco' : 'blocos'}
                    {plano.comecarPor ? ` · começando por ${plano.comecarPor.nome}` : resumo.totalMaterias ? ' · giro concluído' : ''}
                  </div>
                </div>
                <span className="num">{plano.ineditas}</span>
              </li>
            </ul>
            <div className="atalho-log">
              <span>
                {logHoje.resolvidas > 0
                  ? `Hoje no Log: ${logHoje.resolvidas} questões · ${fmtPct(logHoje.pct)} de acerto`
                  : 'Nada registrado hoje ainda.'}
              </span>
              <Link to="/registrar" className="botao secundario">
                Registrar questões
              </Link>
            </div>
          </section>
        </div>

        <div>
          <section className="cartao">
            <div className="secao-titulo">
              <h2>Giro {resumo.numero}</h2>
              <Link to="/giro" className="discreto">
                Abrir →
              </Link>
            </div>
            <div className="anel">
              <Anel valor={resumo.feitas} total={resumo.meta} />
              <div>
                <div className="grande">
                  {resumo.concluidas} de {resumo.totalMaterias}
                </div>
                <div className="discreto">matérias concluídas</div>
                <div className="discreto">
                  {resumo.feitas} de {resumo.meta} questões
                </div>
              </div>
            </div>
            {proxima ? (
              <div className="aviso">
                <div>
                  <div className="discreto">Próxima matéria</div>
                  <strong>{proxima.materia.nome}</strong>
                  <div className="discreto">
                    Meta {proxima.metas.minimo} a {proxima.metas.ideal} questões
                  </div>
                </div>
                <Link to="/giro" className="botao">
                  Marcar blocos
                </Link>
              </div>
            ) : resumo.totalMaterias === 0 ? (
              <div className="aviso">
                <strong>Nenhuma matéria no giro ainda.</strong>
                <Link to="/configuracao" className="botao">
                  Cadastrar matérias
                </Link>
              </div>
            ) : (
              <div className="aviso">
                <strong>Todas as matérias no mínimo. Hora de fechar o giro!</strong>
                <Link to="/giro" className="botao">
                  Fechar giro
                </Link>
              </div>
            )}
          </section>

          <section className="cartao">
            <div className="secao-titulo">
              <h2>Lembretes</h2>
              <span className="discreto">fora do giro</span>
            </div>
            <div className="lembretes">
              {estado.lembretes.map((l) => (
                <button
                  key={l.id}
                  className={`lembrete${l.feito ? ' feito' : ''}`}
                  aria-pressed={l.feito}
                  onClick={() => alternarLembrete(l.id)}
                >
                  <span className="caixa">{l.feito ? '✓' : ''}</span>
                  <span>
                    {l.nome}
                    {l.nota ? <small> · {l.nota}</small> : null}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
