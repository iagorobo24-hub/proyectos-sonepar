import React from 'react'
import styles from './CircleLayout.module.css'

/* ═══════════════════════════════════════════════════════
 * CircleLayout — Centro + Órbitas
 * Componente reutilizable para navegación circular
 * ═══════════════════════════════════════════════════════ */

export function CircleCenter({ icon, title, desc, tip, tipLabel = 'Consejo', className = '' }) {
  return (
    <div className={`${styles.circleCenter} ${className}`}>
      {icon && <div className={styles.circleCenter__icon}>{icon}</div>}
      {title && <div className={styles.circleCenter__title}>{title}</div>}
      {desc && <p className={styles.circleCenter__desc}>{desc}</p>}
      {tip && (
        <div className={styles.circleCenter__tip}>
          <div className={styles.circleCenter__tipLabel}>{tipLabel}</div>
          <p className={styles.circleCenter__tipText}>{tip}</p>
        </div>
      )}
    </div>
  )
}

export function OrbitRing({ size = 'outer', className = '' }) {
  return (
    <div className={`${styles.orbitRing} ${styles[`orbitRing--${size}`]} ${className}`} />
  )
}

export function OrbitRow({ children, className = '' }) {
  return (
    <div className={`${styles.orbitRow} ${className}`}>
      {children}
    </div>
  )
}

export function BrandCard({ logo, logoFallback, logoColor, logoGradient, name, count, onClick, className = '' }) {
  return (
    <button className={`${styles.brandCard} ${className}`} onClick={onClick}>
      <div className={styles.brandCard__logo}>
        {logo ? (
          <img src={logo} alt={name} />
        ) : (
          <div className={styles.brandCard__logoFallback} style={{ background: logoGradient || logoColor }}>
            {logoFallback}
          </div>
        )}
      </div>
      <div className={styles.brandCard__name}>{name}</div>
      {count && <div className={styles.brandCard__count}>{count}</div>}
    </button>
  )
}

export function GamaCard({ name, meta, onClick, className = '' }) {
  return (
    <button className={`${styles.gamaCard} ${className}`} onClick={onClick}>
      <div>
        <div className={styles.gamaCard__name}>{name}</div>
        {meta && <div className={styles.gamaCard__meta}>{meta}</div>}
      </div>
      <span className={styles.gamaCard__arrow}>›</span>
    </button>
  )
}

export function RefCard({ code, desc, price, onClick, className = '' }) {
  return (
    <button className={`${styles.refCard} ${className}`} onClick={onClick}>
      <div>
        <div className={styles.refCard__code}>{code}</div>
        {desc && <div className={styles.refCard__desc}>{desc}</div>}
      </div>
      {price && <div className={styles.refCard__price}>{price}€</div>}
    </button>
  )
}

export function FichaCard({ refCode, desc, price, specs, actions, className = '' }) {
  return (
    <div className={`${styles.fichaCard} ${className}`}>
      <div className={styles.fichaCard__header}>
        <div>
          <span className={`${styles.label} ${styles['label--brand']}`}>REFERENCIA</span>
          <div className={styles.fichaCard__ref}>{refCode}</div>
          {desc && <div className={styles.fichaCard__desc}>{desc}</div>}
        </div>
        {price && (
          <div className={styles.fichaCard__price}>
            <div className={styles.fichaCard__priceValue}>{price}€</div>
            <div className={styles.fichaCard__priceLabel}>IVA incluido</div>
          </div>
        )}
      </div>

      {specs && specs.length > 0 && (
        <div className={styles.fichaCard__specs}>
          {specs.map(([label, value]) => (
            <div key={label} className={styles.fichaCard__spec}>
              <div className={styles.fichaCard__specLabel}>{label}</div>
              <div className={styles.fichaCard__specValue}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {actions && actions.length > 0 && (
        <div className={styles.fichaCard__actions}>
          {actions.map(({ label, variant = 'primary', icon, onClick }, i) => (
            <button key={i} className={`${styles.btn} ${styles[`btn--${variant}`]}`} onClick={onClick}>
              {icon && <span>{icon}</span>}
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function TipCard({ label = 'Consejo Técnico', text, className = '' }) {
  return (
    <div className={`${styles.tipCard} ${className}`}>
      <div className={styles.tipCard__label}>💡 {label}</div>
      <p className={styles.tipCard__text}>{text}</p>
    </div>
  )
}

export function Breadcrumb({ items, className = '' }) {
  return (
    <div className={`${styles.breadcrumb} ${className}`}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className={styles.breadcrumb__sep}>›</span>}
          {item.onClick ? (
            <button className={styles.breadcrumb__btn} onClick={item.onClick}>{item.label}</button>
          ) : (
            <span className={item.current ? styles.breadcrumb__current : ''}>{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export function Label({ text, variant = '', className = '' }) {
  return (
    <span className={`${styles.label} ${variant ? styles[`label--${variant}`] : ''} ${className}`}>
      {text}
    </span>
  )
}

export function ViewToggle({ options, active, onChange, className = '' }) {
  return (
    <div className={`${styles.viewToggle} ${className}`}>
      {options.map(opt => (
        <button
          key={opt.value}
          className={`${styles.viewToggle__btn} ${active === opt.value ? styles.viewToggle__btnActive : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default {
  CircleCenter,
  OrbitRing,
  OrbitRow,
  BrandCard,
  GamaCard,
  RefCard,
  FichaCard,
  TipCard,
  Breadcrumb,
  Label,
  ViewToggle,
}
