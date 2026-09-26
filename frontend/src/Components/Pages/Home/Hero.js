// Hero.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Hero.css';
import Hero1Img1 from '../../../assets/img/Hero1.jpg';
import Hero1Img2 from '../../../assets/img/Hero02.jpg';
import Hero1Img3 from '../../../assets/img/Hero03.png';
import Hero1Img4 from '../../../assets/img/Hero4.jpg';
import Hero1Img5 from '../../../assets/img/Hero5.jpg';
import Hero1Img6 from '../../../assets/img/Hero6.jpg';
import Hero1Img7 from '../../../assets/img/Hero7.jpg';
import Hero1Img8 from '../../../assets/img/Hero8.jpg';
import Hero1Img9 from '../../../assets/img/Hero9.jpg';

const Hero = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = [
    Hero1Img1,
    Hero1Img2,
    Hero1Img3,
    Hero1Img4,
    Hero1Img5,
    Hero1Img6,
    Hero1Img7,
    Hero1Img8,
    Hero1Img9,
    // Add more image paths as needed
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // Change image every 5 seconds (5000 ms)

    return () => clearInterval(interval);
  }, [images.length]);

  const heroStyle = {
    backgroundImage: `url(${images[currentImageIndex]})`,
	boxShadow:"#7c787847 1px 1px 20px",
  };

  return (
    <section className="Hero" style={heroStyle}>
      <div className="hero-content">
        <h4>Trade-in-offer</h4>
        <h2>Super value deals</h2>
        <h1>On all products</h1>
        <p>Save more with coupons & up to 70% off!</p>
        <Link to="/products" className="hero-button">Shop Now</Link>
      </div>
    </section>
  );
};

export default Hero;

