import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import styles from './styles/Roadmap.module.css';

const Roadmap = () => {
  const phases = [
    {
      version: 'v1.0.0',
      title: 'Cimientos de la Suite',
      status: 'done',
      items: ['AppShell con Topbar y Sidebar', 'Router con 7 rutas protegidas', 'Sistema de diseño (variables CSS)', 'Tipografía IBM Plex Sans global']
    },
    {
      version: 'v2.0.0',
      title: 'Rediseño Completo',
      status: 'done',
      items: ['Componentes UI (Button, Badge, Input)', 'Fichas Técnicas reescrito', '6 herramientas estandarizadas', 'SONEX con IA + flujo integrado']
    },
    {
      version: 'v3.0.0',
      title: 'Auth y Producción',
      status: 'done',
      items: ['Firebase Auth (Google Sign-In)', 'Responsive con hamburguesa ARIA', '14 tests E2E con Playwright', 'Deploy en Vercel + Edge Functions']
    },
    {
      version: 'Actual',
      title: 'Migración a Firestore',
      status: 'progress',
      items: ['Catálogo 64k+ referencias reales', 'Jerarquía 4 niveles por marca', 'Code splitting (React.lazy)', 'Cache 3 niveles + Skeletons']
    },
    {
      version: 'Próximo',
      title: 'Landing y Accesibilidad',
      status: 'pending',
      items: ['Hero Section con secciones nuevas', 'WCAG 2.2 completo', 'Sync masiva Firestore completa', 'Eliminación catálogo estático']
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
                  <span className={styles.phaseLabel}>{p.version}</span>
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
