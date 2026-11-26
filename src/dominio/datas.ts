/** Data local no formato AAAA-MM-DD. */
export function hojeISO(agora = new Date()): string {
  const y = agora.getFullYear()
  const m = String(agora.getMonth() + 1).padStart(2, '0')
  const d = String(agora.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function paraUTC(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

export function diasEntre(deISO: string, ateISO: string): number {
  return Math.round((paraUTC(ateISO) - paraUTC(deISO)) / 86_400_000)
}

export interface Contagem {
  dias: number
  semanas: number
  resto: number
  texto: string
}

export function contagemRegressiva(dataProva: string, hoje: string): Contagem {
  const dias = diasEntre(hoje, dataProva)
  const semanas = Math.floor(Math.max(0, dias) / 7)
  const resto = Math.max(0, dias) % 7
  let texto: string
  if (dias < 0) texto = 'Prova realizada'
  else if (dias === 0) texto = 'É hoje!'
  else if (semanas === 0) texto = `${resto} d`
  else texto = resto ? `${semanas} sem + ${resto} d` : `${semanas} sem`
  return { dias, semanas, resto, texto }
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export function dataCurta(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MESES[m - 1]} ${y}`
}

export function dataPorExtenso(agora = new Date()): string {
  return agora.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}
