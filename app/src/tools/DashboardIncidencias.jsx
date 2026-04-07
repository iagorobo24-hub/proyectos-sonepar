import { useState, useEffect } from "react";
import { ShieldAlert } from 'lucide-react';
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import WelcomeState from '../components/ui/WelcomeState'
import { useToast } from '../contexts/ToastContext'
import styles from './DashboardIncidencias.module.css'

const SEVERIDADES = ["Crítica", "Alta", "Media", "Baja"];
const ESTADOS = ["Abierta", "En diagnóstico", "Resuelta", "Escalada"];
const ZONAS = ["Zona A — Recepción", "Zona B — Almacén alto", "Zona C — Picking", "Zona D — Expedición", "Zona E — Mantenimiento"];

const DEMOS = () => [
  { id: 1, equipo: "Variador ATV320 — Línea 3", zona: "Zona C — Picking", operario: "M. Fernández", sintoma: "El variador se dispara por sobrecalentamiento a los 20 minutos de arranque. Alarma F0028.", severidad: "Crítica", estado: "Abierta", fechaCreacion: Date.now() - 1800000, fechaResolucion: null, observaciones: "", diagnostico: null },
  { id: 2, equipo: "Contactor LC1D40 — Cuadro 7", zona: "Zona B — Almacén alto", operario: "A. López", sintoma: "La bobina no atrae al energizar. Se escucha un zumbido pero el contactor no cierra.", severidad: "Alta", estado: "En diagnóstico", fechaCreacion: Date.now() - 5400000, fechaResolucion: null, observaciones: "Medida tensión en bornes bobina: 218V AC. Parece correcta.", diagnostico: null },
  { id: 3, equipo: "Sensor inductivo IF5932", zona: "Zona D — Expedición", operario: "R. Martínez", sintoma: "Falso positivo intermitente. El sensor detecta presencia cuando la cinta está vacía.", severidad: "Media", estado: "Resuelta", fechaCreacion: Date.now() - 86400000, fechaResolucion: Date.now() - 43200000, observaciones: "Resuelto limpiando la cara activa con IPA.", diagnostico: { causa_probable: "Suciedad en la cara activa del sensor reduciendo la distancia de detección efectiva.", pasos_verificacion: ["Limpiar cara activa con alcohol isopropílico", "Verificar distancia de montaje (debe ser ≤ Sn/2)", "Comprobar apantallamiento eléctrico del cable"], solucion: "Limpieza de la cara activa y ajuste de la distancia de montaje a 3mm.", medidas_preventivas: ["Incluir limpieza de sensores en el mantenimiento semanal", "Revisar el tendido del cable sensor para evitar interferencias"] } },
  { id: 4, equipo: "PLC Modicon M241", zona: "Zona A — Recepción", operario: "C. González", sintoma: "Pérdida de comunicación Modbus con los drives de la línea de recepción. Error E/S en pantalla.", severidad: "Alta", estado: "Escalada", fechaCreacion: Date.now() - 10800000, fechaResolucion: null, observaciones: "", diagnostico: null },
];

const PROMPT_DIAGNOSTICO = (inc) => `Eres un técnico de mantenimiento industrial con 15 años de experiencia en automatización, PLCs, variadores, sensores y equipos de almacén logístico. Trabajas en una delegación de Sonepar España.

Incidencia reportada:
- Equipo: ${inc.equipo}
- Zona: ${inc.zona}
- Síntoma: ${inc.sintoma}
- Severidad: ${inc.severidad}

Responde ÚNICAMENTE con JSON válido sin backticks ni markdown:
{
  "causa_probable": "descripción técnica concisa de la causa más probable",
  "pasos_verificacion": ["paso 1 concreto y accionable", "paso 2", "paso 3"],
  "solucion": "solución recomendada con referencias a materiales o ajustes concretos",
  "medidas_preventivas": ["medida preventiva 1", "medida preventiva 2"]
}`;

// ── Badge severity / estado ────────────────────────────────────────────────
const SevBadge = ({ sev }) => {
  const severityClass = {
    "Crítica": styles.badgeCritica,
    "Alta": styles.badgeAlta,
    "Media": styles.badgeMedia,
    "Baja": styles.badgeBaja,
  };
  return (
    <span className={`${styles.badge} ${severityClass[sev] || styles.badgeMedia}`}>
      {sev.toUpperCase()}
    </span>
  );
};

const EstBadge = ({ est }) => {
  const estadoClass = {
    "Abierta": styles.badgeCritica,
    "En diagnóstico": styles.badgeMedia,
    "Resuelta": styles.badgeBaja,
    "Escalada": styles.badgeCritica,
  };
  return (
    <span className={`${styles.badge} ${estadoClass[est] || styles.badgeMedia}`}>
      {est.toUpperCase()}
    </span>
  );
};

function ObservacionesEditor({ initial, onSave }) {
  const [texto, setTexto] = useState(initial || "");
  const [editado, setEditado] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => { setTexto(initial || ""); setEditado(false); }, [initial]);
  
  const handleSave = () => {
    onSave(texto);
    setEditado(false);
    toast.show('Observación guardada', 'success');
  };
  
  return (
    <div>
      <textarea 
        value={texto} 
        rows={3} 
        maxLength={500}
        className={styles.textarea}
        onChange={e => { setTexto(e.target.value); setEditado(true); }}
        placeholder="Notas de seguimiento: lecturas de tensión, medidas tomadas, personas contactadas..."
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
        <span style={{ fontSize: 10, color: "var(--color-text-2)" }}>{texto.length}/500</span>
        {editado && (
          <Button 
            variant="primary" 
            size="sm" 
            onClick={handleSave}
          >
            Guardar observación
          </Button>
        )}
      </div>
    </div>
  );
}

export default function DashboardIncidencias() {
  const { toast } = useToast();
  const [incidencias, setIncidencias] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("Todas");
  const [filtroSev, setFiltroSev] = useState("Todas");
  const [seleccionada, setSeleccionada] = useState(null);
  const [modo, setModo] = useState("lista");
  const [form, setForm] = useState({ equipo: "", zona: ZONAS[0], operario: "", sintoma: "", severidad: "Media" });
  const [cargandoIA, setCargandoIA] = useState(false);
  const [ahora, setAhora] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sonepar_incidencias");
      if (saved) setIncidencias(JSON.parse(saved));
      else setIncidencias(DEMOS());
    } catch {
      setIncidencias(DEMOS());
    }
  }, []);

  const guardar = (data) => {
    setIncidencias(data);
    try { localStorage.setItem("sonepar_incidencias", JSON.stringify(data)); } catch {}
  };

  const kpis = {
    criticas: incidencias.filter(i => i.severidad === "Crítica" && i.estado !== "Resuelta").length,
    abiertas: incidencias.filter(i => i.estado === "Abierta").length,
    enDiag: incidencias.filter(i => i.estado === "En diagnóstico").length,
    resueltas: incidencias.filter(i => i.estado === "Resuelta").length,
  };

  const criticas = incidencias.filter(i => i.severidad === "Crítica" && i.estado !== "Resuelta" && (ahora - i.fechaCreacion) > 7200000);
  const filtradas = incidencias.filter(i => 
    (filtroEstado === "Todas" || i.estado === filtroEstado) &&
    (filtroSev === "Todas" || i.severidad === filtroSev)
  );

  const cambiarEstado = (id, nuevoEstado) => {
    const data = incidencias.map(i => i.id === id ? { ...i, estado: nuevoEstado, fechaResolucion: nuevoEstado === "Resuelta" ? Date.now() : i.fechaResolucion } : i);
    guardar(data);
    if (seleccionada?.id === id) setSeleccionada(data.find(i => i.id === id));
    toast.show(`Estado: ${nuevoEstado}`);
  };

  const guardarObservacion = (id, texto) => {
    const data = incidencias.map(i => i.id === id ? { ...i, observaciones: texto } : i);
    guardar(data);
    if (seleccionada?.id === id) setSeleccionada(data.find(i => i.id === id));
    toast.show("Observación guardada");
  };

  const crearIncidencia = () => {
    if (!form.equipo || !form.operario || !form.sintoma) { toast.show("⚠ Completa todos los campos"); return; }
    const nueva = { ...form, id: Date.now(), estado: "Abierta", fechaCreacion: Date.now(),
      fechaResolucion: null, observaciones: "", diagnostico: null };
    guardar([nueva, ...incidencias]);
    setForm({ equipo: "", zona: ZONAS[0], operario: "", sintoma: "", severidad: "Media" });
    setModo("lista");
    toast.show("Incidencia registrada");
  };

  const generarDiagnostico = async (inc) => {
    setCargandoIA(true);
    try {
      const res = await fetch("/api/anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          messages: [{ role: "user", content: PROMPT_DIAGNOSTICO(inc) }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(i => i.text || "").join("") || "";
      const diag = JSON.parse(text.replace(/```json|```/g, "").trim());
      const updated = incidencias.map(i => i.id === inc.id
        ? { ...i, diagnostico: diag, estado: i.estado === "Abierta" ? "En diagnóstico" : i.estado } : i);
      guardar(updated);
      setSeleccionada(updated.find(i => i.id === inc.id));
      toast.show("Diagnóstico IA generado");
    } catch { toast.show("Error al generar diagnóstico"); }
    setCargandoIA(false);
  };

  const formatTiempo = (ts) => {
    const min = Math.floor((ahora - ts) / 60000);
    if (min < 60) return `Hace ${min}m`;
    const h = Math.floor(min / 60);
    if (h < 24) return `Hace ${h}h`;
    return `Hace ${Math.floor(h / 24)}d`;
  };

  return (
    <div className={styles.layout}>
      {/* ── Panel izquierdo — lista y filtros ── */}
      <div className={styles.panelBusqueda}>
        {/* Tabs LISTA / NUEVA */}
        <div className={styles.toolbar}>
          <button
            className={`${styles.tab} ${modo === 'lista' ? styles.tabActivo : ''}`}
            onClick={() => setModo('lista')}
          >
            Lista
          </button>
          <button
            className={`${styles.tab} ${modo === 'nueva' ? styles.tabActivo : ''}`}
            onClick={() => setModo('nueva')}
          >
            Nueva
          </button>
        </div>

        {/* Alerta crítica */}
        {criticas.length > 0 && (
          <div className={styles.seccion} style={{ background: 'var(--color-surface)', borderLeft: '3px solid var(--color-brand)', margin: '12px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-brand)', marginBottom: 4 }}>⚠ CRÍTICO</div>
            <div style={{ fontSize: 11, color: 'var(--color-text)', marginBottom: 2 }}>
              {criticas.length} incidencia{criticas.length > 1 ? "s" : ""} crítica{criticas.length > 1 ? "s" : ""} sin atender +2h
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-text-2)' }}>
              {criticas.map(i => i.equipo.split("—")[0].trim()).join(" · ")}
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className={styles.seccion}>
          <div className={styles.seccionLabel}>Resumen</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "Críticas", valor: kpis.criticas },
              { label: "Abiertas", valor: kpis.abiertas },
              { label: "Diagnóstico", valor: kpis.enDiag },
              { label: "Resueltas", valor: kpis.resueltas },
            ].map(({ label, valor }) => (
              <div key={label} className={styles.card} style={{ padding: "12px" }}>
                <div style={{ fontSize: 9, color: "var(--color-text-2)", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)" }}>{valor}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filtros */}
        {modo === 'lista' && (
          <div className={styles.seccion}>
            <div className={styles.seccionLabel}>Filtros</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "var(--color-text-2)", marginBottom: 4 }}>ESTADO</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {["Todas", ...ESTADOS].map(e => (
                  <button
                    key={e}
                    className={`${filtroEstado === e ? styles.btnPrimary : styles.btnSecondary}`}
                    onClick={() => setFiltroEstado(e)}
                    style={{ padding: "4px 8px", fontSize: 9, borderRadius: 4 }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--color-text-2)", marginBottom: 4 }}>SEVERIDAD</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {["Todas", ...SEVERIDADES].map(s => (
                  <button
                    key={s}
                    className={`${filtroSev === s ? styles.btnPrimary : styles.btnSecondary}`}
                    onClick={() => setFiltroSev(s)}
                    style={{ padding: "4px 8px", fontSize: 9, borderRadius: 4 }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Formulario nueva incidencia */}
        {modo === 'nueva' && (
          <div className={styles.seccion}>
            <div className={styles.seccionLabel}>Nueva incidencia</div>
            <div style={{ marginBottom: 12 }}>
              <Input
                value={form.equipo}
                onChange={e => setForm(p => ({ ...p, equipo: e.target.value }))}
                placeholder="Equipo / Referencia"
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <Input
                value={form.operario}
                onChange={e => setForm(p => ({ ...p, operario: e.target.value }))}
                placeholder="Operario que reporta"
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <select 
                value={form.zona} 
                className={styles.textarea}
                onChange={e => setForm(p => ({ ...p, zona: e.target.value }))}
              >
                {ZONAS.map(z => <option key={z}>{z}</option>)}
              </select>
              <select 
                value={form.severidad} 
                className={styles.textarea}
                onChange={e => setForm(p => ({ ...p, severidad: e.target.value }))}
              >
                {SEVERIDADES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <textarea 
                value={form.sintoma} 
                rows={4} 
                className={styles.textarea}
                placeholder="Describe el síntoma con el máximo detalle..."
                onChange={e => setForm(p => ({ ...p, sintoma: e.target.value }))} 
              />
            </div>
            <Button variant="primary" size="md" onClick={crearIncidencia} style={{ width: "100%" }}>
              Registrar incidencia
            </Button>
          </div>
        )}

        {/* Lista de incidencias */}
        {modo === 'lista' && (
          <div className={styles.seccion} style={{ flexGrow: 1, overflow: 'auto' }}>
            {filtradas.length === 0 ? (
              <div className={styles.vacio}>
                <div className={styles.vacioDiamond}>◈</div>
                <div className={styles.vacioTexto}>Sin incidencias con estos filtros</div>
              </div>
            ) : (
              filtradas.map((inc, i) => (
                <div
                  key={inc.id}
                  className={styles.card}
                  onClick={() => { setSeleccionada(inc); setModo('detalle'); }}
                  style={{ 
                    cursor: "pointer", 
                    marginBottom: 8,
                    borderLeft: `3px solid var(--color-brand)`,
                    background: seleccionada?.id === inc.id ? 'var(--color-surface)' : 'var(--color-bg)'
                  }}
                >
                  <div className={styles.cardHeader}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <SevBadge sev={inc.severidad} />
                      <EstBadge est={inc.estado} />
                    </div>
                    <div style={{ fontSize: 10, color: "var(--color-text-2)" }}>
                      {formatTiempo(inc.fechaCreacion)}
                    </div>
                  </div>
                  <div className={styles.cardTitle}>{inc.equipo}</div>
                  <div className={styles.cardMeta} style={{ fontSize: 11, lineHeight: 1.4, marginBottom: 8 }}>
                    {inc.sintoma.slice(0, 80)}{inc.sintoma.length > 80 ? "..." : ""}
                  </div>
                  <div className={styles.cardMeta}>{inc.zona.split("—")[0].trim()}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Panel derecho — detalle ── */}
      <div className={styles.panelResultado}>
        {seleccionada && modo === 'detalle' ? (
          <div>
            {/* Header */}
            <div className={styles.cardHeader} style={{ marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 10, color: "var(--color-text-2)", letterSpacing: "1px", marginBottom: 4 }}>
                  INCIDENCIA #{seleccionada.id.toString().slice(-4)}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.3 }}>{seleccionada.equipo}</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setSeleccionada(null); setModo('lista'); }}>
                ✕
              </Button>
            </div>

            {/* Badges */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <SevBadge sev={seleccionada.severidad} />
              <EstBadge est={seleccionada.estado} />
            </div>

            {/* Info básica */}
            {[
              ["Zona", seleccionada.zona],
              ["Operario", seleccionada.operario],
              ["Registrada", formatTiempo(seleccionada.fechaCreacion)],
              seleccionada.fechaResolucion ? ["Resuelta", formatTiempo(seleccionada.fechaResolucion)] : null,
            ].filter(Boolean).map(([label, valor]) => (
              <div key={label} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: "var(--color-text-2)", letterSpacing: "1px", minWidth: 68 }}>
                  {label.toUpperCase()}
                </span>
                <span style={{ fontSize: 12, color: "var(--color-text)" }}>{valor}</span>
              </div>
            ))}

            {/* Síntoma */}
            <div className={styles.card} style={{ margin: "12px 0 16px", padding: 16, borderLeft: `3px solid var(--color-brand)` }}>
              <div style={{ fontSize: 13, color: "var(--color-text)", lineHeight: 1.6 }}>
                {seleccionada.sintoma}
              </div>
            </div>

            {/* Cambiar estado */}
            <div style={{ marginBottom: 16 }}>
              <div className={styles.seccionLabel}>CAMBIAR ESTADO</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {ESTADOS.filter(e => e !== seleccionada.estado).map(e => (
                  <Button key={e} variant="secondary" size="sm" onClick={() => cambiarEstado(seleccionada.id, e)}>
                    {e}
                  </Button>
                ))}
              </div>
            </div>

            {/* Observaciones */}
            <div style={{ marginBottom: 16 }}>
              <div className={styles.seccionLabel}>OBSERVACIONES DE SEGUIMIENTO</div>
              <ObservacionesEditor 
                initial={seleccionada.observaciones}
                onSave={(texto) => guardarObservacion(seleccionada.id, texto)} 
              />
            </div>

            {/* Diagnóstico IA */}
            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 16 }}>
              <div className={styles.seccionLabel}>DIAGNÓSTICO IA</div>
              
              {!seleccionada.diagnostico ? (
                <Button 
                  variant="primary" 
                  onClick={() => generarDiagnostico(seleccionada)} 
                  loading={cargandoIA}
                  style={{ width: "100%" }}
                >
                  {cargandoIA ? "Analizando incidencia..." : "Generar diagnóstico IA"}
                </Button>
              ) : (
                <div>
                  {[
                    { titulo: "CAUSA PROBABLE", contenido: seleccionada.diagnostico.causa_probable },
                    { titulo: "SOLUCIÓN", contenido: seleccionada.diagnostico.solucion },
                  ].map(({ titulo, contenido }) => (
                    <div key={titulo} className={styles.card} style={{ marginBottom: 12, padding: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-brand)", letterSpacing: "1px", marginBottom: 6 }}>
                        {titulo}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--color-text)", lineHeight: 1.6 }}>
                        {contenido}
                      </div>
                    </div>
                  ))}
                  {[
                    { titulo: "PASOS DE VERIFICACIÓN", items: seleccionada.diagnostico.pasos_verificacion },
                    { titulo: "MEDIDAS PREVENTIVAS", items: seleccionada.diagnostico.medidas_preventivas },
                  ].map(({ titulo, items }) => (
                    <div key={titulo} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10, color: "var(--color-text-2)", letterSpacing: "1px", marginBottom: 8 }}>{titulo}</div>
                      {items?.map((item, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
                          <span style={{ 
                            background: "var(--color-brand)", 
                            color: "#ffffff", 
                            borderRadius: "50%",
                            width: 18, 
                            height: 18, 
                            display: "flex", 
                            alignItems: "center",
                            justifyContent: "center", 
                            fontSize: 9, 
                            fontWeight: 700, 
                            flexShrink: 0 
                          }}>
                            {i + 1}
                          </span>
                          <span style={{ fontSize: 12, color: "var(--color-text)", lineHeight: 1.5 }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  <Button 
                    variant="secondary" 
                    onClick={() => generarDiagnostico(seleccionada)} 
                    loading={cargandoIA}
                    style={{ width: "100%" }}
                  >
                    {cargandoIA ? "Analizando..." : "Regenerar diagnóstico"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <WelcomeState
            icon={ShieldAlert}
            title="Dashboard Incidencias"
            subtitle="Selecciona una incidencia de la lista para ver el diagnóstico completo generado por IA."
            chips={[
              'Ver críticas primero',
              'Filtrar por zona',
              'Nueva incidencia',
            ]}
            onChipClick={() => {}}
          />
        )}
      </div>
    </div>
  );
}
