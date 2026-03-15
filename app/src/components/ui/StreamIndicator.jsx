import styles from './StreamIndicator.module.css'

/* StreamIndicator — muestra qué campos de la respuesta IA ya han llegado */
export default function StreamIndicator({ campos = [], streamText = '' }) {
  if (!streamText) return null

  return (
    <div className={styles.container}>
      {campos.map(campo => {
        const detectado = streamText.toLowerCase().includes(campo.toLowerCase())
        return (
          <span
            key={campo}
            className={`${styles.campo} ${detectado ? styles.campoDetectado : ''}`}
          >
            {campo}
          </span>
        )
      })}
    </div>
  )
}
