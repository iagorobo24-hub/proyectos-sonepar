import Badge from '../ui/Badge'
import Button from '../ui/Button'
import styles from './TarjetaFicha.module.css'

/* TarjetaFicha — muestra la ficha técnica completa de un producto */
export default function TarjetaFicha({ resultado, onCopiar, onComparar }) {
  if (!resultado) return null

  return (
    <div className={styles.card}>
      {/* Cabecera */}
      <div className={styles.header}>
        <div className={styles.categoria}>{resultado.categoria?.toUpperCase()}</div>
        <div className={styles.nombre}>{resultado.nombre}</div>
        <div className={styles.meta}>
          <span className={styles.metaItem}>REF: {resultado.referencia}</span>
          <span className={styles.metaItem}>{resultado.fabricante}</span>
          {resultado.precio_orientativo && (
            <span className={styles.precio}>{resultado.precio_orientativo} (sin IVA)</span>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className={styles.acciones}>
        <Button variant="ghost" size="sm" onClick={() => onCopiar(resultado)}>
          Copiar ficha
        </Button>
        <Button variant="ghost" size="sm" onClick={() => window.print()}>
          PDF
        </Button>
        <Button variant="primary" size="sm" onClick={() => onComparar(resultado)}>
          + Comparar
        </Button>
      </div>

      {/* Stock y entrega */}
      <div className={styles.stockRow}>
        <div>
          <span className={styles.stockLabel}>Stock</span>
          <Badge variant={
            resultado.nivel_stock === 'Alto'  ? 'stock-alto'  :
            resultado.nivel_stock === 'Medio' ? 'stock-medio' : 'stock-bajo'
          }>
            {resultado.nivel_stock}
          </Badge>
        </div>
        <div>
          <span className={styles.stockLabel}>Entrega</span>
          <span className={styles.entregaValor}>{resultado.tiempo_entrega}</span>
        </div>
      </div>

      {/* Descripción */}
      <div className={styles.descripcion}>{resultado.descripcion}</div>

      {/* Grid de specs */}
      <div className={styles.specsGrid}>
        {[
          { titulo: 'Características técnicas', items: resultado.caracteristicas },
          { titulo: 'Aplicaciones',             items: resultado.aplicaciones },
          { titulo: 'Compatibilidades',         items: resultado.compatibilidades },
          { titulo: 'Normativas',               items: resultado.normas },
        ].map(({ titulo, items }) => (
          <div key={titulo} className={styles.specsSection}>
            <div className={styles.specsTitulo}>{titulo}</div>
            {(items || []).map((item, i) => (
              <div key={i} className={styles.specsItem}>
                <span className={styles.specsDash}>—</span>
                <span className={styles.specsTexto}>{item}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Consejo técnico */}
      <div className={styles.consejo}>
        <div className={styles.consejoLabel}>◈ Consejo técnico</div>
        <div className={styles.consejoTexto}>{resultado.consejo_tecnico}</div>
      </div>

      {/* Disclaimer */}
      <div className={styles.disclaimer}>
        <div className={styles.disclaimerTexto}>
          <strong>⚠ Precios y stock orientativos.</strong> Los datos de precio, disponibilidad
          y tiempo de entrega son estimaciones generadas con IA. Verificar disponibilidad
          y precios reales con Sonepar antes de presentar cualquier presupuesto al cliente.
        </div>
      </div>
    </div>
  )
}
