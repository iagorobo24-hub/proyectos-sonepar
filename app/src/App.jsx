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
    nombre: "Simulador de Almacén",
    desc: "Ciclo completo de pedido con cronómetro y análisis IA",
    color: "#1a3a6a",
    acento: "#4a7ab5",
    componente: SimuladorAlmacen,
  },
  {
    id: "fichas",
    numero: "02",
    nombre: "Fichas Técnicas",
    desc: "Consulta de producto, comparativa y exportación",
    color: "#1a6040",
    acento: "#4caf82",
    componente: FichasTecnicas,
  },
  {
    id: "incidencias",
    numero: "03",
    nombre: "Dashboard Incidencias",
    desc: "Registro y diagnóstico IA de fallos en almacén",
    color: "#6a1a1a",
    acento: "#e57373",
    componente: DashboardIncidencias,
  },
  {
    id: "kpi",
    numero: "04",
    nombre: "KPIs Logísticos",
    desc: "Indicadores del turno con historial y comparativa",
    color: "#1a3a1a",
    acento: "#81c784",
    componente: KpiLogistico,
  },
  {
    id: "presupuestos",
    numero: "05",
    nombre: "Generador de Presupuestos",
    desc: "Presupuestos detallados con PDF y numeración SNP",
    color: "#4a3a1a",
    acento: "#ffb74d",
    componente: Presupuestos,
  },
  {
    id: "formacion",
    numero: "06",
    nombre: "Formación Interna",
    desc: "Tracker de progreso formativo con vista matriz",
    color: "#2a1a6a",
    acento: "#7986cb",
    componente: FormacionInterna,
  },
  {
    id: "sonex",
    numero: "07",
    nombre: "SONEX",
    desc: "Chatbot técnico especializado en material eléctrico",
    color: "#0f0f1a",
    acento: "#4a7ab5",
    componente: Sonex,
  },
];

export default function App() {
  const [activa, setActiva] = useState(null);

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
          gap: "16px",
          borderBottom: `2px solid ${herramienta.color}`,
          flexShrink: 0,
          height: "36px",
        }}>
          <button
            onClick={() => setActiva(null)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#555", fontSize: "10px", fontFamily: "'Courier New', monospace",
              letterSpacing: "2px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px",
            }}
          >
            ← SONEPAR TOOLS
          </button>
          <span style={{ color: "#2a2a3e", fontSize: "10px", fontFamily: "'Courier New', monospace" }}>·</span>
          <span style={{ color: herramienta.acento, fontSize: "10px", fontFamily: "'Courier New', monospace", letterSpacing: "2px" }}>
            {herramienta.numero} — {herramienta.nombre.toUpperCase()}
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
    <div style={{
      minHeight: "100vh",
      background: "#0a0a14",
      fontFamily: "'Georgia', serif",
      color: "#e8e0d4",
    }}>
      {/* Header */}
      <div style={{
        borderBottom: "1px solid #1a1a2e",
        padding: "48px 48px 40px",
      }}>
        <div style={{
          fontSize: "9px", letterSpacing: "5px", color: "#333",
          fontFamily: "'Courier New', monospace", marginBottom: "16px",
        }}>
          SONEPAR ESPAÑA · A CORUÑA · 2026
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "20px", flexWrap: "wrap" }}>
          <div>
            <div style={{
              fontSize: "42px", fontWeight: "700", color: "#e8e0d4",
              letterSpacing: "-1px", lineHeight: "1",
            }}>
              SONEPAR TOOLS
            </div>
            <div style={{
              fontSize: "13px", color: "#444", marginTop: "10px",
              fontFamily: "'Courier New', monospace", letterSpacing: "2px",
            }}>
              Suite de herramientas internas con IA · 7 herramientas · v2.0
            </div>
          </div>
        </div>
      </div>

      {/* Grid herramientas */}
      <div style={{
        padding: "40px 48px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "1px",
        background: "#111",
      }}>
        {HERRAMIENTAS.map(h => (
          <div
            key={h.id}
            onClick={() => setActiva(h.id)}
            style={{
              background: "#0a0a14",
              padding: "28px 28px 24px",
              cursor: "pointer",
              borderLeft: `3px solid ${h.color}`,
              transition: "background 0.15s",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "#0f0f1e";
              e.currentTarget.style.borderLeftColor = h.acento;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "#0a0a14";
              e.currentTarget.style.borderLeftColor = h.color;
            }}
          >
            {/* Número */}
            <div style={{
              fontSize: "9px", letterSpacing: "3px", color: "#2a2a3e",
              fontFamily: "'Courier New', monospace", marginBottom: "14px",
              fontWeight: "700",
            }}>
              {h.numero}
            </div>

            {/* Nombre */}
            <div style={{
              fontSize: "17px", fontWeight: "700", color: "#d4ccc4",
              marginBottom: "8px", lineHeight: "1.2",
            }}>
              {h.nombre}
            </div>

            {/* Descripción */}
            <div style={{
              fontSize: "12px", color: "#444", lineHeight: "1.6",
              marginBottom: "20px",
            }}>
              {h.desc}
            </div>

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{
                fontSize: "9px", color: h.acento, fontFamily: "'Courier New', monospace",
                letterSpacing: "1px", fontWeight: "700",
              }}>
                v2.0 · Activo
              </span>
              <span style={{
                fontSize: "12px", color: "#2a2a3e", fontFamily: "'Courier New', monospace",
              }}>
                ›
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: "24px 48px",
        borderTop: "1px solid #111",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "8px",
      }}>
        <div style={{ fontSize: "10px", color: "#222", fontFamily: "'Courier New', monospace", letterSpacing: "1px" }}>
          Iago Robo · Prácticas Sonepar A Coruña 2026 · Ciclo FP Automatización y Robótica Industrial
        </div>
        <div style={{ fontSize: "10px", color: "#222", fontFamily: "'Courier New', monospace" }}>
          Powered by Claude Sonnet · Anthropic
        </div>
      </div>
    </div>
  );
}
