import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout, Zap, ShieldCheck, Database, Cpu, BarChart3, Calculator } from 'lucide-react';
import catalogService from '../../services/catalogService';
import styles from './styles/HeroVisual.module.css';

const SCREENSHOTS = [
  { id: 'fichas', url: '/screenshots/final-design-fichas.png', label: 'fichas-tecnicas' },
  { id: 'sonex', url: '/screenshots/final-design-sonex.png', label: 'asistente-ia' },
  { id: 'kpi', url: '/screenshots/final-kpi.png', label: 'analisis-logistico' },
  { id: 'almacen', url: '/screenshots/final-almacen.png', label: 'simulador-almacen' }
];

const HeroVisual = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalRefs, setTotalRefs] = useState(null);

  useEffect(() => {
    // Precarga de imágenes para evitar flashes en blanco
    SCREENSHOTS.forEach((screenshot) => {
      const img = new Image();
      img.src = screenshot.url;
    });

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SCREENSHOTS.length);
    }, 4000);

    const fetchStats = async () => {
      const stats = await catalogService.getCatalogStats();
      if (stats.totalProducts) {
        setTotalRefs(stats.totalProducts);
      }
    };
    fetchStats();

    return () => clearInterval(timer);
  }, []);

  const formatRefs = (num) => {
    if (num === null) return 'Actualizando...';
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k+ Refs`;
    return `${num} Refs`;
  };

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
            <AnimatePresence>
              <motion.img 
                key={SCREENSHOTS[currentIndex].id}
                src={SCREENSHOTS[currentIndex].url} 
                alt="Sonepar Tools Dashboard" 
                className={styles.mockupImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />
            </AnimatePresence>

            {/* Overlay to simulate depth/interaction */}
            <div className={styles.mockupOverlay} />
          </div>
        </div>


        {/* Floating cards container - aligned in row */}
        <div className={styles.floatingCardsRow}>
          {/* Card 1: SONEX IA */}
          <motion.div 
            className={styles.floatingCard}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className={styles.cardHeader}>
              <div className={styles.iconBox} style={{ color: 'var(--sonepar-blue)', background: 'var(--blue-50)' }}>
                <Cpu size={14} />
              </div>
              <span className={styles.cardTitle}>Asistente SONEX</span>
            </div>
            <div className={styles.cardBody}>
              <span className={styles.pulseText}>Consultor de material eléctrico IA</span>
              <div className={styles.pulseIndicator}>
                <span className={styles.pulse} style={{ backgroundColor: '#10b981' }} />
                <span className={styles.pulseText} style={{ color: '#10b981', fontWeight: 'bold' }}>Online</span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Gestión Pro (Anterior Validación) */}
          <motion.div 
            className={styles.floatingCard}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <div className={styles.cardHeader}>
              <div className={styles.iconBox} style={{ color: '#00a86b', background: 'rgba(0, 168, 107, 0.1)' }}>
                <Calculator size={14} />
              </div>
              <span className={styles.cardTitle}>Gestión Pro</span>
            </div>
            <div className={styles.cardBody}>
              <span className={styles.pulseText}>Presupuestos y Simulación</span>
              <div className={styles.statusLine}>
                <span className={styles.statusValue} style={{ color: '#00a86b' }}>Módulos Activos</span>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Catálogo Firestore */}
          <motion.div 
            className={styles.floatingCard}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <div className={styles.cardHeader}>
              <div className={styles.iconBox} style={{ color: '#f0a030', background: 'rgba(240, 160, 48, 0.1)' }}>
                <Database size={14} />
              </div>
              <span className={styles.cardTitle}>Catálogo Live</span>
            </div>
            <div className={styles.cardBody}>
              <span className={styles.pulseText}>Sincronizado con Firestore</span>
              <div className={styles.statusLine}>
                <span className={styles.statusValue} style={{ color: '#f0a030' }}>{formatRefs(totalRefs)}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default HeroVisual;
