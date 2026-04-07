import React from 'react'
import { Search, FileText, GitCompare } from 'lucide-react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import useFichasTecnicas from '../hooks/useFichasTecnicas'
import TarjetaFicha from '../components/fichas/TarjetaFicha'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import WelcomeState from '../components/ui/WelcomeState'
import { useToast } from '../contexts/ToastContext'
import styles from './FichasTecnicas.module.css'

/* Categorías del catálogo Sonepar */
const CATEGORIAS = ['Todas', 'Variadores', 'Contactores', 'Sensores', 'PLCs', 'Protección', 'Cables', 'Automatización']

/* Accesos rápidos — búsquedas frecuentes */
const ACCESOS_RAPIDOS = [
  'Variador ATV320 2.2kW monofásico',
  'Contactor LC1D40 bobina 220V',
  'Sensor inductivo IF5932 M12',
  'PLC Modicon M241 24E/S',
  'Guardamotor GV2ME10 4-6.3A',
  'Relé de fase RM35TF30',
]

/* FichasTecnicas — herramienta principal de búsqueda y comparativa de productos */
export default function FichasTecnicas() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  /* Leer el param ?ref= que viene de SONEX y lanzar búsqueda automática */
  React.useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) {
      setConsulta(ref)
      buscar(ref)
    }
  }, [])

  const {
    consulta, setConsulta,
    categoria, setCategoria,
    resultado, setResultado,
    error,
    cargando,
    historial,
    modo, setModo,
    comparativa,
    resultadoComp,
    cargandoComp,
    buscar,
    copiarFicha,
    añadirAComparativa,
    quitarDeComparativa,
    generarComparativa,
    resetComparativa,
    limpiarHistorial,
  } = useFichasTecnicas()

  /* Copiar ficha y mostrar toast de confirmación */
  const handleCopiar = (res) => {
    copiarFicha(res)
    toast.show('Ficha copiada al portapapeles', 'success')
  }

  /* Añadir a comparativa y mostrar toast */
  const handleComparar = (res) => {
    if (comparativa.a && comparativa.b) {
      toast.show('Ya tienes dos productos seleccionados', 'warning')
      return
    }
    añadirAComparativa(res)
    const slot = !comparativa.a ? 'A' : 'B'
    toast.show(`Producto ${slot} seleccionado`, 'success')
  }

  /* Contar productos en comparativa */
  const totalComparativa = [comparativa.a, comparativa.b].filter(Boolean).length

  return (
    <div className={styles.layout}>

      {/* ── Panel izquierdo — buscador, categorías, historial ── */}
      <div className={styles.panelBusqueda}>

        {/* Tabs BÚSQUEDA / COMPARATIVA */}
        <div className={styles.toolbar}>
          <button
            className={`${styles.tab} ${modo === 'busqueda' ? styles.tabActivo : ''}`}
            onClick={() => setModo('busqueda')}
          >
            Búsqueda
          </button>
          <button
            className={`${styles.tab} ${modo === 'comparativa' ? styles.tabActivo : ''}`}
            onClick={() => setModo('comparativa')}
          >
            Comparativa
            {totalComparativa > 0 && (
              <span className={styles.tabBadge}>{totalComparativa}</span>
            )}
          </button>
        </div>

        {/* Buscador — solo visible en modo búsqueda */}
        {modo === 'busqueda' && (
          <div className={styles.buscadorWrap}>
            <Input
              value={consulta}
              onChange={e => setConsulta(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && buscar()}
              placeholder="Referencia, nombre o descripción..."
              iconLeft={<Search size={16} />}
            />
            <Button
              variant="primary"
              size="md"
              loading={cargando}
              onClick={() => buscar()}
            >
              Buscar
            </Button>
          </div>
        )}

        {/* Categorías */}
        {modo === 'busqueda' && (
          <div className={styles.seccion}>
            <div className={styles.seccionLabel}>Categorías</div>
            {CATEGORIAS.map(c => (
              <button
                key={c}
                className={`${styles.categoriaBtn} ${categoria === c ? styles.categoriaBtnActivo : ''}`}
                onClick={() => setCategoria(c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Accesos rápidos */}
        {modo === 'busqueda' && (
          <div className={styles.seccion}>
            <div className={styles.seccionLabel}>Accesos rápidos</div>
            {ACCESOS_RAPIDOS.map(a => (
              <button
                key={a}
                className={styles.accesoBtn}
                onClick={() => { setConsulta(a); buscar(a) }}
              >
                {a}
              </button>
            ))}
          </div>
        )}

        {/* Historial */}
        {modo === 'busqueda' && historial.length > 0 && (
          <div className={styles.seccion}>
            <div className={styles.historialHeader}>
              <div className={styles.seccionLabel}>Historial ({historial.length})</div>
              <button
                style={{ fontSize: 11, color: 'var(--color-text-2)', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={limpiarHistorial}
              >
                Limpiar
              </button>
            </div>
            {historial.map((h, i) => (
              <div
                key={i}
                className={styles.historialItem}
                onClick={() => { setResultado(h.resultado); setModo('busqueda') }}
              >
                <div className={styles.historialNombre}>
                  {h.resultado?.nombre?.slice(0, 28)}...
                </div>
                <div className={styles.historialMeta}>
                  {h.ts} · {h.resultado?.referencia}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Slots de comparativa — visibles en modo comparativa */}
        {modo === 'comparativa' && (
          <div className={styles.seccion}>
            <div className={styles.seccionLabel}>Productos seleccionados</div>
            {['a', 'b'].map(slot => {
              const ficha = comparativa[slot]
              return (
                <div key={slot} style={{
                  background: ficha ? 'var(--color-bg)' : 'transparent',
                  border: `1px solid ${ficha ? 'var(--color-brand)' : 'var(--color-border)'}`,
                  borderRadius: 6,
                  padding: '10px 12px',
                  marginBottom: 8,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-brand)', letterSpacing: '1px', marginBottom: 4 }}>
                    PRODUCTO {slot.toUpperCase()}
                  </div>
                  {ficha ? (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
                        {ficha.nombre}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-2)', marginBottom: 8 }}>
                        {ficha.referencia}
                      </div>
                      <Button variant="danger" size="sm" onClick={() => quitarDeComparativa(slot)}>
                        Quitar
                      </Button>
                    </>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--color-text-2)' }}>
                      Ve a <strong>Búsqueda</strong> y pulsa <strong>+ Comparar</strong>
                    </div>
                  )}
                </div>
              )
            })}

            {comparativa.a && comparativa.b && !resultadoComp && (
              <Button
                variant="primary"
                size="md"
                loading={cargandoComp}
                onClick={generarComparativa}
                style={{ width: '100%', marginTop: 8 }}
              >
                Generar comparativa IA
              </Button>
            )}

            {resultadoComp && (
              <Button variant="ghost" size="sm" onClick={resetComparativa} style={{ marginTop: 8 }}>
                Nueva comparativa
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── Panel derecho — resultado ── */}
      <div className={styles.panelResultado}>

        {/* Modo búsqueda — error */}
        {modo === 'busqueda' && error && (
          <div className={styles.errorBox}>
            <div className={styles.errorTitulo}>⚠ Consulta demasiado vaga</div>
            <div className={styles.errorMensaje}>{error.mensaje}</div>
            {error.sugerencias?.length > 0 && (
              <>
                <div className={styles.sugerenciasLabel}>Prueba con:</div>
                <div className={styles.sugerenciasWrap}>
                  {error.sugerencias.map((s, i) => (
                    <Button key={i} variant="ghost" size="sm" onClick={() => { setConsulta(s); buscar(s) }}>
                      {s}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Modo búsqueda — resultado */}
        {modo === 'busqueda' && resultado && !error && (
          <TarjetaFicha
            resultado={resultado}
            onCopiar={handleCopiar}
            onComparar={handleComparar}
            onPresupuesto={(res) => {
              // No incluir precio en URL — se pasa solo producto y referencia
              const params = new URLSearchParams({
                producto: res.nombre,
                referencia: res.referencia,
              })
              navigate(`/presupuestos?${params.toString()}`)
              toast.show(`${res.referencia} añadido al presupuesto`, 'success')
            }}
          />
        )}

        {/* Modo búsqueda — estado vacío */}
        {modo === 'busqueda' && !resultado && !error && !cargando && (
          <WelcomeState
            icon={FileText}
            title="Fichas Técnicas"
            subtitle="Escribe una referencia o descripción del producto y la IA genera la ficha técnica completa en segundos."
            chips={[
              'Variador ATV320 2.2kW',
              'Contactor LC1D40 220V',
              'PLC M221 24E/S',
              'Guardamotor GV2ME16',
              'Buscar producto →'
            ]}
            onChipClick={(chip) => {
              if (chip === 'Buscar producto →') return
              setConsulta(chip)
              buscar(chip)
            }}
          />
        )}

        {/* Modo comparativa — resultado */}
        {modo === 'comparativa' && resultadoComp && (
          <div>
            {/* Resumen */}
            <div style={{
              background: '#ebf3fc', borderLeft: '4px solid #4a90d9',
              borderRadius: 8, padding: '14px 20px', marginBottom: 16,
              fontStyle: 'italic', fontSize: 13, color: 'var(--color-text)'
            }}>
              {resultadoComp.resumen}
            </div>

            {/* Tabla de criterios */}
            <div style={{
              background: 'var(--color-surface)', borderRadius: 8,
              border: '1px solid var(--color-border)', overflow: 'hidden', marginBottom: 16
            }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '180px 1fr 1fr',
                background: 'var(--color-shell)', padding: '10px 16px',
                fontSize: 10, letterSpacing: '1.5px'
              }}>
                <div style={{ color: '#8a9cc2' }}>CRITERIO</div>
                <div style={{ color: '#81c784' }}>A · {comparativa.a?.nombre?.slice(0, 18)}</div>
                <div style={{ color: '#ffb74d' }}>B · {comparativa.b?.nombre?.slice(0, 18)}</div>
              </div>
              {(resultadoComp.criterios || []).map((c, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '180px 1fr 1fr',
                  padding: '11px 16px', borderTop: '1px solid var(--color-border)', alignItems: 'center'
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>{c.criterio}</div>
                  <div style={{
                    padding: '6px 10px', borderRadius: 5, fontSize: 12, color: 'var(--color-text-2)',
                    background: c.ventaja === 'A' ? '#d1fae5' : 'transparent',
                    display: 'flex', gap: 6, alignItems: 'center'
                  }}>
                    {c.ventaja === 'A' && <span style={{ color: '#065f46', fontWeight: 800 }}>▶</span>}
                    {c.producto_a}
                  </div>
                  <div style={{
                    padding: '6px 10px', borderRadius: 5, fontSize: 12, color: 'var(--color-text-2)',
                    background: c.ventaja === 'B' ? '#d1fae5' : 'transparent',
                    display: 'flex', gap: 6, alignItems: 'center'
                  }}>
                    {c.ventaja === 'B' && <span style={{ color: '#065f46', fontWeight: 800 }}>▶</span>}
                    {c.producto_b}
                  </div>
                </div>
              ))}
            </div>

            {/* Recomendaciones */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                { titulo: 'Recomendación general', contenido: resultadoComp.recomendacion_general, color: 'var(--color-brand)' },
                { titulo: 'Cuándo elegir A',       contenido: resultadoComp.casos_uso_a,           color: '#1565c0' },
                { titulo: 'Cuándo elegir B',       contenido: resultadoComp.casos_uso_b,           color: '#c07010' },
              ].map(({ titulo, contenido, color }) => (
                <div key={titulo} style={{
                  background: 'var(--color-surface)', borderRadius: 8,
                  border: '1px solid var(--color-border)', borderTop: `3px solid ${color}`, padding: 16
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: '1.5px', marginBottom: 8, textTransform: 'uppercase' }}>
                    {titulo}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-2)', lineHeight: 1.6 }}>{contenido}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modo comparativa — estado vacío */}
        {modo === 'comparativa' && !resultadoComp && (
          <WelcomeState
            icon={GitCompare}
            title="Comparativa de Productos"
            subtitle="Selecciona dos productos desde el historial o busca nuevos productos para comparar sus características técnicas."
            chips={[
              'Comparar variadores',
              'Comparar contactores',
              'Comparar PLCs',
              'Buscar productos →'
            ]}
            onChipClick={(chip) => {
              if (chip === 'Buscar productos →') {
                setModo('busqueda')
                return
              }
              setConsulta(chip)
              setModo('busqueda')
              buscar(chip)
            }}
          />
        )}
      </div>
    </div>
  )
}
