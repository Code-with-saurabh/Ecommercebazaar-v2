import React from 'react';
import { useHistory } from 'react-router-dom';
import './Help.css'; // Ensure this CSS file has the updated styles
import backgroundVideo from '../../assets/video/BGvedio1.mp4';

function Help() {
  const history = useHistory();

  // Handler for navigating to the contact page
  const handleContactClick = () => {
    history.push('/contact');
  };

  return (
    <>
      <div className="video-container">
        {/* Background Video */}
        <video autoPlay loop muted className="bg-video-HC">
          <source src={backgroundVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Help Container with overlay */}
        <div className="help-container-HC">
          {/* Header */}
          <header className="help-header-HC">
            <h1>Help & Support</h1>
            <p>Find answers to common questions or contact us for further assistance.</p>
          </header>

          {/* FAQ Section */}
          <section className="faq-section-HC">
            <h2>Frequently Asked Questions</h2>
            <div className="faq-item-HC">
              <h3>How do I place an order?</h3>
              <p>To place an order, simply browse our products, add items to your cart, and proceed to checkout.</p>
            </div>
            <div className="faq-item-HC">
              <h3>How can I track my order?</h3>
              <p>You can track your order by logging into your account and visiting the "Orders" section.</p>
            </div>
            <div className="faq-item-HC">
              <h3>What payment methods do you accept?</h3>
              <p>We accept various payment methods including credit/debit cards and online payment systems.</p>
            </div>
          </section>

          {/* Contact Us Button */}
          <button className="contact-btn-HC" onClick={handleContactClick}>
            Contact Us
          </button>
        </div>
      </div>
    </>
  );
}

export default Help;
