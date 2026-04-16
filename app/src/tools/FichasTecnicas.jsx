import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../contexts/ToastContext'
import useFichasTecnicas from '../hooks/useFichasTecnicas'
import useNavegacionFichas from '../hooks/useNavegacionFichas'
import { FULL_CATEGORY_INFO } from '../data/categoryMapping'
import { MARCAS } from '../data/marcasLogos'
import { getBrandLogo, getBrandColor, getBrandLogoData } from '../services/brandLogoService'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import {
  CircleCenter,
  OrbitRing,
  OrbitRow,
  BrandCard,
  GamaCard,
  RefCard,
  FichaCard,
  TipCard,
  Breadcrumb,
  ViewToggle
} from '../components/ui/CircleLayout'
import styles from './FichasTecnicas.module.css'

/* Componente Skeleton con atributos de accesibilidad */
const SkeletonCard = ({ type = 'brand' }) => {
  const baseStyle = {
    background: 'linear-gradient(90deg, var(--gray-100) 25%, var(--gray-50) 50%, var(--gray-100) 75%)',
    backgroundSize: '200% 100%',
    animation: `${styles.shimmer} 1.5s infinite`,
    borderRadius: '12px',
  }

  if (type === 'brand') return <div style={{ ...baseStyle, width: '120px', height: '140px' }} aria-hidden="true" />
  if (type === 'gama') return <div style={{ ...baseStyle, width: '100%', height: '60px', marginBottom: '12px' }} aria-hidden="true" />
  if (type === 'ref') return <div style={{ ...baseStyle, width: '180px', height: '100px' }} aria-hidden="true" />
  return <div style={{ ...baseStyle, width: '100%', height: '200px' }} aria-hidden="true" />
}

export default function FichasTecnicas() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const {
    paso, categoria, marca, gama, tipo, referencia,
    categorias, marcasDisponibles, gamasDisponibles,
    tiposDisponibles, referenciasDisponibles,
    conteoPorCategoria, breadcrumb, cargando: navegacionCargando,
    seleccionarCategoria, seleccionarMarca, seleccionarGama,
    seleccionarTipo, seleccionarReferencia, volver, reiniciar,
    buscarReferenciaDirecta,
  } = useNavegacionFichas()

  const {
    consulta,
    setConsulta,
    resultado,
    resultadosBusqueda,
    error,
    cargando: busquedaIACargando,
    accesosRapidos,
    buscar,
  } = useFichasTecnicas()

  const [modo, setModo] = React.useState('navegacion')
  
  const catInfo = FULL_CATEGORY_INFO[categoria] || {}
  const isCargando = navegacionCargando || busquedaIACargando

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

  const getUrlFabricante = (prod) => {
    if (!prod) return null
    // Priorizar enlaces a página de producto en el array de documentos
    const docPágina = prod.documentos?.find(d => d.nombre?.toLowerCase().includes('página') || d.nombre?.toLowerCase().includes('enlace'))
    if (docPágina?.url) return docPágina.url
    // Fallback a cualquier hoja de datos
    const docFicha = prod.documentos?.find(d => d.nombre?.toLowerCase().includes('hoja') || d.url?.includes('prysmiangroup') || d.url?.includes('generalcable'))
    if (docFicha?.url) return docFicha.url
    // Fallback final al pdfUrl antiguo
    return prod.pdf_url || prod.pdfUrl
  }

  const marcasConLogo = marcasDisponibles.map(m => {
    const logoData = getBrandLogoData(m.nombre)
    return {
      ...m,
      logo: logoData.logo || '',
      logoFallback: logoData.initials,
      logoGradient: logoData.gradient,
      color: MARCAS[m.nombre]?.color || logoData.gradient
    }
  })

  /* ── Sidebar ─ */
  const renderSidebar = () => (
    <aside className={styles.sidebar} aria-label="Categorías de productos">
      {/* Buscador compacto en sidebar */}
      <div className={styles.sidebar__search} role="search">
        <input
          id="catalog-search"
          className={styles.sidebar__searchInput}
          value={consulta}
          onChange={e => setConsulta(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              buscarReferenciaDirecta(consulta).then(found => {
                if (!found) buscar()
              })
            }
          }}
          placeholder="Buscar referencia..."
        />
        <Button
          variant="primary"
          size="sm"
          loading={isCargando}
          onClick={() => {
            buscarReferenciaDirecta(consulta).then(found => {
              if (!found) buscar()
            })
          }}
          aria-label="Ejecutar búsqueda"
          style={{ width: '100%' }}
        >
          Buscar
        </Button>
      </div>

      <div className={styles.sidebar__label} id="categories-label">Categorías</div>
      <nav aria-labelledby="categories-label">
        {categorias.map(cat => (
          <button
            key={cat.id}
            className={`${styles.sidebar__catBtn} ${categoria === cat.id ? styles.sidebar__catBtnActive : ''}`}
            onClick={() => { seleccionarCategoria(cat.id); setModo('navegacion') }}
            aria-pressed={categoria === cat.id}
            aria-label={`Ver productos de ${cat.label}`}
          >
            <div className={styles.sidebar__catBtn__icon} aria-hidden="true">{cat.icon}</div>
            <div className={styles.sidebar__catBtn__info}>
              <div className={styles.sidebar__catBtn__name}>{cat.label}</div>
              <div className={styles.sidebar__catBtn__count}>Ver marcas</div>
            </div>
          </button>
        ))}
      </nav>
      <div className={styles.sidebar__footer}>
        <p className={styles.sidebar__footerText}>Sonepar España · A Coruña</p>
        <p className={styles.sidebar__footerText}>PFC CFGS · 2026</p>
      </div>
    </aside>
  )

  /* ── Skeleton Loaders ─ */
  const renderSkeletons = () => (
    <div className={styles.circleLayout} aria-busy="true" aria-live="polite">
      <span className="visually-hidden">Cargando catálogo...</span>
      <OrbitRing size="inner" className={styles.animPulse} />
      <div className={styles.orbitRows}>
        <OrbitRow>
          <SkeletonCard type={paso === 'gamas' ? 'gama' : 'brand'} />
          <SkeletonCard type={paso === 'gamas' ? 'gama' : 'brand'} />
        </OrbitRow>
        <OrbitRow>
          <SkeletonCard type={paso === 'gamas' ? 'gama' : 'brand'} />
        </OrbitRow>
      </div>
    </div>
  )

  /* ── Main content ─ */
  const renderMain = () => {
    if (isCargando) return renderSkeletons()

    /* Resultados múltiples de búsqueda real */
    if (resultadosBusqueda && resultadosBusqueda.length > 0) {
      return (
        <div className={styles.circleLayout}>
          <div className={styles.sectionHeader}>
            <span className={`${styles.label} ${styles['label--brand']}`}>{resultadosBusqueda.length} resultados encontrados</span>
            <h2 className={styles.sectionTitle}>Selecciona un producto</h2>
          </div>
          <div className={styles.orbitRows} role="list">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', width: '100%', padding: '20px' }}>
              {resultadosBusqueda.map(p => (
                <div key={p.ref} className={styles.aiCard} style={{ cursor: 'pointer', textAlign: 'left' }} onClick={() => seleccionarReferencia(p.ref)}>
                  <div className={styles.aiCard__name} style={{ fontSize: '0.9rem', marginBottom: '8px' }}>{p.nombre}</div>
                  <div className={styles.aiCard__ref} style={{ color: 'var(--blue-600)', fontWeight: 'bold' }}>REF: {p.ref}</div>
                  <div className={styles.aiCard__specs}>
                    <span className={styles.aiCard__spec}>{p.marca}</span>
                    <span className={styles.aiCard__spec}>{p.precio}€</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    /* Estado vacío inicial */
    if (!categoria && modo === 'navegacion') {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyState__icon} aria-hidden="true">📋</div>
          <h2 className={styles.emptyState__title}>Fichas Técnicas</h2>
          <p className={styles.emptyState__desc}>
            Selecciona una categoría del panel izquierdo o busca por referencia para navegar por el catálogo.
          </p>
        </div>
      )
    }

    /* Marcas */
    if (paso === 'marcas') {
      return (
        <div className={styles.circleLayout}>
          <OrbitRing size="inner" className={styles.animPulse} aria-hidden="true" />
          <OrbitRing size="outer" className={styles.animPulse} aria-hidden="true" />

          <CircleCenter
            icon={catInfo.icon}
            title={categorias.find(c => c.id === categoria)?.label}
            desc={catInfo.desc}
            tip={catInfo.tip}
          />

          <div className={styles.orbitRows} role="list" aria-label="Marcas disponibles">
            <OrbitRow>
              {marcasConLogo.slice(0, 2).map(m => (
                <div key={m.nombre} role="listitem">
                  <BrandCard
                    logo={m.logo}
                    logoFallback={m.logoFallback}
                    logoGradient={m.logoGradient}
                    name={m.nombre}
                    count="Ver gamas"
                    onClick={() => seleccionarMarca(m.nombre)}
                  />
                </div>
              ))}
            </OrbitRow>
            {marcasConLogo.length > 2 && (
              <OrbitRow>
                {marcasConLogo.slice(2, 5).map(m => (
                  <div key={m.nombre} role="listitem">
                    <BrandCard
                      logo={m.logo}
                      logoFallback={m.logoFallback}
                      logoGradient={m.logoGradient}
                      name={m.nombre}
                      count="Ver gamas"
                      onClick={() => seleccionarMarca(m.nombre)}
                    />
                  </div>
                ))}
              </OrbitRow>
            )}
            {marcasConLogo.length === 0 && (
               <OrbitRow>
                 <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>No hay marcas disponibles.</p>
               </OrbitRow>
            )}
          </div>
        </div>
      )
    }

    /* Gamas */
    if (paso === 'gamas') {
      return (
        <div className={styles.circleLayout}>
          <CircleCenter
            icon={catInfo.icon}
            title="Elige gama"
            desc={marca}
          />

          <div className={styles.orbitRows} role="list" aria-label={`Gamas de ${marca}`}>
            {gamasDisponibles.length > 0 ? (
              gamasDisponibles.map((gName, i) => (
                <OrbitRow key={gName} role="listitem">
                  <GamaCard
                    name={gName}
                    meta="Ver productos"
                    onClick={() => seleccionarGama(gName)}
                  />
                </OrbitRow>
              ))
            ) : (
              <OrbitRow>
                <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>No hay gamas disponibles.</p>
              </OrbitRow>
            )}
          </div>
        </div>
      )
    }

    /* Tipos */
    if (paso === 'tipos') {
      return (
        <div className={styles.circleLayout}>
          <CircleCenter
            icon={catInfo.icon}
            title="Elige tipo"
            desc={`${gama} — ${marca}`}
          />

          <div className={styles.orbitRows} role="list" aria-label="Tipos de productos">
            {tiposDisponibles.map(t => (
              <OrbitRow key={t} role="listitem">
                <button
                  className={styles.tipoCard}
                  onClick={() => seleccionarTipo(t)}
                  aria-label={`Seleccionar tipo ${t}`}
                >
                  <span className={styles.tipoCard__name}>{t}</span>
                  <span className={styles.tipoCard__arrow} aria-hidden="true">›</span>
                </button>
              </OrbitRow>
            ))}
          </div>
        </div>
      )
    }

    /* Referencias */
    if (paso === 'referencias') {
      return (
        <div className={styles.circleLayout}>
          <div className={styles.sectionHeader} role="status">
            <span className={`${styles.label} ${styles['label--brand']}`}>{referenciasDisponibles.length} referencias</span>
            <h2 className={styles.sectionTitle}>{gama} — {tipo}</h2>
          </div>

          <div className={styles.orbitRows} role="list" aria-label="Listado de referencias">
            {referenciasDisponibles.length > 0 ? (
              <>
                <OrbitRow>
                  {referenciasDisponibles.slice(0, 2).map(p => (
                    <div key={p.ref} role="listitem">
                      <RefCard
                        code={p.ref}
                        desc={p.desc}
                        price={p.precio}
                        onClick={() => seleccionarReferencia(p.ref)}
                      />
                    </div>
                  ))}
                </OrbitRow>
                {referenciasDisponibles.length > 2 && (
                  <OrbitRow>
                    {referenciasDisponibles.slice(2, 6).map(p => (
                      <div key={p.ref} role="listitem">
                        <RefCard
                          code={p.ref}
                          desc={p.desc}
                          price={p.precio}
                          onClick={() => seleccionarReferencia(p.ref)}
                        />
                      </div>
                    ))}
                  </OrbitRow>
                )}
              </>
            ) : (
              <OrbitRow>
                <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>No hay referencias.</p>
              </OrbitRow>
            )}
          </div>
        </div>
      )
    }

    /* Ficha */
    if (paso === 'ficha' && referencia) {
      return (
        <div className={styles.circleLayout}>
          <article className={styles.fichaSection} aria-label={`Detalles de ${referencia.desc}`}>
            <FichaCard
              refCode={referencia.ref}
              desc={referencia.desc}
              price={referencia.precio}
              specs={[
                ['Marca', referencia.marca],
                ['Familia', referencia.familia],
                ['Gama', referencia.gama],
                ['Tipo', referencia.tipo],
              ]}
              actions={[
                { label: 'Copiar referencia', variant: 'primary', onClick: () => copiarReferencia(referencia.ref) },
                { label: 'Ficha fabricante', variant: 'secondary', onClick: () => abrirPDF(getUrlFabricante(referencia)) },
                { label: 'Presupuesto', variant: 'secondary', onClick: () => añadirPresupuesto(referencia) },
              ]}
            />
            <TipCard text={`Producto: ${referencia.desc}. Marca: ${referencia.marca}. Verificado por Sonepar Tools.`} />
          </article>
        </div>
      )
    }

    /* Resultado Búsqueda */
    if (resultado && !error) {
      return (
        <div className={styles.circleLayout}>
          <div className={styles.aiResult} role="status" aria-live="polite">
            <h2 className={styles.sectionTitle}>Resultado Búsqueda</h2>
            <div className={styles.aiCard}>
              <div className={styles.aiCard__name}>{resultado.desc || resultado.nombre}</div>
              <div className={styles.aiCard__ref}>{resultado.ref || resultado.referencia}</div>
              <div className={styles.aiCard__desc}>{resultado.desc || resultado.descripcion}</div>
              {resultado.marca && (
                <div className={styles.aiCard__specs}>
                   <span className={styles.aiCard__spec}>{resultado.marca}</span>
                   <span className={styles.aiCard__spec}>{resultado.familia}</span>
                </div>
              )}
            </div>
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
               <Button 
                 variant="primary" 
                 size="sm" 
                 onClick={() => seleccionarReferencia(resultado.ref || resultado.referencia)}
                 aria-label="Ver detalles completos del producto"
               >
                  Ver Ficha Completa
               </Button>
            </div>
          </div>
        </div>
      )
    }

    /* Error */
    if (error) {
      return (
        <div className={styles.circleLayout}>
          <div className={styles.errorBox} role="alert">
            <div className={styles.errorBox__title}>⚠ Sin resultados</div>
            <div className={styles.errorBox__msg}>{error.mensaje}</div>
            {error.sugerencias?.length > 0 && (
              <div className={styles.suggWrap}>
                {error.sugerencias.map((s, i) => (
                  <Button 
                    key={i} 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setConsulta(s); buscar(s) }}
                    aria-label={`Buscar sugerencia: ${s}`}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className={styles.layout}>
      {renderSidebar()}
      <main className={styles.main} id="main-content">
        <div className={styles.main__content}>

          {/* Breadcrumb con navegación semántica */}
          {breadcrumb.length > 0 && (
            <nav aria-label="Breadcrumb">
              <Breadcrumb
                items={[
                  ...breadcrumb.map((label, i) => ({
                    label,
                    onClick: i < breadcrumb.length - 1 ? volver : undefined,
                    current: i === breadcrumb.length - 1,
                  })),
                ]}
              />
            </nav>
          )}

          {/* Header */}
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>
              <span aria-hidden="true">{categoria ? (catInfo.icon || '') : ''}</span>
              {' '}
              {categoria ? categorias.find(c => c.id === categoria)?.label : 'Fichas Técnicas'}
            </h1>
            {categoria && (
              <ViewToggle
                options={[{ label: 'Navegar', value: 'navegacion' }, { label: 'Buscar', value: 'busqueda' }]}
                active={modo}
                onChange={setModo}
              />
            )}
          </div>

          {/* Main content */}
          <section aria-live="polite">
            {renderMain()}
          </section>

          {/* Back button */}
          {(paso !== 'categorias' && paso !== 'busqueda' && categoria) && (
            <div className={styles.backWrap}>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={volver}
                aria-label="Volver al paso anterior"
              >
                ← Volver
              </Button>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
