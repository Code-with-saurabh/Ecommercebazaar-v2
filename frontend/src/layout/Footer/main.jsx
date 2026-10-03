import './main.css';
import { Link } from 'react-router-dom';

import GitHub from '../../assets/img/Github.png';
import Linkedin from '../../assets/img/Linkedin.png';
import Twitter from '../../assets/img/Twitter.png';
import Instagram from '../../assets/img/Instagram.png';

function Footer() {
    return (
        <>
            <div className="FooterDiv">
                <footer>
                    <div className="Footer-section Contact-info">
                        <h4>Contact Us</h4>
                        <a href="tel:9327115687" target="_blank" rel="noopener noreferrer">
                            <p>Phone : 9327115687</p>
                        </a>
                        <a href="mailto:saurabhsharma12166@gmail.com" target="_blank" rel="noopener noreferrer">
                            <p>Email : saurabh12166@gmail.com</p>
                        </a>
                        <p>Address : Gujarat, Surat</p>
                    </div>
                    <div className="Footer-section customer-services">
                        <h4>Customer Service</h4>
                        <ul>
                            <li><Link to="/help">Help</Link></li>
                            <li><Link to="/contact">Contact</Link></li>
                        </ul>
                    </div>
                    <div className="Footer-section about">
                        <h4>About</h4>
                        <ul>
                            <li><Link to="/about">About Us</Link></li>
                            <li><Link to="/products">Products</Link></li>
                        </ul>
                    </div>
                    <div className="Footer-section social-media">
                        <h4>Follow Me</h4>
                        <ul>
                            <li>
                                <a href="https://github.com/Code-with-saurabh" target="_blank" rel="noopener noreferrer">
                                    <img src={GitHub} alt="GitHub" className="github-icon" width="24" height="24" />Github
                                </a>
                            </li>
                            <li>
                                <a href="https://www.linkedin.com/in/saurabh-sharma-64643128b" target="_blank" rel="noopener noreferrer">
                                    <img src={Linkedin} alt="Linkedin" className="linkedin-icon" width="22" height="22" />Linkedin
                                </a>
                            </li>
                            <li>
                                <a href="https://x.com/Mr_Saurabh_16?t=PnvgJeGhUu9DXUeUl61f3A&s=09" target="_blank" rel="noopener noreferrer">
                                    <img src={Twitter} alt="Twitter" className="twitter-icon" width="24" height="24" />Twitter
                                </a>
                            </li>
                            <li>
                                <a href="https://www.instagram.com/_mr_sharma__16?utm_source=qr&igsh=bjlpM2ZqdjJlbXU1" target="_blank" rel="noopener noreferrer">
                                    <img src={Instagram} alt="Instagram" className="instagram-icon" width="20" height="20" />Instagram
                                </a>
                            </li>
                        </ul>
                    </div>
                </footer>
                <div className="Footer-section copyright">
                    <p>&copy; 2024 Saurabh Sharma. All Rights Reserved.</p>
                </div>
            </div>
        </>
    );
}

export default Footer;
