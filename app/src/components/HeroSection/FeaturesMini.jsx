import React from 'react';
import { motion } from 'framer-motion';
import { 
  BookText, 
  Calculator, 
  Cpu, 
  FileSpreadsheet, 
  GraduationCap, 
  Database,
  FileDown,
  Zap
} from 'lucide-react';
import styles from './styles/FeaturesMini.module.css';

const FeaturesMini = () => {
  const features = [
    { 
      title: "Catálogo Pro", 
      desc: "Más de 100k referencias clasificadas por Familia y Marca.", 
      icon: <BookText size={20} /> 
    },
    { 
      title: "KPI Analítica", 
      desc: "Métricas logísticas y rendimiento de almacén en tiempo real.", 
      icon: <Calculator size={20} /> 
    },
    { 
      title: "Asistente SONEX", 
      desc: "Consultor de material eléctrico con IA avanzada.", 
      icon: <Cpu size={20} /> 
    },
    { 
      title: "Presupuestos", 
      desc: "Generador de simulaciones de costes profesionales.", 
      icon: <FileSpreadsheet size={20} /> 
    },
    { 
      title: "Simulador 3D", 
      desc: "Entrenamiento interactivo en entornos de almacén.", 
      icon: <GraduationCap size={20} /> 
    },
    { 
      title: "Seguridad Firestore", 
      desc: "Base de datos asíncrona con cifrado y backups diarios.", 
      icon: <Database size={20} /> 
    },
    { 
      title: "Exportación PDF", 
      desc: "Genera informes y fichas técnicas listos para el cliente.", 
      icon: <FileDown size={20} /> 
    },
    { 
      title: "Optimización Cloud", 
      desc: "Arquitectura serverless diseñada para máxima velocidad.", 
      icon: <Zap size={20} /> 
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.section 
      className={styles.featuresWrapper}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
    >
      {features.map((feature, index) => (
        <motion.div 
          key={index} 
          className={styles.featureCard}
          variants={item}
        >
          <div className={styles.iconWrapper}>
            {feature.icon}
          </div>
          <h3 className={styles.featureTitle}>{feature.title}</h3>
          <p className={styles.featureDesc}>{feature.desc}</p>
        </motion.div>
      ))}
    </motion.section>
  );
};

export default FeaturesMini;
