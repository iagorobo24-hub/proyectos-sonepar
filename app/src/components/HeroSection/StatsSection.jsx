import React from 'react';
import { motion, useSpring, useTransform, animate } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import styles from './styles/StatsSection.module.css';

const Counter = ({ value, suffix = "" }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 2,
      onUpdate: (latest) => {
        // Si tiene decimales, mostramos uno. Si es entero, ninguno.
        const decimals = value % 1 === 0 ? 0 : 1;
        setDisplayValue(latest.toFixed(decimals));
      },
      ease: "easeOut"
    });
    return () => controls.stop();
  }, [value]);

  return <span>{displayValue}{suffix}</span>;
};

const StatsSection = () => {
  const stats = [
    { label: "Referencias Firestore", value: 100, suffix: "k+" },
    { label: "Herramientas Pro", value: 8, suffix: "" },
    { label: "Latencia Asistente", value: 2, suffix: "s" },
    { label: "Disponibilidad Cloud", value: 99.9, suffix: "%" }
  ];

  return (
    <motion.section 
      className={styles.statsWrapper}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      {stats.map((stat, index) => (
        <div key={index} className={styles.statItem}>
          <div className={styles.statValue}>
            <Counter value={stat.value} suffix={stat.suffix} />
          </div>
          <div className={styles.statLabel}>{stat.label}</div>
        </div>
      ))}
    </motion.section>
  );
};

export default StatsSection;
