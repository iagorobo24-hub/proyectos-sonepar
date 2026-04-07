import React from 'react'
import { Search, FileText, ArrowLeft, ExternalLink, Copy, ShoppingCart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useFichasTecnicas from '../hooks/useFichasTecnicas'
import useNavegacionFichas from '../hooks/useNavegacionFichas'
import { getGamasPorMarcaYCategoria } from '../data/catalogoSonepar'
import { MARCAS } from '../data/marcasLogos'
import TarjetaFicha from '../components/fichas/TarjetaFicha'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useToast } from '../contexts/ToastContext'
import styles from './FichasTecnicas.module.css'

/* ═══════════════════════════════════════════════════════
 * FichasTecnicas
 * Sidebar izq: Búsqueda (arriba) + Categorías (abajo)
 * Panel der: Navegación jerárquica (marcas→gamas→tipos→refs→ficha)
 * ═══════════════════════════════════════════════════════ */

export default function FichasTecnicas() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const {
    paso, categoria, marca, gama, tipo, referencia,
    categorias, marcasDisponibles, gamasDisponibles,
    tiposDisponibles, referenciasDisponibles,
    conteoPorCategoria, breadcrumb,
    seleccionarCategoria, seleccionarMarca, seleccionarGama,
    seleccionarTipo, seleccionarReferencia, volver, reiniciar,
    buscarReferenciaDirecta,
  } = useNavegacionFichas()

  const { consulta, setConsulta, resultado, error, cargando, accesosRapidos, buscar } = useFichasTecnicas()

  /* ── Acciones ── */
  const copiarReferencia = (ref) => {
    navigator.clipboard.writeText(ref)
    toast.show(`Referencia "${ref}" copiada`, 'success')
  }

  const añadirPresupuesto = (ficha) => {
    if (!ficha) return
    const params = new URLSearchParams({ producto: ficha.desc || ficha.nombre, referencia: ficha.ref })
    navigate(`/presupuestos?${params.toString()}`)
    toast.show(`${ficha.ref} añadido al presupuesto (${ficha.precio}€ con IVA)`, 'success')
  }

  const abrirPDF = (url) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  /* ── Marcas con logo ── */
  const marcasConLogo = marcasDisponibles.map(m => ({
    ...m,
    logo: MARCAS[m.nombre]?.logo || '',
  }))

  /* ═══════════════════════════════════════════════════════
   * SIDEBAR IZQUIERDO — Siempre visible
   * ═══════════════════════════════════════════════════════ */
  const renderSidebar = () => (
    <div className={styles.sidebar}>
      {/* Buscador — siempre arriba */}
      <div className={styles.sidebarSearch}>
        <Input
          value={consulta}
          onChange={e => setConsulta(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              const found = buscarReferenciaDirecta(consulta)
              if (!found) buscar()
            }
          }}
          placeholder="Buscar referencia..."
          iconLeft={<Search size={16} />}
        />
        <Button variant="primary" size="md" loading={cargando} onClick={() => {
          const found = buscarReferenciaDirecta(consulta)
          if (!found) buscar()
        }}>
          Buscar
        </Button>
      </div>

      {/* Categorías — siempre debajo */}
      <div className={styles.sidebarCats}>
        <div className={styles.sidebarLabel}>Categorías</div>
        {categorias.map(cat => (
          <button
            key={cat.id}
            className={`${styles.catBtn} ${categoria === cat.id ? styles.catBtnActive : ''}`}
            onClick={() => seleccionarCategoria(cat.id)}
          >
            <span className={styles.catIcon}>{cat.icon}</span>
            <span className={styles.catText}>{cat.label}</span>
            <span className={styles.catCount}>{conteoPorCategoria[cat.id] || 0}</span>
          </button>
        ))}
      </div>

      {/* Accesos rápidos */}
      {accesosRapidos?.length > 0 && (
        <div className={styles.sidebarQuick}>
          <div className={styles.sidebarLabel}>Frecuentes</div>
          {accesosRapidos.map(a => (
            <button key={a} className={styles.quickBtn} onClick={() => { setConsulta(a); buscar(a) }}>
              {a}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  /* ═══════════════════════════════════════════════════════
   * PANEL DERECHO — Navegación jerárquica
   * ═══════════════════════════════════════════════════════ */
  const renderPanel = () => {

    /* ── Marcas ── */
    if (paso === 'marcas') {
      return (
        <div className={styles.panel}>
          <div className={styles.panelNav}>
            <button className={styles.backBtn} onClick={volver}>
              <ArrowLeft size={16} /> Categorías
            </button>
            <span className={styles.breadcrumb}>{breadcrumb.join(' › ')}</span>
          </div>
          <h2 className={styles.panelTitle}>Elige marca</h2>
          <p className={styles.panelSub}>{categorias.find(c => c.id === categoria)?.label}</p>
          <div className={styles.brandsGrid}>
            {marcasConLogo.map(m => (
              <button key={m.nombre} className={styles.brandCard} onClick={() => seleccionarMarca(m.nombre)}>
                <div className={styles.brandLogoBox}>
                  {m.logo ? (
                    <img src={m.logo} alt={m.nombre} className={styles.brandLogo}
                      onError={e => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex' }} />
                  ) : null}
                  <div className={styles.brandFallback} style={{ display: m.logo ? 'none' : 'flex', background: m.color }}>
                    {m.nombre.substring(0, 2).toUpperCase()}
                  </div>
                </div>
                <div className={styles.brandName}>{m.nombre}</div>
                <div className={styles.brandCount}>{getGamasPorMarcaYCategoria(categoria, m.nombre).length} gamas</div>
              </button>
            ))}
          </div>
        </div>
      )
    }

    /* ── Gamas ── */
    if (paso === 'gamas') {
      return (
        <div className={styles.panel}>
          <div className={styles.panelNav}>
            <button className={styles.backBtn} onClick={volver}><ArrowLeft size={16} /> Marcas</button>
            <span className={styles.breadcrumb}>{breadcrumb.join(' › ')}</span>
          </div>
          <h2 className={styles.panelTitle}>Elige gama</h2>
          <p className={styles.panelSub}>{marca}</p>
          <div className={styles.list}>
            {gamasDisponibles.map(g => (
              <button key={g.nombre} className={styles.listItem} onClick={() => seleccionarGama(g.nombre)}>
                <span className={styles.listItemName}>{g.nombre}</span>
                <span className={styles.listItemMeta}>{g.tipos.length} tipos · {g.count} refs</span>
                <span className={styles.listItemArrow}>›</span>
              </button>
            ))}
          </div>
        </div>
      )
    }

    /* ── Tipos ─ */
    if (paso === 'tipos') {
      return (
        <div className={styles.panel}>
          <div className={styles.panelNav}>
            <button className={styles.backBtn} onClick={volver}><ArrowLeft size={16} /> Gamas</button>
            <span className={styles.breadcrumb}>{breadcrumb.join(' › ')}</span>
          </div>
          <h2 className={styles.panelTitle}>Elige tipo</h2>
          <p className={styles.panelSub}>{gama}</p>
          <div className={styles.list}>
            {tiposDisponibles.map(t => (
              <button key={t} className={styles.listItem} onClick={() => seleccionarTipo(t)}>
                <span className={styles.listItemName}>{t}</span>
                <span className={styles.listItemArrow}>›</span>
              </button>
            ))}
          </div>
        </div>
      )
    }

    /* ── Referencias ── */
    if (paso === 'referencias') {
      return (
        <div className={styles.panel}>
          <div className={styles.panelNav}>
            <button className={styles.backBtn} onClick={volver}><ArrowLeft size={16} /> Tipos</button>
            <span className={styles.breadcrumb}>{breadcrumb.join(' › ')}</span>
          </div>
          <h2 className={styles.panelTitle}>{referenciasDisponibles.length} referencias</h2>
          <p className={styles.panelSub}>{gama} — {tipo}</p>
          <div className={styles.refsList}>
            {referenciasDisponibles.map(p => (
              <button key={p.ref} className={styles.refItem} onClick={() => seleccionarReferencia(p.ref)}>
                <div className={styles.refItemTop}>
                  <span className={styles.refItemCode}>{p.ref}</span>
                  <span className={styles.refItemPrice}>{p.precio}€</span>
                </div>
                <div className={styles.refItemDesc}>{p.desc}</div>
                <div className={styles.refItemSpecs}><span>{p.potencia}</span><span>·</span><span>{p.tension}</span></div>
              </button>
            ))}
          </div>
        </div>
      )
    }

    /* ── Ficha técnica ── */
    if (paso === 'ficha' && referencia) {
      return (
        <div className={styles.panel}>
          <div className={styles.panelNav}>
            <button className={styles.backBtn} onClick={volver}><ArrowLeft size={16} /> Referencias</button>
            <span className={styles.breadcrumb}>{breadcrumb.join(' › ')}</span>
          </div>
          <div className={styles.fichaCard}>
            <div className={styles.fichaHead}>
              <div>
                <div className={styles.fichaLabel}>REFERENCIA</div>
                <div className={styles.fichaRef}>{referencia.ref}</div>
                <div className={styles.fichaDesc}>{referencia.desc}</div>
              </div>
              <div className={styles.fichaPrice}>
                <div className={styles.fichaPriceVal}>{referencia.precio}€</div>
                <div className={styles.fichaPriceLabel}>IVA incl.</div>
              </div>
            </div>
            <div className={styles.fichaSpecs}>
              {[['Marca', referencia.marca], ['Gama', referencia.gama], ['Tipo', referencia.tipo], ['Potencia', referencia.potencia], ['Tensión', referencia.tension]].map(([l, v]) => (
                <div key={l} className={styles.fichaSpec}><div className={styles.fichaSpecLabel}>{l}</div><div className={styles.fichaSpecVal}>{v}</div></div>
              ))}
            </div>
            <div className={styles.fichaActions}>
              <Button variant="primary" size="sm" onClick={() => copiarReferencia(referencia.ref)}><Copy size={14} /> Copiar referencia</Button>
              <Button variant="secondary" size="sm" onClick={() => abrirPDF(referencia.pdf_url)}><ExternalLink size={14} /> Ficha fabricante</Button>
              <Button variant="secondary" size="sm" onClick={() => añadirPresupuesto(referencia)}><ShoppingCart size={14} /> Presupuesto</Button>
            </div>
          </div>
          <div className={styles.fichaTip}>
            <div className={styles.fichaTipLabel}>💡 CONSEJO TÉCNICO</div>
            <div className={styles.fichaTipText}>
              Para {referencia.gama} de {referencia.marca} en aplicación {referencia.tipo.toLowerCase()},
              verificar compatibilidad con dispositivos auxiliares. Consultar disponibilidad en tienda.sonepar.es.
            </div>
          </div>
        </div>
      )
    }

    /* ── Búsqueda IA ── */
    if (resultado && !error) {
      return (
        <div className={styles.panel}>
          <TarjetaFicha
            resultado={resultado}
            onCopiar={r => copiarReferencia(r.referencia || r.ref)}
            onComparar={r => toast.show(`${r.referencia} enviado a comparativa`, 'success')}
            onPresupuesto={r => {
              navigate(`/presupuestos?${new URLSearchParams({ producto: r.nombre, referencia: r.referencia })}`)
              toast.show(`${r.referencia} añadido al presupuesto`, 'success')
            }}
          />
        </div>
      )
    }

    /* ── Error ── */
    if (error) {
      return (
        <div className={styles.panel}>
          <div className={styles.errorBox}>
            <div className={styles.errorTitle}>⚠ Consulta demasiado vaga</div>
            <div className={styles.errorMsg}>{error.mensaje}</div>
            {error.sugerencias?.length > 0 && (
              <div className={styles.suggWrap}>
                {error.sugerencias.map((s, i) => (
                  <Button key={i} variant="ghost" size="sm" onClick={() => { setConsulta(s); buscar(s) }}>{s}</Button>
                ))}
              </div>
            )}
          </div>
        </div>
      )
    }

    /* ── Empty state ── */
    return (
      <div className={styles.panel}>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}><FileText size={48} /></div>
          <h2 className={styles.emptyTitle}>Fichas Técnicas Sonepar</h2>
          <p className={styles.emptyText}>Selecciona una categoría del panel izquierdo o busca por referencia.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.layout}>
      {renderSidebar()}
      <div className={styles.main}>{renderPanel()}</div>
    </div>
  )
}
