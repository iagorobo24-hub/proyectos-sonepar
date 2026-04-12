import React from 'react';
import { Github, Linkedin, ExternalLink } from 'lucide-react';
import styles from './styles/SimpleFooter.module.css';

const SimpleFooter = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.left}>
          <span className={styles.brand}>Sonepar</span>
          <span className={styles.brand}>Tools</span>
        </div>

        <div className={styles.center}>
          <p className={styles.text}>
            Desarrollado por <strong>Iago Durán</strong> · 2026 · CIFP Universidad Laboral
          </p>
          <p className={styles.stack}>
            React · Vite · Firebase · Vercel · Claude API
          </p>
        </div>

        <div className={styles.right}>
          <a
            href="https://github.com/iagorobo24-hub/proyectos-sonepar"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialLink}
            aria-label="GitHub del proyecto"
          >
            <Github size={18} />
            <span>GitHub</span>
          </a>
          <a
            href="https://www.linkedin.com/in/iago-dur%C3%A1n-romera-72b1a13ba/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialLink}
            aria-label="LinkedIn de Iago Durán"
          >
            <Linkedin size={18} />
            <span>LinkedIn</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default SimpleFooter;
