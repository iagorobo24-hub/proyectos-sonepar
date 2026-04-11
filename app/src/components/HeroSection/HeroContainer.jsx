import React from 'react';
import HeroHeader from './HeroHeader';
import HeroContent from './HeroContent';
import HeroVisual from './HeroVisual';
import StatsSection from './StatsSection';
import FeaturesMini from './FeaturesMini';
import AnimatedBackground from './AnimatedBackground';
import styles from './styles/HeroContainer.module.css';

/**
 * HeroContainer - Main layout component for the Hero section.
 * Integrates header, content, visual mockup, stats, and features.
 */
const HeroContainer = () => {
  return (
    <div className={styles.heroContainer}>
      <HeroHeader />
      
      {/* Dynamic SVG Background */}
      <AnimatedBackground />

      {/* Main Content Area */}
      <main className={styles.mainWrapper}>
        <HeroContent />
        <HeroVisual />
      </main>

      {/* Trust & Stats Section */}
      <StatsSection />

      {/* Key Features Quick Access */}
      <FeaturesMini />
    </div>
  );
};

export default HeroContainer;
