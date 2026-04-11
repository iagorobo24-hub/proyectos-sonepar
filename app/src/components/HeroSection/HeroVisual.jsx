import React from 'react';
import { motion } from 'framer-motion';
import { Layout, Zap, ShieldCheck, Database, Cpu } from 'lucide-react';
import styles from './styles/HeroVisual.module.css';

const HeroVisual = () => {
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
            <div className={styles.addressBar}>sonepar-tools.app/dashboard</div>
          </div>
          
          <div className={styles.mockupContent}>
            <img 
              src="/screenshots/final-design-fichas.png" 
              alt="Sonepar Tools Dashboard" 
              className={styles.mockupImage}
            />
            
            {/* Overlay to simulate depth/interaction */}
            <div className={styles.mockupOverlay} />
          </div>
        </div>

        {/* Floating cards with richer content */}
        <motion.div 
          className={`${styles.floatingCard} ${styles.card1}`}
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
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
              <span className={styles.pulseText}>Analizando material...</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className={`${styles.floatingCard} ${styles.card2}`}
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <div className={styles.cardHeader}>
            <div className={styles.iconBox} style={{ color: '#00a86b', background: 'rgba(0, 168, 107, 0.1)' }}>
              <ShieldCheck size={14} />
            </div>
            <span className={styles.cardTitle}>Validación</span>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.statusLine}>
              <span className={styles.statusLabel}>Referencias</span>
              <span className={styles.statusValue}>1.2k+</span>
            </div>
            <div className={styles.progressBar}>
              <motion.div 
                className={styles.progressFill}
                initial={{ width: 0 }}
                animate={{ width: '85%' }}
                transition={{ duration: 2, delay: 1.5 }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div 
          className={`${styles.floatingCard} ${styles.card3}`}
          animate={{ x: [0, 8, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
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
      </motion.div>
    </div>
  );
};

export default HeroVisual;
