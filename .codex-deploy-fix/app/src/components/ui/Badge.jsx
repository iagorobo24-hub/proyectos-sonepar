import styles from './Badge.module.css'

/* Badge — etiqueta de estado reutilizable con punto de color */
export default function Badge({ variant = 'categoria', children }) {
  const conPunto = variant.startsWith('stock')

  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      {conPunto && <span className={styles.dot} />}
      {children}
    </span>
  )
}
