import React from 'react';
import { motion } from 'framer-motion';
import styles from './styles/TechStack.module.css';

const TechStack = () => {
  const technologies = [
    { name: 'React 19', color: '#61dafb' },
    { name: 'Vite 7', color: '#646cff' },
    { name: 'Firebase', color: '#ffca28' },
    { name: 'Vercel', color: '#ffffff' },
    { name: 'Claude API', color: '#a855f7' },
    { name: 'Framer Motion', color: '#f0a030' },
    { name: 'Recharts', color: '#10b981' },
    { name: 'React Router', color: '#f44236' },
    { name: 'CSS Modules', color: '#0072ce' },
    { name: 'Lucide Icons', color: '#f97316' }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.9 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } }
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
          <span className={styles.badge}>Tecnologías</span>
          <h2 className={styles.title}>Stack técnico</h2>
          <p className={styles.subtitle}>
            Construido con las mejores herramientas del ecosistema frontend.
          </p>
        </motion.header>

        <motion.div
          className={styles.techGrid}
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {technologies.map((tech, i) => (
            <motion.div key={i} className={styles.techBadge} variants={item}>
              <span className={styles.techDot} style={{ backgroundColor: tech.color }} />
              <span className={styles.techName}>{tech.name}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TechStack;
