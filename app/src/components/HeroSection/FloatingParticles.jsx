import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import styles from './styles/FloatingParticles.module.css';

const FloatingParticles = () => {
  // Generar partículas con posiciones aleatorias (memoizado para no regenerar en re-renders)
  const particles = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 8 + Math.random() * 12,
      size: 2 + Math.random() * 4,
      opacity: 0.1 + Math.random() * 0.3
    }));
  }, []);

  return (
    <div className={styles.particlesContainer} aria-hidden="true">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className={styles.particle}
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity
          }}
          animate={{
            y: [-20, -120, -20],
            x: [0, Math.random() > 0.5 ? 30 : -30, 0],
            opacity: [0, p.opacity, 0]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
};

export default FloatingParticles;
