import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Construction, ArrowRight, Linkedin } from 'lucide-react';
import styles from './styles/HeroContent.module.css';

const HeroContent = () => {
  return (
    <div className={styles.content}>
      <motion.div 
        className={styles.badge}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Construction size={14} />
        <span>Proyecto en desarrollo activo</span>
      </motion.div>

      <motion.h1 
        className={styles.title}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        Suite de herramientas para técnicos del sector eléctrico
      </motion.h1>

      <motion.p 
        className={styles.subtitle}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        Plataforma académica y profesional que integra cálculo, gestión de material, 
        simulación y asistencia con IA en un solo entorno.
      </motion.p>

      <motion.div
       className={styles.contextText}
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       transition={{ duration: 0.6, delay: 0.3 }}
      >
       Desarrollado por <span style={{ color: 'var(--sonepar-blue)', fontWeight: 'bold' }}>Iago Durán</span> en CIFP Universidad Laboral
      </motion.div>
      <motion.div 
        className={styles.actions}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Link to="/app" className={styles.primaryBtn}>
          Acceder a la aplicación
          <ArrowRight size={18} style={{ marginLeft: '8px' }} />
        </Link>
        <a 
          href="https://www.linkedin.com/in/iago-dur%C3%A1n-romera-72b1a13ba/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className={styles.secondaryBtn}
        >
          <Linkedin size={18} style={{ marginRight: '8px' }} />
          Ver LinkedIn
        </a>
      </motion.div>

      <motion.p 
        className={styles.disclaimer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
      >
        * Este proyecto está en desarrollo continuo. Pueden existir cambios o nuevas funcionalidades.
      </motion.p>
    </div>
  );
};

export default HeroContent;
