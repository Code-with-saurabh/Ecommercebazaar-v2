import React from 'react';
import './ByNow.css';
import backgroundVideo from '../../../assets/video/BGvedio1.mp4';
 
function ByNow() {
  return (
    <>
      <div className="video-container">
        <video autoPlay loop muted className="bg-video">
          <source src={backgroundVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="content">
          <h1 className="HB">Sorry, We Are Working On It!!</h1>
          <p className="message">We appreciate your patience. Please check back later.</p>
          
        </div>
      </div>
    </>
  );
}

export default ByNow;