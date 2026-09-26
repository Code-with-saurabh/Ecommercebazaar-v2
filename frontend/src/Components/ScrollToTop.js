import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Har route change par page ko top par scroll karta hai
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default ScrollToTop;
