import { useState } from 'react'
import { useEstado } from '../dados/Estado'
import type { LeituraTec, ResumoImportacao } from '../dominio/tec'

/** Colar à mão o JSON da leitura do Tec (o mesmo que a skill manda pelo Chrome). */
export function ImportarTec() {
  const { importarTec } = useEstado()
  const [texto, setTexto] = useState('')
  const [resultado, setResultado] = useState<ResumoImportacao | { erro: string } | null>(null)

  const importar = () => {
    let dados: LeituraTec
    try {
      dados = JSON.parse(texto)
    } catch {
      setResultado({ erro: 'O texto não é um JSON válido.' })
      return
    }
    const r = importarTec(dados)
    setResultado(r)
    if (r.ok) setTexto('')
  }

  return (
    <details className="cartao importar-tec">
      <summary>
        <h2>Receber leitura do Tec</h2>
        <span className="discreto">normalmente automática</span>
      </summary>
      <p className="discreto cfg-nota">
        A leitura das estatísticas do Tec abre o app no Chrome e manda as questões novas para o Log e a fotografia do caderno de erros. Se
        precisar, cole aqui o JSON da leitura.
      </p>
      <textarea
        rows={5}
        value={texto}
        onChange={(ev) => (setTexto(ev.target.value), setResultado(null))}
        placeholder='{"lote": "2026-11-27T21:00", "leitura": "2026-11-27", "questoes": [["Redes", "Máscara e Endereçamento IP", 6, 4]]}'
        aria-label="JSON da leitura do Tec"
      />
      {resultado && 'erro' in resultado && resultado.erro && <p className="erro">{resultado.erro}</p>}
      {resultado && 'ok' in resultado && resultado.ok && (
        <p className="aviso-ok">
          {resultado.repetido
            ? 'Essa leitura já tinha entrado. Nada foi duplicado.'
            : `${resultado.questoes} ${resultado.questoes === 1 ? 'lançamento' : 'lançamentos'} no Log (${resultado.resolvidas} questões)${resultado.topicosErros ? ` e ${resultado.topicosErros} tópicos do caderno de erros` : ''}.`}
          {resultado.materiasNovas.length ? ` Matérias novas, fora do giro: ${resultado.materiasNovas.join(', ')}.` : ''}
        </p>
      )}
      <div className="acoes-form">
        <button className="botao secundario" disabled={!texto.trim()} onClick={importar}>
          Importar leitura
        </button>
      </div>
    </details>
  )
}
