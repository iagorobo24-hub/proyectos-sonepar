import React, { useEffect, useState } from 'react';
import { motion, animate } from 'framer-motion';
import catalogService from '../../services/catalogService';
import styles from './styles/StatsSection.module.css';

const Counter = ({ value, suffix = "" }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 2,
      onUpdate: (latest) => {
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
  const [stats, setStats] = useState({
    totalProducts: 64,
    totalTools: 7,
    totalFamilies: 3,
    totalBrands: 400
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await catalogService.getCatalogStats();
        if (data.totalProducts) {
          setStats({
            totalProducts: Math.round(data.totalProducts / 1000),
            totalTools: 7,
            totalFamilies: data.totalFamilies || 3,
            totalBrands: Math.round((data.totalBrands || 400) / 10) * 10
          });
        }
      } catch {
        // Fallback si Firestore no está disponible
      }
    };
    fetchStats();
  }, []);

  const statsData = [
    { label: "Referencias en Catálogo", value: stats.totalProducts, suffix: "k+" },
    { label: "Herramientas Integradas", value: stats.totalTools, suffix: "" },
    { label: "Familias Clasificadas", value: stats.totalFamilies, suffix: "" },
    { label: "Marcas Disponibles", value: stats.totalBrands, suffix: "+" }
  ];

  return (
    <motion.section
      className={styles.statsWrapper}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      {statsData.map((stat, index) => (
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
