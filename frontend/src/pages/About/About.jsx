import { Link } from 'react-router-dom';
import ServiceLayout from '../../layout/ServiceLayout';
import studio from '../../assets/img/IMGs/BG/Sunlit Workspace with Plants and Laptop.jpg';

export default function About() {
  return (
    <ServiceLayout title="About Bazaar" intro="An independent fashion storefront based in Surat, Gujarat.">
      <img className="about-photo" src={studio} alt="A sunlit workspace with plants and a laptop" />
      <section className="about-story"><h2>The project</h2><p>Bazaar began as Saurabh Sharma’s college project: building a fashion store from the ground up with React, from the first product listing through to the order receipt.</p></section>
      <section className="about-story"><h2>The collection</h2><div><p>Browse T-shirts, shirts, pants and footwear. Compare brands, sizes, prices and stock, or save a piece to your wishlist and come back to it later.</p><Link className="bz-link" to="/products">Explore the collection</Link></div></section>
    </ServiceLayout>
  );
}
