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
import FloatingParticles from './FloatingParticles';
import SimpleFooter from './SimpleFooter';
import FeaturesMini from './FeaturesMini';
import AnimatedBackground from './AnimatedBackground';
import styles from './styles/HeroContainer.module.css';
import transitions from './styles/SectionTransitions.module.css';

const SectionBreak = () => (
  <div className={transitions.sectionSpacer}>
    <div className={transitions.sectionDivider}>
      <div className={transitions.dividerLine} />
    </div>
  </div>
);

/**
 * HeroContainer - Main layout component for the Hero section.
 */
const HeroContainer = () => {
  return (
    <div className={styles.heroContainer}>
      {/* Floating Particles Background */}
      <FloatingParticles />

      <HeroHeader />

      {/* Dynamic SVG Background */}
      <AnimatedBackground />

      {/* Main Content Area */}
      <main className={styles.mainWrapper}>
        <HeroContent />
        <HeroVisual />
      </main>

      <SectionBreak />

      {/* Trust & Stats Section */}
      <StatsSection />

      <SectionBreak />

      {/* How It Works - 3 Steps */}
      <HowItWorks />

      <SectionBreak />

      {/* 7 Tools Showcase */}
      <ToolsShowcase />

      <SectionBreak />

      {/* Roadmap */}
      <Roadmap />

      <SectionBreak />

      {/* Tech Stack */}
      <TechStack />

      <SectionBreak />

      {/* Final CTA */}
      <FinalCTA />

      <SectionBreak />

      {/* Key Features Quick Access */}
      <FeaturesMini />

      {/* Footer */}
      <SimpleFooter />
    </div>
  );
};

export default HeroContainer;
