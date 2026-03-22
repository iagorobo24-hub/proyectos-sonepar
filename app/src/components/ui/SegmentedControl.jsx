import styles from './SegmentedControl.module.css'

/* Control segmentado — reemplaza botones de turno en KPI */
export default function SegmentedControl({ options, value, onChange }) {
  return (
    <div className={styles.wrap}>
      {options.map(opt => (
        <button
          key={opt.value}
          className={`${styles.btn} ${value === opt.value ? styles.active : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
