// Hero.jsx - homepage banner (LCP element)

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion';
import './Hero.css';

import Hero1Img1 from '../../assets/img/Hero1.jpg';
import Hero1Img2 from '../../assets/img/Hero02.jpg';
import Hero1Img3 from '../../assets/img/Hero03.png';
import Hero1Img4 from '../../assets/img/Hero4.jpg';
import Hero1Img5 from '../../assets/img/Hero5.jpg';
import Hero1Img6 from '../../assets/img/Hero6.jpg';
import Hero1Img7 from '../../assets/img/Hero7.jpg';
import Hero1Img8 from '../../assets/img/Hero8.jpg';
import Hero1Img9 from '../../assets/img/Hero9.jpg';

// Module level: one array, stable identity for the effect (the old version
// rebuilt it on every render, restarting the rotation timer each time).
const IMAGES = [
  Hero1Img1,
  Hero1Img2,
  Hero1Img3,
  Hero1Img4,
  Hero1Img5,
  Hero1Img6,
  Hero1Img7,
  Hero1Img8,
  Hero1Img9,
];

const ROTATE_MS = 5000;

const Hero = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) return undefined;
    const interval = setInterval(() => {
      setCurrentImageIndex(prevIndex => (prevIndex + 1) % IMAGES.length);
    }, ROTATE_MS);
    return () => clearInterval(interval);
  }, [reducedMotion]);

  // Warm the next frame so the crossfade never shows a blank background
  useEffect(() => {
    const next = (currentImageIndex + 1) % IMAGES.length;
    const img = new Image();
    img.src = IMAGES[next];
  }, [currentImageIndex]);

  return (
    <section className="Hero">
      {/*
        Real <img> instead of background-image: the browser can prioritise it
        (fetchpriority=high + the preload in index.html) which makes it the
        LCP candidate. Absolute positioning keeps the section height fixed,
        so there is zero layout shift.
      */}
      <img
        className="Hero__bg"
        src={IMAGES[currentImageIndex]}
        alt=""
        aria-hidden="true"
        loading="eager"
        decoding="async"
        fetchpriority={currentImageIndex === 0 ? 'high' : 'auto'}
      />
      <div className="hero-content">
        <h4>Trade-in-offer</h4>
        <h2>Super value deals</h2>
        <h1>On all products</h1>
        <p>Save more with coupons &amp; up to 70% off!</p>
        <Link to="/products" className="hero-button">
          Shop Now
        </Link>
      </div>
    </section>
  );
};

export default Hero;
