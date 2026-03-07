import { useState } from "react";
import SimuladorAlmacen from "./tools/SimuladorAlmacen";
import FichasTecnicas from "./tools/FichasTecnicas";
import DashboardIncidencias from "./tools/DashboardIncidencias";
import KpiLogistico from "./tools/KpiLogistico";
import Presupuestos from "./tools/Presupuestos";
import FormacionInterna from "./tools/FormacionInterna";
import Sonex from "./tools/Sonex";

const HERRAMIENTAS = [
  {
    id: "simulador",
    numero: "01",
    icono: "📦",
    nombre: "Simulador de Almacén",
    tagline: "Cronometra el ciclo completo de un pedido por etapas.",
    uso: "Para formación de operarios y análisis de tiempos de proceso.",
    color: "#1a3a6a",
    acento: "#4a7ab5",
    componente: SimuladorAlmacen,
  },
  {
    id: "fichas",
    numero: "02",
    icono: "🔍",
    nombre: "Fichas Técnicas",
    tagline: "Consulta ficha técnica completa de cualquier producto.",
    uso: "Para técnicos de mostrador que necesitan datos rápidos.",
    color: "#1a6040",
    acento: "#4caf82",
    componente: FichasTecnicas,
  },
  {
    id: "incidencias",
    numero: "03",
    icono: "⚠️",
    nombre: "Dashboard Incidencias",
    tagline: "Registra y diagnostica fallos en equipos del almacén.",
    uso: "Para responsables de mantenimiento y jefes de turno.",
    color: "#6a1a1a",
    acento: "#e57373",
    componente: DashboardIncidencias,
  },
  {
    id: "kpi",
    numero: "04",
    icono: "📊",
    nombre: "KPIs Logísticos",
    tagline: "Calcula los 6 indicadores clave de un turno en segundos.",
    uso: "Para responsables de logística al cierre de cada turno.",
    color: "#1a3a1a",
    acento: "#81c784",
    componente: KpiLogistico,
  },
  {
    id: "presupuestos",
    numero: "05",
    icono: "📋",
    nombre: "Generador de Presupuestos",
    tagline: "Genera presupuestos detallados con partidas y normativa.",
    uso: "Para instaladores y técnicos comerciales en visitas de obra.",
    color: "#4a3a1a",
    acento: "#ffb74d",
    componente: Presupuestos,
  },
  {
    id: "formacion",
    numero: "06",
    icono: "🎓",
    nombre: "Formación Interna",
    tagline: "Gestiona el progreso formativo de todo el equipo.",
    uso: "Para responsables de RRHH y jefes de delegación.",
    color: "#2a1a6a",
    acento: "#7986cb",
    componente: FormacionInterna,
  },
  {
    id: "sonex",
    numero: "07",
    icono: "💬",
    nombre: "SONEX",
    tagline: "Chatbot técnico especializado en material eléctrico.",
    uso: "Para cualquier persona del equipo con dudas técnicas.",
    color: "#0f1a2a",
    acento: "#4a9eff",
    componente: Sonex,
  },
];

export default function App() {
  const [activa, setActiva] = useState(null);
  const [hovered, setHovered] = useState(null);

  const herramienta = HERRAMIENTAS.find(h => h.id === activa);
  const Componente = herramienta?.componente;

  if (activa && Componente) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Barra de retorno */}
        <div style={{
          background: "#0a0a14",
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          gap: "0",
          borderBottom: `3px solid ${herramienta.acento}`,
          flexShrink: 0,
          height: "48px",
        }}>
          <button
            onClick={() => setActiva(null)}
            onMouseEnter={e => { e.currentTarget.style.background = "#1a1a2e"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#aaa"; }}
            style={{
              background: "transparent",
              border: "1px solid #2a2a3e",
              cursor: "pointer",
              color: "#aaa",
              fontSize: "11px",
              fontFamily: "'Courier New', monospace",
              letterSpacing: "1.5px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              transition: "all 0.15s",
              marginRight: "20px",
            }}
          >
            ← MENÚ PRINCIPAL
          </button>
          <div style={{ width: "1px", height: "24px", background: "#1a1a2e", marginRight: "20px" }} />
          <span style={{
            fontSize: "10px",
            color: "#333",
            fontFamily: "'Courier New', monospace",
            letterSpacing: "1px",
            marginRight: "10px",
          }}>
            {herramienta.icono}
          </span>
          <span style={{
            color: herramienta.acento,
            fontFamily: "'Courier New', monospace",
            fontSize: "11px",
            letterSpacing: "3px",
            fontWeight: "700",
          }}>
            {herramienta.nombre.toUpperCase()}
          </span>
          <span style={{
            marginLeft: "12px",
            padding: "2px 8px",
            background: "#1a1a2e",
            color: "#444",
            fontSize: "9px",
            fontFamily: "'Courier New', monospace",
            letterSpacing: "1px",
          }}>
            v2.0
          </span>
        </div>
        {/* Componente */}
        <div style={{ flex: 1 }}>
          <Componente />
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #07070f; }
        @media (max-width: 900px) {
          .tools-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .tools-grid { grid-template-columns: 1fr !important; }
          .menu-header { padding: 28px 20px 24px !important; }
          .menu-footer { padding: 16px 20px !important; flex-direction: column !important; gap: 4px !important; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#07070f", fontFamily: "'Georgia', serif", color: "#e8e0d4" }}>

        {/* Header */}
        <div className="menu-header" style={{ padding: "40px 48px 32px", borderBottom: "1px solid #111" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "10px" }}>
            <div style={{
              background: "#1a2a4a",
              padding: "6px 12px",
              fontSize: "11px",
              fontFamily: "'Courier New', monospace",
              fontWeight: "900",
              letterSpacing: "3px",
              color: "#fff",
            }}>
              SONEPAR
            </div>
            <div style={{ width: "1px", height: "20px", background: "#1a1a2e" }} />
            <div style={{ fontSize: "10px", color: "#333", fontFamily: "'Courier New', monospace", letterSpacing: "3px" }}>
              A CORUÑA · 2026
            </div>
          </div>
          <div style={{ fontSize: "36px", fontWeight: "700", color: "#e8e0d4", letterSpacing: "-0.5px", marginBottom: "8px" }}>
            Sonepar Tools
          </div>
          <div style={{ fontSize: "13px", color: "#333", fontFamily: "'Courier New', monospace", letterSpacing: "1px" }}>
            Suite de 7 herramientas internas con IA · Selecciona una herramienta para empezar
          </div>
        </div>

        {/* Grid */}
        <div
          className="tools-grid"
          style={{
            padding: "32px 48px",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
          }}
        >
          {HERRAMIENTAS.map(h => (
            <div
              key={h.id}
              onClick={() => setActiva(h.id)}
              onMouseEnter={() => setHovered(h.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: hovered === h.id ? "#0f0f1e" : "#0a0a14",
                border: `1px solid ${hovered === h.id ? h.acento + "55" : "#111"}`,
                borderLeft: `4px solid ${hovered === h.id ? h.acento : h.color}`,
                padding: "24px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: "0",
                transition: "all 0.15s",
                minHeight: "200px",
              }}
            >
              {/* Top — icono + número */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  background: h.color + "33",
                  border: `1px solid ${h.color}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                }}>
                  {h.icono}
                </div>
                <div style={{
                  fontSize: "10px",
                  color: "#222",
                  fontFamily: "'Courier New', monospace",
                  letterSpacing: "2px",
                  fontWeight: "700",
                }}>
                  {h.numero}
                </div>
              </div>

              {/* Nombre */}
              <div style={{
                fontSize: "15px",
                fontWeight: "700",
                color: hovered === h.id ? "#fff" : "#d4ccc4",
                marginBottom: "8px",
                lineHeight: "1.2",
              }}>
                {h.nombre}
              </div>

              {/* Descripción */}
              <div style={{ fontSize: "12px", color: "#555", lineHeight: "1.6", marginBottom: "4px" }}>
                {h.tagline}
              </div>
              <div style={{ fontSize: "11px", color: "#333", lineHeight: "1.5", marginBottom: "20px", fontStyle: "italic" }}>
                {h.uso}
              </div>

              {/* CTA */}
              <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{
                  fontSize: "9px",
                  color: hovered === h.id ? h.acento : "#222",
                  fontFamily: "'Courier New', monospace",
                  letterSpacing: "1px",
                  fontWeight: "700",
                  transition: "color 0.15s",
                }}>
                  v2.0 · Activo
                </span>
                <div style={{
                  padding: "5px 12px",
                  background: hovered === h.id ? h.acento : "transparent",
                  border: `1px solid ${hovered === h.id ? h.acento : "#222"}`,
                  color: hovered === h.id ? "#fff" : "#333",
                  fontSize: "10px",
                  fontFamily: "'Courier New', monospace",
                  fontWeight: "700",
                  letterSpacing: "1px",
                  transition: "all 0.15s",
                }}>
                  ABRIR →
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="menu-footer"
          style={{
            padding: "20px 48px",
            borderTop: "1px solid #111",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: "10px", color: "#1a1a2e", fontFamily: "'Courier New', monospace", letterSpacing: "1px" }}>
            Iago Robo · Prácticas Sonepar A Coruña 2026 · Ciclo FP Automatización y Robótica Industrial
          </div>
          <div style={{ fontSize: "10px", color: "#1a1a2e", fontFamily: "'Courier New', monospace" }}>
            Powered by Claude Sonnet · Anthropic
          </div>
        </div>
      </div>
    </>
  );
}
