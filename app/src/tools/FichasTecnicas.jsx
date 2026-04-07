import React from 'react'
import { Search, FileText, GitCompare, ArrowLeft, ExternalLink, Copy, ShoppingCart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useFichasTecnicas from '../hooks/useFichasTecnicas'
import useNavegacionFichas from '../hooks/useNavegacionFichas'
import TarjetaFicha from '../components/fichas/TarjetaFicha'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import WelcomeState from '../components/ui/WelcomeState'
import { useToast } from '../contexts/ToastContext'
import styles from './FichasTecnicas.module.css'

/* ═══════════════════════════════════════════════════════
 * FichasTecnicas — Navegación jerárquica + Búsqueda
 * ═══════════════════════════════════════════════════════ */

export default function FichasTecnicas() {
  const navigate = useNavigate()
  const { toast } = useToast()

  /* Hook de navegación jerárquica */
  const {
    paso,
    categoria,
    marca,
    gama,
    tipo,
    referencia,
    categorias,
    marcasDisponibles,
    gamasDisponibles,
    tiposDisponibles,
    referenciasDisponibles,
    conteoPorCategoria,
    breadcrumb,
    seleccionarCategoria,
    seleccionarMarca,
    seleccionarGama,
    seleccionarTipo,
    seleccionarReferencia,
    volver,
    reiniciar,
    buscarReferenciaDirecta,
  } = useNavegacionFichas()

  /* Hook de búsqueda IA (se usa para búsqueda por texto libre) */
  const {
    consulta, setConsulta,
    resultado, setResultado,
    error,
    cargando,
    accesosRapidos,
    buscar,
  } = useFichasTecnicas()

  /* ── Modo de vista: "navegacion" o "busqueda" ── */
  const [modo, setModo] = React.useState('navegacion')

  /* ── Copiar referencia ── */
  const copiarReferencia = (ref) => {
    navigator.clipboard.writeText(ref)
    toast.show(`Referencia "${ref}" copiada`, 'success')
  }

  /* ── Añadir a presupuesto ── */
  const añadirPresupuesto = (ficha) => {
    if (!ficha) return
    const params = new URLSearchParams({
      producto: ficha.desc || ficha.nombre,
      referencia: ficha.ref,
    })
    navigate(`/presupuestos?${params.toString()}`)
    toast.show(`${ficha.ref} añadido al presupuesto (${ficha.precio}€ con IVA)`, 'success')
  }

  /* ── Abrir PDF del fabricante ── */
  const abrirPDF = (url) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  /* ── Título del paso actual ── */
  const tituloPaso = () => {
    switch (paso) {
      case 'categorias': return 'Selecciona una categoría'
      case 'marcas': return `Marcas de ${categorias.find(c => c.id === categoria)?.label}`
      case 'gamas': return `Gamas de ${marca}`
      case 'tipos': return `Tipos de ${gama}`
      case 'referencias': return `Referencias disponibles (${referenciasDisponibles.length})`
      case 'ficha': return `Ficha técnica — ${referencia?.ref}`
      default: return ''
    }
  }

  /* ═══════════════════════════════════════════════════════
   * PANEL IZQUIERDO — Navegación o Búsqueda
   * ═══════════════════════════════════════════════════════ */
  const renderPanelIzquierdo = () => (
    <div className={styles.panelBusqueda}>

      {/* ── Tabs: Navegación / Búsqueda ── */}
      <div className={styles.toolbar}>
        <button
          className={`${styles.tab} ${modo === 'navegacion' ? styles.tabActivo : ''}`}
          onClick={() => setModo('navegacion')}
        >
          Navegar
        </button>
        <button
          className={`${styles.tab} ${modo === 'busqueda' ? styles.tabActivo : ''}`}
          onClick={() => setModo('busqueda')}
        >
          Buscar
        </button>
      </div>

      {/* ── MODO NAVEGACIÓN ── */}
      {modo === 'navegacion' && (
        <>
          {/* Botón Volver */}
          {(paso !== 'categorias' && paso !== 'busqueda') && (
            <button
              className={styles.volverBtn}
              onClick={volver}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-2)', fontSize: 12,
                padding: '8px 16px', marginBottom: 8,
              }}
            >
              <ArrowLeft size={14} /> Volver
            </button>
          )}

          {/* Breadcrumb */}
          {breadcrumb.length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--color-text-2)', marginBottom: 12, padding: '0 16px' }}>
              {breadcrumb.join(' > ')}
            </div>
          )}

          {/* Título del paso */}
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', padding: '0 16px', marginBottom: 12 }}>
            {tituloPaso()}
          </div>

          {/* ── PASO: Categorías ── */}
          {paso === 'categorias' && (
            <div className={styles.seccion}>
              {categorias.map(cat => (
                <button
                  key={cat.id}
                  className={styles.categoriaBtn}
                  onClick={() => seleccionarCategoria(cat.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px', textAlign: 'left',
                    width: '100%', background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8, marginBottom: 6, cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{cat.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{cat.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-2)' }}>{conteoPorCategoria[cat.id] || 0} referencias</div>
                  </div>
                  <span style={{ fontSize: 14, color: 'var(--color-text-2)' }}>›</span>
                </button>
              ))}
            </div>
          )}

          {/* ── PASO: Marcas ── */}
          {paso === 'marcas' && (
            <div className={styles.seccion}>
              {marcasDisponibles.map(m => (
                <button
                  key={m.nombre}
                  className={styles.marcaBtn}
                  onClick={() => seleccionarMarca(m.nombre)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px', textAlign: 'left',
                    width: '100%', background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8, marginBottom: 8, cursor: 'pointer',
                  }}
                >
                  {/* Logo simulado con color de marca */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: m.color, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 800, fontSize: 14,
                    flexShrink: 0,
                  }}>
                    {m.nombre.substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{m.nombre}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-2)' }}>
                      {getGamasPorMarcaYCategoria(categoria, m.nombre).length} gamas disponibles
                    </div>
                  </div>
                  <span style={{ fontSize: 14, color: 'var(--color-text-2)' }}>›</span>
                </button>
              ))}
            </div>
          )}

          {/* ── PASO: Gamas ── */}
          {paso === 'gamas' && (
            <div className={styles.seccion}>
              {gamasDisponibles.map(g => (
                <button
                  key={g.nombre}
                  className={styles.gamaBtn}
                  onClick={() => seleccionarGama(g.nombre)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', textAlign: 'left',
                    width: '100%', background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8, marginBottom: 6, cursor: 'pointer',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{g.nombre}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-2)' }}>{g.tipos.length} tipos · {g.count} refs</div>
                  </div>
                  <span style={{ fontSize: 14, color: 'var(--color-text-2)' }}>›</span>
                </button>
              ))}
            </div>
          )}

          {/* ── PASO: Tipos ── */}
          {paso === 'tipos' && (
            <div className={styles.seccion}>
              {tiposDisponibles.map(t => (
                <button
                  key={t}
                  className={styles.tipoBtn}
                  onClick={() => seleccionarTipo(t)}
                  style={{
                    padding: '12px 16px', textAlign: 'left',
                    width: '100%', background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8, marginBottom: 6, cursor: 'pointer',
                    fontSize: 13, color: 'var(--color-text)',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {/* ── PASO: Referencias ── */}
          {paso === 'referencias' && (
            <div className={styles.seccion}>
              {referenciasDisponibles.map(p => (
                <button
                  key={p.ref}
                  className={styles.refBtn}
                  onClick={() => seleccionarReferencia(p.ref)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', textAlign: 'left',
                    width: '100%', background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8, marginBottom: 6, cursor: 'pointer',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', fontFamily: 'monospace' }}>
                      {p.ref}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-2)', marginTop: 2 }}>
                      {p.potencia} · {p.tension}
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-brand)' }}>
                    {p.precio}€
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Accesos rápidos (búsquedas frecuentes del usuario) */}
          {accesosRapidos?.length > 0 && paso === 'categorias' && (
            <div className={styles.seccion}>
              <div className={styles.seccionLabel}>Tus búsquedas frecuentes</div>
              {accesosRapidos.map(a => (
                <button
                  key={a}
                  className={styles.accesoBtn}
                  onClick={() => { setConsulta(a); setModo('busqueda'); buscar(a) }}
                >
                  {a}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── MODO BÚSQUEDA ── */}
      {modo === 'busqueda' && (
        <>
          {/* Buscador */}
          <div className={styles.buscadorWrap}>
            <Input
              value={consulta}
              onChange={e => setConsulta(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  // Primero intentar búsqueda directa por referencia
                  const found = buscarReferenciaDirecta(consulta)
                  if (!found) buscar()
                }
              }}
              placeholder="Referencia o descripción..."
              iconLeft={<Search size={16} />}
            />
            <Button
              variant="primary"
              size="md"
              loading={cargando}
              onClick={() => {
                const found = buscarReferenciaDirecta(consulta)
                if (!found) buscar()
              }}
            >
              Buscar
            </Button>
          </div>
        </>
      )}
    </div>
  )

  /* ═══════════════════════════════════════════════════════
   * PANEL DERECHO — Ficha técnica o Welcome
   * ═══════════════════════════════════════════════════════ */
  const renderPanelDerecho = () => {
    /* ── Ficha seleccionada por navegación ── */
    if (paso === 'ficha' && referencia) {
      return (
        <div>
          {/* Breadcrumb + Volver */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <button
              onClick={volver}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-2)', fontSize: 12, padding: 0,
              }}
            >
              <ArrowLeft size={14} /> Volver
            </button>
            <span style={{ fontSize: 11, color: 'var(--color-text-2)' }}>
              {breadcrumb.join(' > ')}
            </span>
          </div>

          {/* ── Header de la ficha ── */}
          <div style={{
            background: 'var(--color-surface)', borderRadius: 12,
            border: '1px solid var(--color-border)', padding: 24, marginBottom: 20,
          }}>
            {/* Referencia y marca */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--color-text-2)', letterSpacing: '1px', marginBottom: 4 }}>
                  REFERENCIA
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', fontFamily: 'monospace' }}>
                  {referencia.ref}
                </div>
                <div style={{ fontSize: 14, color: 'var(--color-text-2)', marginTop: 4 }}>
                  {referencia.desc}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-brand)' }}>
                  {referencia.precio}€
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-text-2)' }}>con IVA incluido</div>
              </div>
            </div>

            {/* Specs rápidas */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
              {[
                ['Marca', referencia.marca],
                ['Gama', referencia.gama],
                ['Tipo', referencia.tipo],
                ['Potencia', referencia.potencia],
                ['Tensión', referencia.tension],
              ].map(([label, value]) => (
                <div key={label} style={{
                  background: 'var(--color-bg)', borderRadius: 8, padding: '8px 14px',
                }}>
                  <div style={{ fontSize: 9, color: 'var(--color-text-2)', letterSpacing: '1px' }}>{label.toUpperCase()}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', marginTop: 2 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Botones de acción */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => copiarReferencia(referencia.ref)}
              >
                <Copy size={14} style={{ marginRight: 4 }} /> Copiar referencia
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => abrirPDF(referencia.pdf_url)}
              >
                <ExternalLink size={14} style={{ marginRight: 4 }} /> Ficha del fabricante
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => añadirPresupuesto(referencia)}
              >
                <ShoppingCart size={14} style={{ marginRight: 4 }} /> Presupuesto
              </Button>
            </div>
          </div>

          {/* ── Consejo técnico IA (generado al vuelo) ── */}
          <div style={{
            background: 'var(--color-surface)', borderRadius: 12,
            border: '1px solid var(--color-border)', borderLeft: '4px solid var(--color-brand)',
            padding: 20,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-brand)', letterSpacing: '1px', marginBottom: 8 }}>
              💡 CONSEJO TÉCNICO
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.7 }}>
              Para {referencia.gama} de {referencia.marca} en aplicación {referencia.tipo.toLowerCase()},
              verificar compatibilidad con los dispositivos auxiliares del cuadro.
              Consultar disponibilidad y precio actualizado en tienda.sonepar.es antes de presupuestar.
            </div>
          </div>
        </div>
      )
    }

    /* ── Resultado de búsqueda IA ── */
    if (resultado && !error) {
      return (
        <TarjetaFicha
          resultado={resultado}
          onCopiar={(res) => {
            const ref = res.referencia || res.ref
            copiarReferencia(ref)
          }}
          onComparar={(res) => {
            toast.show(`${res.referencia} enviado a comparativa`, 'success')
          }}
          onPresupuesto={(res) => {
            const params = new URLSearchParams({
              producto: res.nombre,
              referencia: res.referencia,
            })
            navigate(`/presupuestos?${params.toString()}`)
            toast.show(`${res.referencia} añadido al presupuesto`, 'success')
          }}
        />
      )
    }

    /* ── Error de búsqueda ── */
    if (error && modo === 'busqueda') {
      return (
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
      )
    }

    /* ── Estado vacío por defecto ── */
    return (
      <WelcomeState
        icon={FileText}
        title="Fichas Técnicas Sonepar"
        subtitle="Navega por categorías para encontrar el producto exacto, o busca directamente por referencia."
        chips={[]}
      />
    )
  }

  /* ═══════════════════════════════════════════════════════
   * RENDER PRINCIPAL
   * ═══════════════════════════════════════════════════════ */
  return (
    <div className={styles.layout}>
      {renderPanelIzquierdo()}
      <div className={styles.panelResultado}>
        {renderPanelDerecho()}
      </div>
    </div>
  )
}
