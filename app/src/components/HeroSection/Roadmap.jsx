import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import styles from './styles/Roadmap.module.css';

const Roadmap = () => {
  const phases = [
    {
      phase: 'Fase 1',
      title: 'Fundamentos UI',
      status: 'done',
      items: ['Routing y AppShell', 'Sidebar de navegación', 'Sistema de diseño', 'Tipografía y colores']
    },
    {
      phase: 'Fase 2',
      title: 'Catálogo Firestore',
      status: 'done',
      items: ['64.000+ referencias', 'Jerarquía por marcas', 'Sync asíncrona', 'Code splitting']
    },
    {
      phase: 'Fase 3',
      title: 'Asistente SONEX',
      status: 'done',
      items: ['Integración Claude API', 'Consultas por referencia', 'Navegación desde SONEX', 'Markdown rendering']
    },
    {
      phase: 'Fase 4',
      title: 'Herramientas Pro',
      status: 'progress',
      items: ['KPIs logísticos', 'Simulador almacén', 'Dashboard incidencias', 'Presupuestos']
    },
    {
      phase: 'Fase 5',
      title: 'Producción',
      status: 'pending',
      items: ['Responsive completo', 'Accesibilidad WCAG', 'Deploy Vercel', 'Analytics']
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } }
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
          <span className={styles.badge}>Evolución del proyecto</span>
          <h2 className={styles.title}>Roadmap</h2>
          <p className={styles.subtitle}>
            De los cimientos a la producción. Cada fase añade capacidades nuevas.
          </p>
        </motion.header>

        <motion.div
          className={styles.timeline}
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {phases.map((p, i) => (
            <motion.div key={i} className={styles.phaseCard} variants={item}>
              <div className={styles.phaseHeader}>
                <div className={styles.phaseIcon}>
                  {p.status === 'done' && <CheckCircle2 size={20} />}
                  {p.status === 'progress' && <Loader2 size={20} className={styles.spinning} />}
                  {p.status === 'pending' && <Circle size={20} />}
                </div>
                <div className={styles.phaseInfo}>
                  <span className={styles.phaseLabel}>{p.phase}</span>
                  <h3 className={styles.phaseTitle}>{p.title}</h3>
                </div>
                <span className={`${styles.statusBadge} ${styles[p.status]}`}>
                  {p.status === 'done' && 'Completado'}
                  {p.status === 'progress' && 'En progreso'}
                  {p.status === 'pending' && 'Pendiente'}
                </span>
              </div>
              <ul className={styles.itemsList}>
                {p.items.map((item, j) => (
                  <li key={j} className={styles.item}>
                    {p.status === 'done' && <CheckCircle2 size={12} />}
                    {p.status === 'progress' && <span className={styles.dot} />}
                    {p.status === 'pending' && <span className={`${styles.dot} ${styles.dotPending}`} />}
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Roadmap;
