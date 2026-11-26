import { useMemo, useState } from 'react'
import { useEstado } from '../dados/Estado'
import { aplicarEdital, lerEdital, resumoDaLeitura } from '../dominio/edital'

const EXEMPLO = `LÍNGUA PORTUGUESA: 1 Compreensão de textos. 2 Ortografia oficial. 3 Emprego da crase.

# Arquivologia
Conceitos fundamentais
Gestão de documentos`

/** Cola o texto do edital (ou abre um .csv/.txt) e mostra o que vai entrar antes de gravar. */
export function ImportarEdital({ aoFechar }: { aoFechar?: () => void }) {
  const { estado, atualizar } = useEstado()
  const [texto, setTexto] = useState('')
  const [substituir, setSubstituir] = useState(true)
  const [novasNoGiro, setNovasNoGiro] = useState(true)
  const [feito, setFeito] = useState<number | null>(null)
  const leitura = useMemo(() => lerEdital(texto), [texto])
  const resumo = useMemo(() => resumoDaLeitura(estado.materias, leitura.itens), [estado.materias, leitura.itens])
  const temAtual = estado.editalItens.length > 0
  const novas = resumo.materias.filter((m) => m.nova).length

  const abrirArquivo = (arquivo: File | undefined) => {
    if (!arquivo) return
    const r = new FileReader()
    r.onload = () => setTexto(String(r.result ?? ''))
    r.readAsText(arquivo)
  }

  return (
    <section className="cartao formulario importar-edital">
      <div className="secao-titulo">
        <h2>Importar edital</h2>
        {aoFechar && (
          <button className="botao secundario pequeno" onClick={aoFechar}>
            Fechar
          </button>
        )}
      </div>
      <p className="discreto cfg-nota">
        Cole o conteúdo programático. Cada matéria começa com <b>NOME DA MATÉRIA:</b> ou <b># Nome</b>, e cada linha depois dela vira um item
        (itens numerados na mesma linha, como “1 … 2 …”, são separados). Também serve uma tabela copiada da planilha com as colunas matéria,
        item e concurso (Ambos, Só TRT 8…).
      </p>
      <label className="campo">
        <span>Texto do edital</span>
        <textarea rows={8} value={texto} onChange={(ev) => (setTexto(ev.target.value), setFeito(null))} placeholder={EXEMPLO} />
      </label>
      <label className="botao secundario pequeno arquivo">
        Abrir arquivo .txt ou .csv
        <input type="file" accept=".txt,.csv,.tsv,text/plain,text/csv" onChange={(ev) => abrirArquivo(ev.target.files?.[0])} />
      </label>

      {texto.trim() && (
        <div className="previa-importacao" aria-live="polite">
          <strong>
            {leitura.itens.length} itens em {resumo.materias.length} matérias
            {novas ? ` · ${novas} nova${novas > 1 ? 's' : ''}` : ''}
            {resumo.concursos.length ? ` · concursos: ${resumo.concursos.join(', ')}` : ''}
          </strong>
          <ul>
            {resumo.materias.map((m) => (
              <li key={m.nome}>
                {m.nome} <span className="discreto">{m.itens}</span>
                {m.nova && <span className="chip acento">nova</span>}
              </li>
            ))}
          </ul>
          {leitura.avisos.map((a) => (
            <p key={a} className="erro">
              {a}
            </p>
          ))}
        </div>
      )}

      {temAtual && (
        <div className="segmentado" role="radiogroup" aria-label="O que fazer com o edital atual">
          <button role="radio" aria-checked={substituir} className={substituir ? 'ativo' : ''} onClick={() => setSubstituir(true)}>
            Substituir os {estado.editalItens.length} itens
          </button>
          <button role="radio" aria-checked={!substituir} className={!substituir ? 'ativo' : ''} onClick={() => setSubstituir(false)}>
            Acrescentar
          </button>
        </div>
      )}
      <div className="checks">
        <button type="button" className={`check${novasNoGiro ? ' feito' : ''}`} aria-pressed={novasNoGiro} onClick={() => setNovasNoGiro(!novasNoGiro)}>
          <span className="caixa">{novasNoGiro ? '✓' : ''}</span> Matérias novas entram no giro
        </button>
      </div>
      {feito !== null && <p className="aviso-ok">{feito} itens importados. Ajuste as metas das matérias novas na Configuração.</p>}
      <div className="acoes-form">
        <button
          className="botao"
          disabled={!leitura.itens.length}
          onClick={() => {
            atualizar((e) => aplicarEdital(e, leitura.itens, { substituir: substituir || !temAtual, novasNoGiro }))
            setFeito(leitura.itens.length)
            setTexto('')
            aoFechar?.()
          }}
        >
          Importar {leitura.itens.length || ''} itens
        </button>
      </div>
    </section>
  )
}
