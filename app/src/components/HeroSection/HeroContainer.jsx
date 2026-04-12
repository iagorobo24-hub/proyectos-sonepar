import React from 'react';
import HeroHeader from './HeroHeader';
import HeroContent from './HeroContent';
import HeroVisual from './HeroVisual';
import StatsSection from './StatsSection';
import HowItWorks from './HowItWorks';
import ToolsShowcase from './ToolsShowcase';
import Roadmap from './Roadmap';
import TechStack from './TechStack';
import FinalCTA from './FinalCTA';
import FeaturesMini from './FeaturesMini';
import AnimatedBackground from './AnimatedBackground';
import styles from './styles/HeroContainer.module.css';

/**
 * HeroContainer - Main layout component for the Hero section.
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

      {/* How It Works - 3 Steps */}
      <HowItWorks />

      {/* 7 Tools Showcase */}
      <ToolsShowcase />

      {/* Roadmap */}
      <Roadmap />

      {/* Tech Stack */}
      <TechStack />

      {/* Final CTA */}
      <FinalCTA />

      {/* Key Features Quick Access */}
      <FeaturesMini />
    </div>
  );
};

export default HeroContainer;
