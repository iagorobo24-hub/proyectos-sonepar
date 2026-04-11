import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout, Zap, ShieldCheck, Database, Cpu } from 'lucide-react';
import styles from './styles/HeroVisual.module.css';

const SCREENSHOTS = [
  { id: 'fichas', url: '/screenshots/final-design-fichas.png', label: 'fichas-tecnicas' },
  { id: 'sonex', url: '/screenshots/final-design-sonex.png', label: 'asistente-ia' },
  { id: 'kpi', url: '/screenshots/final-kpi.png', label: 'analisis-logistico' },
  { id: 'almacen', url: '/screenshots/final-almacen.png', label: 'simulador-almacen' }
];

const HeroVisual = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SCREENSHOTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.visualContainer}>
      {/* Glow effect behind mockup */}
      <div className={styles.backgroundGlow} />

      <motion.div 
        className={styles.mockupWrapper}
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ 
          duration: 0.8, 
          delay: 0.4,
          ease: [0.16, 1, 0.3, 1] 
        }}
      >
        <div className={styles.mainMockup}>
          {/* Top Bar Decoration */}
          <div className={styles.mockupHeader}>
            <div className={styles.windowControls}>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </div>
            <div className={styles.addressBar}>sonepar-tools.app/{SCREENSHOTS[currentIndex].label}</div>
          </div>

          <div className={styles.mockupContent}>
            <AnimatePresence mode="wait">
              <motion.img 
                key={SCREENSHOTS[currentIndex].id}
                src={SCREENSHOTS[currentIndex].url} 
                alt="Sonepar Tools Dashboard" 
                className={styles.mockupImage}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.5 }}
              />
            </AnimatePresence>

            {/* Overlay to simulate depth/interaction */}
            <div className={styles.mockupOverlay} />
          </div>
        </div>


        {/* Floating cards container - aligned in row */}
        <div className={styles.floatingCardsRow}>
          <motion.div 
            className={styles.floatingCard}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className={styles.cardHeader}>
              <div className={styles.iconBox} style={{ color: 'var(--sonepar-blue)', background: 'var(--blue-50)' }}>
                <Cpu size={14} />
              </div>
              <span className={styles.cardTitle}>IA Assistant</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.pulseIndicator}>
                <span className={styles.pulse} />
                <span className={styles.pulseText}>Analizando...</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className={styles.floatingCard}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <div className={styles.cardHeader}>
              <div className={styles.iconBox} style={{ color: '#00a86b', background: 'rgba(0, 168, 107, 0.1)' }}>
                <ShieldCheck size={14} />
              </div>
              <span className={styles.cardTitle}>Validación</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.statusLine}>
                <span className={styles.statusValue}>1.2k+ Refs</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className={styles.floatingCard}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <div className={styles.cardHeader}>
              <div className={styles.iconBox} style={{ color: '#f0a030', background: 'rgba(240, 160, 48, 0.1)' }}>
                <Database size={14} />
              </div>
              <span className={styles.cardTitle}>Catálogo</span>
            </div>
            <div className={styles.dbNodes}>
              <span className={styles.dbNode} />
              <span className={styles.dbNode} />
              <span className={styles.dbNode} />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default HeroVisual;
