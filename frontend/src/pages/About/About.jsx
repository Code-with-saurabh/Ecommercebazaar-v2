import { Link } from 'react-router-dom';
import ServiceLayout from '../../layout/ServiceLayout';
import studio from '../../assets/img/IMGs/BG/Sunlit Workspace with Plants and Laptop.jpg';

export default function About() {
  return (
    <ServiceLayout title="About Bazaar" intro="An independent fashion storefront based in Surat, Gujarat.">
      <img className="about-photo" src={studio} alt="A sunlit workspace with plants and a laptop" />
      <section className="about-story"><h2>Our beginnings</h2><p>Saurabh Sharma started Bazaar in Surat as a student. Today its collection brings together four parts of an everyday wardrobe: tees, shirts, pants and shoes.</p></section>
      <section className="about-story"><h2>The collection</h2><div><p>Browse T-shirts, shirts, pants and footwear. Compare brands, sizes, prices and stock, or save a piece to your wishlist and come back to it later.</p><Link className="bz-link" to="/products">Explore the collection</Link></div></section>
    </ServiceLayout>
  );
}
