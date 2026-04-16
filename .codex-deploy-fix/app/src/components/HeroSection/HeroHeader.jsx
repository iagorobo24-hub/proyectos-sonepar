import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Linkedin, AppWindow, ChevronDown, BarChart3, Wrench, FileText, Bot, GraduationCap, Target, Cpu, FileSpreadsheet } from 'lucide-react';
import styles from './styles/HeroHeader.module.css';

const SECTION_LINKS = [
  { id: 'stats', label: 'Stats', icon: <BarChart3 size={14} /> },
  { id: 'como-funciona', label: 'Cómo Funciona', icon: <Wrench size={14} /> },
  { id: 'herramientas', label: 'Herramientas', icon: <FileText size={14} /> },
  { id: 'roadmap', label: 'Roadmap', icon: <Target size={14} /> },
  { id: 'tech-stack', label: 'Tech Stack', icon: <Cpu size={14} /> },
  { id: 'features', label: 'Features', icon: <FileSpreadsheet size={14} /> }
];

const HeroHeader = () => {
  const [sectionsOpen, setSectionsOpen] = useState(false);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 80;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
    setSectionsOpen(false);
  };

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
          {/* Secciones dropdown */}
          <div
            className={styles.sectionsWrapper}
            onMouseEnter={() => setSectionsOpen(true)}
            onMouseLeave={() => setSectionsOpen(false)}
          >
            <button className={styles.sectionsBtn} aria-expanded={sectionsOpen}>
              <span>Secciones</span>
              <ChevronDown size={14} className={`${styles.chevron} ${sectionsOpen ? styles.chevronOpen : ''}`} />
            </button>
            <AnimatePresence>
              {sectionsOpen && (
                <motion.div
                  className={styles.sectionsDropdown}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                >
                  {SECTION_LINKS.map(link => (
                    <button
                      key={link.id}
                      className={styles.dropdownItem}
                      onClick={() => scrollToSection(link.id)}
                    >
                      {link.icon}
                      <span>{link.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <a href="https://www.linkedin.com/in/iago-dur%C3%A1n-romera-72b1a13ba/" target="_blank" rel="noopener noreferrer" className={styles.navLink}>
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
