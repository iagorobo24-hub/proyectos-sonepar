import styles from './WelcomeState.module.css'

/* Componente de bienvenida para el área principal vacía */
/* Recibe: icon (componente lucide), title, subtitle, chips (array de strings), onChipClick */
export default function WelcomeState({ icon: Icon, title, subtitle, chips = [], onChipClick }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.circle1} />
      <div className={styles.circle2} />
      <div className={styles.circle3} />
      <div className={styles.content}>
        {Icon && (
          <div className={styles.iconBox}>
            <Icon size={24} strokeWidth={1.5} />
          </div>
        )}
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {chips.length > 0 && (
          <div className={styles.chips}>
            {chips.map((chip, i) => (
              <button
                key={i}
                className={`${styles.chip} ${i === chips.length - 1 ? styles.chipPrimary : ''}`}
                onClick={() => onChipClick && onChipClick(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
