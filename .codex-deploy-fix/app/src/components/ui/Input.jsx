import styles from './Input.module.css'

/* Input — campo de texto base con soporte para icono izquierdo */
export default function Input({
  value,
  onChange,
  placeholder,
  iconLeft,
  type = 'text',
  disabled = false,
  className = '',
  onKeyDown,
}) {
  return (
    <div className={styles.wrapper}>
      {iconLeft && (
        <span className={styles.iconLeft}>{iconLeft}</span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`${styles.input} ${iconLeft ? styles.hasIcon : ''} ${className}`}
      />
    </div>
  )
}
