import { NavLink } from 'react-router-dom';
import '../assets/styles/Service.css';

export const SUPPORT_EMAIL = 'saurabh12166@gmail.com';

export default function ServiceLayout({ title, intro, children }) {
  return (
    <div className="bz-shell bz-page">
      <header className="bz-lead"><p className="bz-caps">Bazaar directory</p><h1>{title}</h1><p>{intro}</p></header>
      <div className="service-layout">
        <aside className="service-index">
          <nav aria-label="Customer service">
            <NavLink to="/about">About Bazaar</NavLink>
            <NavLink to="/help">Help &amp; support</NavLink>
            <NavLink to="/contact">Contact us</NavLink>
          </nav>
          <address><span className="bz-caps">Surat, Gujarat</span><a href="tel:9327115687">+91 93271 15687</a><a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></address>
        </aside>
        <section className="service-content" aria-label={title}>{children}</section>
      </div>
    </div>
  );
}
