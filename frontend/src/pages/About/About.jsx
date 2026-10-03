
import img1 from '../../assets/img/IMGs/BG/Minimalist Composition with Vase and Dried Plants.jpg';
import img2 from '../../assets/img/IMGs/BG/Serene Minimalist Plant.jpg';
import img3 from '../../assets/img/IMGs/BG/Sunlit Workspace with Plants and Laptop.jpg';
import img4 from '../../assets/img/IMGs/BG/Midnight Coders.jpg';

import './About.css'; // Assuming you have a separate CSS file

import ForAbout from './ForAbout.jsx';

const About = () => {
	
	 
	 
  return (
    <>
	<ForAbout  
	
	Img={img1} hadding="Welcome to Our E-Commerce Store!" 
	
	Color="midnightblue"
	
	data1="Welcome to BAZAAR , your ultimate destination for all things stylish and convenient. At BAZAAR, we believe in making online shopping a seamless experience, offering you a wide range of products right at your fingertips. Whether you're looking for trendy fashion pieces, cutting-edge gadgets, or essential home goods, we've got you covered."  
	
	data2= "Our Commitment to Quality : At Bazaar, quality is our top priority. We carefully curate our collection to ensure that each item meets our high standards of craftsmanship and functionality. From sourcing the finest materials to partnering with trusted brands, we strive to bring you products that not only meet but exceed your expectations." 
	
	data3= " Why Choose Us? : What sets Bazaar apart is not just our product selection but also our dedication to customer satisfaction. Our user-friendly interface and secure payment gateway ensure a hassle-free shopping experience. Whether you're a fashion enthusiast, tech-savvy individual, or simply looking to enhance your living space, Bazaar is here to cater to your needs with style and reliability."
	/>
	<ForAbout  
	
	Img={img2} 
	
	Color="black"
	
	hadding="Our Mission" 
	
	data1="Welcome to Bazaar! At Bazaar, our mission is to enrich your online shopping journey by offering a carefully curated selection of premium products that enhance your everyday life. We are committed to providing a seamless shopping experience where quality, style, and convenience converge." 
	
	data2="Commitment to Excellence : Welcome to Bazaar! Our mission at Bazaar is driven by a relentless pursuit of excellence. We handpick each product from trusted suppliers to ensure they meet our rigorous standards of craftsmanship and functionality"
	
	data3= "Empowering Your Choices: Welcome to Bazaar! At Bazaar, our mission is to empower you with a diverse array of choices that reflect your unique tastes and preferences. Whether you're exploring the latest fashion trends, cutting-edge technology, or home essentials, we are here to inspire and elevate your shopping experience."
	
	/>
	
	<ForAbout  
	
	Img={img3} 
	
	Color="black"

	hadding="Customer Satisfaction" 
	
	data1="Welcome to Bazaar! At Bazaar, your satisfaction is our top priority. We are dedicated to providing an exceptional shopping experience from start to finish, ensuring that every interaction with us is seamless and enjoyable." 
	
	data2="Personalized Service : Welcome to Bazaar! We believe in personalized service tailored to your needs. Our friendly and knowledgeable team is here to assist you at every step, whether you have a question about a product or need help with your order." 
	
	data3= "Quality Assurance  : Welcome to Bazaar! We stand behind the quality of our products. Each item is carefully inspected and chosen to meet our high standards, so you can shop with confidence knowing that you're receiving top-notch merchandise."
	/>
	<ForAbout  
	
	Img={img4} 
	
	Color="white"

	hadding="Our Team" 
	
	data1="Welcome to Bazaar! Behind every aspect of our store is a dedicated team passionate about creating the best online shopping experience for you. From designing the website to curating our product selection, every detail is crafted with care and expertise." 
	
	data2= "Meet Our Founder : Welcome to Bazaar! Founded by Saurabh Sharma , Bazaar started as a college project driven by a passion for technology and entrepreneurship. With a commitment to innovation and customer satisfaction, Saurabh Sharma  has overseen every aspect of the store's development." 
	
	data3= "Our Development Journey  : Welcome to Bazaar! Our team's journey has been one of learning and growth. Through self-directed learning and hands-on experience with React, we have built Bazaar from the ground up, ensuring that every feature of our website reflects our dedication to quality and functionality." 
	/>
	</>
  );
};

export default About;
