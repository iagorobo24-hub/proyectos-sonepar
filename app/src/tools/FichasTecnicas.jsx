import React from 'react'
import { useNavigate } from 'react-router-dom'
import useFichasTecnicas from '../hooks/useFichasTecnicas'
import useNavegacionFichas from '../hooks/useNavegacionFichas'
import { getGamasPorMarcaYCategoria } from '../data/catalogoSonepar'
import { MARCAS } from '../data/marcasLogos'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { useToast } from '../contexts/ToastContext'
import {
  CircleCenter, OrbitRing, OrbitRow, BrandCard, GamaCard, RefCard,
  FichaCard, TipCard, Breadcrumb, Label, ViewToggle
} from '../components/ui/CircleLayout'
import styles from './FichasTecnicas.module.css'

/* Info de cada categoría */
const CATEGORY_INFO = {
  Variadores: { icon: '⚡', desc: 'Controla la velocidad de motores eléctricos de forma eficiente. Reduce consumo energético y desgaste mecánico.', tip: 'Selecciona según la potencia del motor y el tipo de alimentación disponible.' },
  Contactores: { icon: '🔌', desc: 'Dispositivos electromagnéticos para controlar motores y cargas eléctricas.', tip: 'Elige según la corriente nominal del motor y la tensión de la bobina.' },
  Guardamotores: { icon: '🛡️', desc: 'Protección térmica y magnética integrada para motores trifásicos.', tip: 'Ajusta el rango de corriente al valor nominal del motor.' },
  PLCs: { icon: '📊', desc: 'Autómatas programables para control de procesos industriales.', tip: 'Considera el número de E/S necesarias y si necesitas comunicación Ethernet.' },
  Sensores: { icon: '📡', desc: 'Detección de presencia, distancia y posición en entornos industriales.', tip: 'Elige el tipo según el material a detectar y la distancia necesaria.' },
  Protección: { icon: '⚙️', desc: 'Magnetotérmicos, diferenciales y dispositivos de protección eléctrica.', tip: 'Verifica la capacidad de corte y la curva de disparo necesaria.' },
  Iluminación: { icon: '💡', desc: 'Luminarias LED industriales, estancas y de emergencia.', tip: 'Selecciona según el nivel de iluminación (lux) requerido en la zona.' },
  VE: { icon: '🚗', desc: 'Cargadores para vehículos eléctricos domésticos e industriales.', tip: 'Verifica la potencia disponible en la instalación eléctrica.' },
  Solar: { icon: '☀️', desc: 'Inversores, baterías y reguladores para instalaciones fotovoltaicas.', tip: 'Dimensiona según el consumo diario y la superficie de paneles disponible.' },
  Reles: { icon: '🔄', desc: 'Relés de control, fase y tensión para supervisión eléctrica.', tip: 'Selecciona según el tipo de fallo a detectar.' },
}

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

  const [modo, setModo] = React.useState('navegacion')
  const catInfo = CATEGORY_INFO[categoria] || {}

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

  const marcasConLogo = marcasDisponibles.map(m => ({
    ...m,
    logo: MARCAS[m.nombre]?.logo || '',
  }))

  /* ── Sidebar ─ */
  const renderSidebar = () => (
    <aside className={styles.sidebar}>
      <div className={styles.sidebar__label}>Categorías</div>
      {categorias.map(cat => (
        <button
          key={cat.id}
          className={`${styles.sidebar__catBtn} ${categoria === cat.id ? styles.sidebar__catBtnActive : ''}`}
          onClick={() => { seleccionarCategoria(cat.id); setModo('navegacion') }}
        >
          <div className={styles.sidebar__catBtn__icon}>{cat.icon}</div>
          <div className={styles.sidebar__catBtn__info}>
            <div className={styles.sidebar__catBtn__name}>{cat.label}</div>
            <div className={styles.sidebar__catBtn__count}>{conteoPorCategoria[cat.id] || 0} refs</div>
          </div>
        </button>
      ))}
      <div className={styles.sidebar__footer}>
        <p className={styles.sidebar__footerText}>Sonepar España · A Coruña</p>
        <p className={styles.sidebar__footerText}>PFC CFGS · 2026</p>
      </div>
    </aside>
  )

  /* ── Main content ─ */
  const renderMain = () => {
    /* Estado vacío inicial */
    if (!categoria && modo === 'navegacion') {
      return (
        <div className={styles.circleLayout}>
          <CircleCenter
            icon="📋"
            title="Fichas Técnicas"
            desc="Busca por referencia o selecciona una categoría del panel izquierdo para navegar por el catálogo."
          />
          <OrbitRing size="outer" className={styles.animPulse} />
        </div>
      )
    }

    /* Marcas */
    if (paso === 'marcas') {
      return (
        <div className={styles.circleLayout}>
          <OrbitRing size="inner" className={styles.animPulse} />
          <OrbitRing size="outer" className={styles.animPulse} />

          <CircleCenter
            icon={catInfo.icon}
            title={categorias.find(c => c.id === categoria)?.label}
            desc={catInfo.desc}
            tip={catInfo.tip}
          />

          <div className={styles.orbitRows}>
            <OrbitRow>
              {marcasConLogo.slice(0, 2).map(m => (
                <BrandCard
                  key={m.nombre}
                  logo={m.logo}
                  logoFallback={m.nombre.substring(0, 2).toUpperCase()}
                  logoColor={m.color}
                  name={m.nombre}
                  count={`${getGamasPorMarcaYCategoria(categoria, m.nombre).length} gamas`}
                  onClick={() => seleccionarMarca(m.nombre)}
                />
              ))}
            </OrbitRow>
            {marcasConLogo.length > 2 && (
              <OrbitRow>
                <BrandCard
                  logo={marcasConLogo[2].logo}
                  logoFallback={marcasConLogo[2].nombre.substring(0, 2).toUpperCase()}
                  logoColor={marcasConLogo[2].color}
                  name={marcasConLogo[2].nombre}
                  count={`${getGamasPorMarcaYCategoria(categoria, marcasConLogo[2].nombre).length} gamas`}
                  onClick={() => seleccionarMarca(marcasConLogo[2].nombre)}
                />
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

          <div className={styles.orbitRows}>
            {gamasDisponibles.map((g, i) => (
              <OrbitRow key={g.nombre}>
                <GamaCard
                  name={g.nombre}
                  meta={`${g.tipos.length} tipos · ${g.count} referencias`}
                  onClick={() => seleccionarGama(g.nombre)}
                />
              </OrbitRow>
            ))}
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

          <div className={styles.orbitRows}>
            {tiposDisponibles.map(t => (
              <OrbitRow key={t}>
                <button
                  className={styles.tipoCard}
                  onClick={() => seleccionarTipo(t)}
                >
                  <span className={styles.tipoCard__name}>{t}</span>
                  <span className={styles.tipoCard__arrow}>›</span>
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
          <div className={styles.sectionHeader}>
            <span className={`${styles.label} ${styles['label--brand']}`}>{referenciasDisponibles.length} referencias</span>
            <h2 className={styles.sectionTitle}>{gama} — {tipo}</h2>
          </div>

          <div className={styles.orbitRows}>
            {referenciasDisponibles.slice(0, 2).length > 0 && (
              <OrbitRow>
                {referenciasDisponibles.slice(0, 2).map(p => (
                  <RefCard
                    key={p.ref}
                    code={p.ref}
                    desc={`${p.potencia} · ${p.tension}`}
                    price={p.precio}
                    onClick={() => seleccionarReferencia(p.ref)}
                  />
                ))}
              </OrbitRow>
            )}
            {referenciasDisponibles.length > 2 && (
              <OrbitRow>
                {referenciasDisponibles.slice(2).map(p => (
                  <RefCard
                    key={p.ref}
                    code={p.ref}
                    desc={`${p.potencia} · ${p.tension}`}
                    price={p.precio}
                    onClick={() => seleccionarReferencia(p.ref)}
                  />
                ))}
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
          <div className={styles.fichaSection}>
            <FichaCard
              ref={referencia.ref}
              desc={referencia.desc}
              price={referencia.precio}
              specs={[
                ['Marca', referencia.marca],
                ['Gama', referencia.gama],
                ['Tipo', referencia.tipo],
                ['Potencia', referencia.potencia],
                ['Tensión', referencia.tension],
              ]}
              actions={[
                { label: 'Copiar referencia', variant: 'primary', onClick: () => copiarReferencia(referencia.ref) },
                { label: 'Ficha fabricante', variant: 'secondary', onClick: () => abrirPDF(referencia.pdf_url) },
                { label: 'Presupuesto', variant: 'secondary', onClick: () => añadirPresupuesto(referencia) },
              ]}
            />
            <TipCard text={`Para ${referencia.gama} de ${referencia.marca} en aplicación ${referencia.tipo.toLowerCase()}, verificar compatibilidad con dispositivos auxiliares. Consultar disponibilidad en tienda.sonepar.es.`} />
          </div>
        </div>
      )
    }

    /* Búsqueda IA */
    if (resultado && !error) {
      return (
        <div className={styles.circleLayout}>
          <div className={styles.aiResult}>
            <h2 className={styles.sectionTitle}>Resultado IA</h2>
            <div className={styles.aiCard}>
              <div className={styles.aiCard__name}>{resultado.nombre}</div>
              <div className={styles.aiCard__ref}>{resultado.referencia}</div>
              <div className={styles.aiCard__desc}>{resultado.descripcion}</div>
              {resultado.caracteristicas && (
                <div className={styles.aiCard__specs}>
                  {resultado.caracteristicas.map((c, i) => (
                    <span key={i} className={styles.aiCard__spec}>{c}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    /* Error */
    if (error) {
      return (
        <div className={styles.circleLayout}>
          <div className={styles.errorBox}>
            <div className={styles.errorBox__title}>⚠ Consulta demasiado vaga</div>
            <div className={styles.errorBox__msg}>{error.mensaje}</div>
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

    return null
  }

  return (
    <div className={styles.layout}>
      {renderSidebar()}
      <main className={styles.main}>
        <div className={styles.main__content}>

          {/* Breadcrumb */}
          {breadcrumb.length > 0 && (
            <Breadcrumb
              items={[
                ...breadcrumb.map((label, i) => ({
                  label,
                  onClick: i < breadcrumb.length - 1 ? volver : undefined,
                  current: i === breadcrumb.length - 1,
                })),
              ]}
            />
          )}

          {/* Header */}
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>
              {categoria ? (CATEGORY_INFO[categoria]?.icon || '') + ' ' : ''}
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

          {/* Search bar */}
          <div className={styles.searchBar}>
            <Input
              value={consulta}
              onChange={e => setConsulta(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const found = buscarReferenciaDirecta(consulta)
                  if (!found) buscar()
                }
              }}
              placeholder="Buscar referencia o descripción..."
            />
            <Button variant="primary" size="md" loading={cargando} onClick={() => {
              const found = buscarReferenciaDirecta(consulta)
              if (!found) buscar()
            }}>
              Buscar
            </Button>
          </div>

          {/* Accesos rápidos */}
          {accesosRapidos?.length > 0 && (
            <div className={styles.quickAccess}>
              <div className={styles.quickAccess__label}>Búsquedas frecuentes</div>
              <div className={styles.quickAccess__wrap}>
                {accesosRapidos.map(a => (
                  <button key={a} className={styles.quickAccess__btn} onClick={() => { setConsulta(a); buscar(a) }}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main content */}
          {renderMain()}

          {/* Back button */}
          {(paso !== 'categorias' && paso !== 'busqueda' && categoria) && (
            <div className={styles.backWrap}>
              <Button variant="ghost" size="sm" onClick={volver}>
                ← Volver
              </Button>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
