import React from 'react';
import { motion } from 'framer-motion';
import styles from './styles/AnimatedBackground.module.css';

const AnimatedBackground = () => {
  return (
    <div className={styles.background}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="circuit-pattern" width="200" height="200" patternUnits="userSpaceOnUse">
            <path
              d="M 10 10 L 190 10 L 190 190 L 10 190 Z"
              fill="none"
              stroke="var(--sonepar-blue)"
              strokeWidth="1"
              opacity="0.18"
            />
            <circle cx="10" cy="10" r="2.5" fill="var(--sonepar-blue)" opacity="0.3" />
            <circle cx="190" cy="10" r="2.5" fill="var(--sonepar-blue)" opacity="0.3" />
            <circle cx="190" cy="190" r="2.5" fill="var(--sonepar-blue)" opacity="0.3" />
            <circle cx="10" cy="190" r="2.5" fill="var(--sonepar-blue)" opacity="0.3" />

            <motion.path
              d="M 10 100 L 190 100"
              stroke="var(--sonepar-blue)"
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0, 1, 1, 0],
                opacity: [0, 0.5, 0.5, 0],
                x: [0, 0, 200, 200]
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear"
              }}
            />

            <motion.path
              d="M 100 10 L 100 190"
              stroke="var(--sonepar-blue)"
              strokeWidth="1.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0, 1, 1, 0],
                opacity: [0, 0.4, 0.4, 0],
                y: [0, 200, 200, 0]
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "linear"
              }}
            />

            {/* Líneas diagonales de electricidad */}
            <motion.path
              d="M 10 10 L 190 190"
              stroke="var(--sonepar-blue)"
              strokeWidth="0.8"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0, 1, 0],
                opacity: [0, 0.3, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear",
                repeatDelay: 2
              }}
            />

            <circle cx="100" cy="100" r="2" fill="var(--sonepar-blue)" opacity="0.2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuit-pattern)" />
      </svg>
    </div>
  );
};

export default AnimatedBackground;
