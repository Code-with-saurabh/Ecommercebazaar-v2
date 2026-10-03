import './About.css'; // Assuming you have a separate CSS file

const ForAbout = ({ Img ,Color, hadding, data1, data2, data3 }) => {
   
   const styles = {
    backgroundImage: `url('${Img}')`,
    backgroundSize: "cover",
    backgroundPosition: "center",	
    color: `${Color}`,
	
  };
  
  // console.log(Img);  
  
  return (
    <div className="aboutclass" style={styles}>
      <div className="about-content">
        <h1>{hadding}</h1>
        <p>{data1}</p>
        <p>{data2}</p>
        <p>{data3}</p>
		<div className="about-image">
		 
		</div>
      </div>
    </div>
  );
};

export default ForAbout;
