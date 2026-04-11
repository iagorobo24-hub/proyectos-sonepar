import React from 'react';
import HeroContainer from '../components/HeroSection/HeroContainer';
import useDocumentTitle from '../hooks/useDocumentTitle';

const LandingPage = () => {
  useDocumentTitle('Sonepar Tools — Suite de Herramientas Eléctricas');
  
  return (
    <div className="landing-page">
      <HeroContainer />
    </div>
  );
};

export default LandingPage;
