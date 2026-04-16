import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FileText,
  Bot,
  BarChart3,
  Calculator,
  FileSpreadsheet,
  GraduationCap,
  BookOpen,
  ArrowUpRight
} from 'lucide-react';
import styles from './styles/ToolsShowcase.module.css';

const ToolsShowcase = () => {
  const tools = [
    {
      name: 'Fichas Técnicas',
      desc: 'Catálogo de +64.000 referencias con filtros por familia, marca y categoría.',
      icon: <FileText size={22} />,
      href: '/app/fichas',
      color: 'var(--sonepar-blue)'
    },
    {
      name: 'Asistente SONEX',
      desc: 'Consulta material eléctrico con IA. Pregúntale cualquier referencia.',
      icon: <Bot size={22} />,
      href: '/app/sonex',
      color: '#7c3aed'
    },
    {
      name: 'KPI Logístico',
      desc: 'Métricas de rendimiento, stock y análisis de almacén con gráficos.',
      icon: <BarChart3 size={22} />,
      href: '/app/kpi',
      color: '#059669'
    },
    {
      name: 'Simulador Almacén',
      desc: 'Simula y optimiza la gestión de espacio e invento de almacén.',
      icon: <Calculator size={22} />,
      href: '/app/almacen',
      color: '#dc2626'
    },
    {
      name: 'Presupuestos',
      desc: 'Generador de cotizaciones profesionales con cálculo de costes.',
      icon: <FileSpreadsheet size={22} />,
      href: '/app/presupuestos',
      color: '#d97706'
    },
    {
      name: 'Incidencias',
      desc: 'Dashboard de seguimiento y gestión de incidencias del almacén.',
      icon: <GraduationCap size={22} />,
      href: '/app/incidencias',
      color: '#0891b2'
    },
    {
      name: 'Formación Interna',
      desc: 'Base de conocimiento y recursos de aprendizaje del equipo.',
      icon: <BookOpen size={22} />,
      href: '/app/formacion',
      color: '#be185d'
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <motion.header
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className={styles.badge}>7 módulos profesionales</span>
          <h2 className={styles.title}>Herramientas integradas</h2>
          <p className={styles.subtitle}>
            Todo lo que necesitas en un solo entorno. Haz clic para explorar cada herramienta.
          </p>
        </motion.header>

        <motion.div
          className={styles.toolsGrid}
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {tools.map((tool, i) => (
            <motion.div key={i} variants={item}>
              <Link to={tool.href} className={styles.toolCard}>
                <div className={styles.toolHeader}>
                  <div className={styles.toolIcon} style={{ color: tool.color, background: `${tool.color}10` }}>
                    {tool.icon}
                  </div>
                  <ArrowUpRight size={16} className={styles.arrowIcon} />
                </div>
                <h3 className={styles.toolName}>{tool.name}</h3>
                <p className={styles.toolDesc}>{tool.desc}</p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ToolsShowcase;
