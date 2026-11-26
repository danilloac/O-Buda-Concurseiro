import { useState } from 'react'
import { useEstado } from '../dados/Estado'
import { dataCurta, hojeISO } from '../dominio/datas'
import {
  alternarBloco,
  alternarCheck,
  concluida,
  faixaDoBloco,
  fecharGiro,
  linhasDoGiro,
  moverNaOrdem,
  resumoDoGiro,
  rotuloStatus,
} from '../dominio/giro'

export function Giro() {
  const { estado, atualizar } = useEstado()
  const [editando, setEditando] = useState(false)
  const [confirmar, setConfirmar] = useState(false)
  const tam = estado.parametros.tamanhoBloco
  const linhas = linhasDoGiro(estado)
  const resumo = resumoDoGiro(estado, linhas)
  const pct = resumo.meta ? Math.min(100, Math.round((resumo.feitas / resumo.meta) * 100)) : 0

  return (
    <>
      <header className="topo">
        <div>
          <div className="sobre">Desde {dataCurta(resumo.inicio)}</div>
          <h1>Giro {resumo.numero}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="botao secundario" onClick={() => setEditando((v) => !v)} aria-pressed={editando}>
            {editando ? 'Pronto' : 'Reordenar'}
          </button>
          <button className="botao" onClick={() => setConfirmar(true)}>
            Fechar giro
          </button>
        </div>
      </header>

      <section className="cartao">
        <div className="barra" aria-label={`${pct}% das questões ideais`}>
          <span style={{ width: `${pct}%` }} />
        </div>
        <div className="resumo">
          <div>
            <b>
              {resumo.concluidas}/{resumo.totalMaterias}
            </b>
            <span>matérias concluídas</span>
          </div>
          <div>
            <b>
              {resumo.feitas}/{resumo.meta}
            </b>
            <span>questões (ideal)</span>
          </div>
          <div>
            <b>
              {resumo.comErros}/{resumo.totalMaterias}
            </b>
            <span>caderno de erros</span>
          </div>
          <div>
            <b>
              {resumo.comRevisao}/{resumo.totalMaterias}
            </b>
            <span>revisões feitas</span>
          </div>
        </div>
        {confirmar && (
          <div className="aviso" role="alertdialog" aria-label="Confirmar fechamento do giro">
            <span>
              {resumo.podeFechar
                ? `Fechar o Giro ${resumo.numero}? Ele vai para o histórico e as marcações recomeçam.`
                : `Ainda faltam ${resumo.totalMaterias - resumo.concluidas} matérias no mínimo. Fechar mesmo assim?`}
            </span>
            <span style={{ display: 'flex', gap: 8 }}>
              <button className="botao secundario" onClick={() => setConfirmar(false)}>
                Cancelar
              </button>
              <button
                className={resumo.podeFechar ? 'botao' : 'botao perigo'}
                onClick={() => {
                  atualizar((e) => fecharGiro(e, hojeISO()))
                  setConfirmar(false)
                }}
              >
                Fechar giro
              </button>
            </span>
          </div>
        )}
      </section>

      <div className="legenda" aria-label="Legenda dos blocos">
        <span><i style={{ background: 'var(--minimo)' }} />até o mínimo</span>
        <span><i style={{ background: 'var(--ideal)' }} />até o ideal</span>
        <span><i style={{ background: 'var(--cauda)' }} />cauda</span>
        <span><i style={{ background: 'var(--extra)' }} />extra (até o máximo)</span>
        <span>cada bloco = {tam} questões</span>
      </div>

      <div className="materias">
        {linhas.map((l, i) => {
          const ehProxima = resumo.proxima?.id === l.materia.id
          return (
            <article key={l.materia.id} className={`cartao materia${concluida(l.status) ? ' concluida' : ''}`}>
              <div className="cabeca">
                <span className="ordem">{i + 1}</span>
                <div className="titulo">
                  <h3>{l.materia.nome}</h3>
                  <span className="discreto">
                    {l.materia.nivel} · mín {l.metas.minimo} · ideal {l.metas.ideal} · máx {l.metas.maximo}
                  </span>
                </div>
                {ehProxima ? (
                  <span className="status proxima">Próxima</span>
                ) : (
                  <span className={`status ${l.status}`}>{rotuloStatus(l.status, l.feitas, l.metas)}</span>
                )}
              </div>

              <div className="blocos" role="group" aria-label={`Blocos de ${l.materia.nome}`}>
                {l.marcacao.blocos.map((marcado, b) => {
                  const faixa = faixaDoBloco(b, l.metas, tam)
                  return (
                    <button
                      key={b}
                      className={`bloco ${faixa}${marcado ? ' marcado' : ''}`}
                      aria-pressed={marcado}
                      aria-label={`Bloco ${b + 1}, questões ${b * tam + 1} a ${(b + 1) * tam}`}
                      onClick={() => atualizar((e) => alternarBloco(e, l.materia.id, b))}
                    >
                      {(b + 1) * tam}
                    </button>
                  )
                })}
              </div>

              <div className="rodape-materia">
                <div className="checks">
                  <button
                    className={`check${l.marcacao.erros ? ' feito' : ''}`}
                    aria-pressed={l.marcacao.erros}
                    onClick={() => atualizar((e) => alternarCheck(e, l.materia.id, 'erros'))}
                  >
                    <span className="caixa">{l.marcacao.erros ? '✓' : ''}</span> Erros
                  </button>
                  <button
                    className={`check${l.marcacao.revisao ? ' feito' : ''}`}
                    aria-pressed={l.marcacao.revisao}
                    onClick={() => atualizar((e) => alternarCheck(e, l.materia.id, 'revisao'))}
                  >
                    <span className="caixa">{l.marcacao.revisao ? '✓' : ''}</span> Revisar{' '}
                    {l.revisarMateria?.nome ?? '—'}
                  </button>
                </div>
                {editando ? (
                  <div className="mover">
                    <button
                      aria-label={`Subir ${l.materia.nome}`}
                      disabled={i === 0}
                      onClick={() => atualizar((e) => moverNaOrdem(e, l.materia.id, -1))}
                    >
                      ↑
                    </button>
                    <button
                      aria-label={`Descer ${l.materia.nome}`}
                      disabled={i === linhas.length - 1}
                      onClick={() => atualizar((e) => moverNaOrdem(e, l.materia.id, 1))}
                    >
                      ↓
                    </button>
                  </div>
                ) : (
                  <span className="discreto">
                    {l.feitas} {l.feitas === 1 ? 'feita' : 'feitas'} · ideal {l.metas.ideal}
                  </span>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {estado.historico.length > 0 && (
        <section className="cartao" style={{ marginTop: 18 }}>
          <div className="secao-titulo">
            <h2>Histórico de giros</h2>
          </div>
          <ul className="historico">
            {[...estado.historico].reverse().map((g) => (
              <li key={g.numero}>
                <strong>Giro {g.numero}</strong>
                <span className="discreto">
                  {dataCurta(g.inicio)} → {dataCurta(g.fechamento)}
                </span>
                <span>
                  {g.feitas} de {g.meta} questões · erros {g.materiasComErros}/{g.totalMaterias} · revisão{' '}
                  {g.materiasComRevisao}/{g.totalMaterias}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
