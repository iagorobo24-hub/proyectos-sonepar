import styles from './Card.module.css'

/* Card — contenedor base con fondo blanco, borde y sombra sutil */
export default function Card({ children, padding = 'md', className = '' }) {
  return (
    <div className={`${styles.card} ${styles[padding]} ${className}`}>
      {children}
    </div>
  )
}
