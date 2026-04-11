import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Linkedin, AppWindow } from 'lucide-react';
import styles from './HeroHeader.module.css';

const HeroHeader = () => {
  return (
    <motion.header 
      className={styles.header}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className={styles.container}>
        <div className={styles.logo}>
          <span className={styles.logoBrand}>Sonepar</span>
          <span className={styles.logoProduct}>Tools</span>
        </div>
        
        <nav className={styles.nav}>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className={styles.navLink}>
            <Linkedin size={18} />
            <span>LinkedIn</span>
          </a>
          <Link to="/app" className={styles.appBtn}>
            <AppWindow size={18} />
            <span>Abrir App</span>
          </Link>
        </nav>
      </div>
    </motion.header>
  );
};

export default HeroHeader;
