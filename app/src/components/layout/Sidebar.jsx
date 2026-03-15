import styles from './Sidebar.module.css';

/* Sidebar — panel lateral izquierdo con información de la suite */
export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.section}>
        <p className={styles.sectionLabel}>Suite</p>
        <p className={styles.sectionItem}>7 herramientas activas</p>
        <p className={styles.sectionItem}>IA integrada</p>
      </div>
      <div className={styles.footer}>
        <p className={styles.footerText}>Sonepar España · A Coruña</p>
        <p className={styles.footerText}>PFC CFGS · 2026</p>
      </div>
    </aside>
  );
}
