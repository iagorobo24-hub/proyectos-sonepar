import React from 'react';
import { motion } from 'framer-motion';
import { 
  BookText, 
  Calculator, 
  Cpu, 
  FileSpreadsheet, 
  GraduationCap, 
  Layers 
} from 'lucide-react';
import styles from './styles/FeaturesMini.module.css';

const FeaturesMini = () => {
  const features = [
    { 
      title: "Catálogo Técnico", 
      desc: "Acceso a más de 1200 referencias de material eléctrico.", 
      icon: <BookText size={20} /> 
    },
    { 
      title: "KPI Calculator", 
      desc: "Métricas de rendimiento para personal de almacén.", 
      icon: <Calculator size={20} /> 
    },
    { 
      title: "IA Assistant", 
      desc: "Soporte especializado impulsado por Claude API.", 
      icon: <Cpu size={20} /> 
    },
    { 
      title: "Generador de Presupuestos", 
      desc: "Crea simulaciones de costes profesionales.", 
      icon: <FileSpreadsheet size={20} /> 
    },
    { 
      title: "Simulación de Formación", 
      desc: "Entrenamiento interactivo para nuevos empleados.", 
      icon: <GraduationCap size={20} /> 
    },
    { 
      title: "Multi-herramienta", 
      desc: "Todo lo que necesitas en una sola plataforma.", 
      icon: <Layers size={20} /> 
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
