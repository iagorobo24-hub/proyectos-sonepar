import React from 'react';
import { motion, useSpring, useTransform, animate } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import styles from './styles/StatsSection.module.css';

const Counter = ({ value, suffix = "" }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const isInView = true; // For simplicity in this demo, usually use useInView

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 2,
      onUpdate: (latest) => setDisplayValue(Math.floor(latest)),
      ease: "easeOut"
    });
    return () => controls.stop();
  }, [value]);

  return <span>{displayValue}{suffix}</span>;
};

const StatsSection = () => {
  const stats = [
    { label: "Referencias", value: 1200, suffix: "+" },
    { label: "Herramientas", value: 7, suffix: "" },
    { label: "IA Integrada", value: 100, suffix: "%" },
    { label: "Simulación", value: 1, suffix: "x" }
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
