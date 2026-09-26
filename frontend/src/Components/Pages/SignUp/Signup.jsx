import React,{useState} from 'react';
import './Signup.css';
// import BGV1 from '../../../assets/video/background.mp4';
import BGV2 from '../../../assets/video/background2.mp4';
import { useHistory,Link  } from "react-router-dom";
import {AddToDB} from '../../Redux/AllFormData.jsx';
import {useSelector,useDispatch} from 'react-redux';
import axios from 'axios';
function Signup() {
	
	 
	
	const Data = useSelector(state=>state.Data.data);
	const dispatch = useDispatch(); 
	 const history = useHistory();
	const [fromData,setfromData] = useState({
		username:"",
		email:"",
		phone:"",
		password:"",
	});
	
	function handalAlldata(e){
		const {id,value} = e.target;
		setfromData({
			...fromData,
			[id] :value
		});
		 
	};
	
	 
	function Submit(e){
		
		e.preventDefault();
		
	const Dupicate = Data.find(user => 
	user.username === fromData.username ||
	user.email === fromData.email || 
	user.phone === fromData.phone);
	  if (!Dupicate) {
        try {
            // Dispatch action to add the data to the Redux store
            dispatch(AddToDB(fromData));
            console.log("data Pushed to main db ", Data, fromData);

            // Send data to the backend (API call)
            axios.post('http://localhost:5000/api/users/register', fromData)
                .then((response) => {
                    console.log('Data successfully sent to the backend:', response.data);
                    setfromData({
                        username: "",
                        email: "",
                        phone: "",
                        password: "",
                    });
                })
				  
                .catch((error) => {
                    console.error('Error registering user:', error.response.data);
                    history.push(`/error?message=${error.response.data.message}`);
                });
			history.push('/login');
        } catch (error) {
            console.error('Error dispatching action:', error);
        }
    } else {
         
          history.push(`/error?message=Duplicate data found, please try again.`); // Use history.push instead of navigate
   
    }
 
		
	}
	
    return (
        <div className="form-container">
            <video autoPlay muted loop className="background-video">
                <source src={BGV2} type="video/mp4" />
            </video>
            <div className="form-content">
                <form className="login-form" onSubmit={Submit}>
				
                    <div className="input-wrapper">
                        <input 
                            type="text" 
                            id="username" 
                            className="floating-input" 
                            placeholder=" " 
							maxLength="25"
							value={fromData.username}
							onChange={handalAlldata}
                            required 
                        />
                        <label htmlFor="username">Username</label>
                    </div>
					
                    <div className="input-wrapper">
                        <input 
                            type="email" 
                            id="email" 
                            className="floating-input" 
                            placeholder=" " 
						
							value={fromData.email}
							onChange={handalAlldata}
							
                            required 
                            pattern="[a-zA-Z0-9._%+-]+@gmail\.com" 
                            title="Email must end with @gmail.com"
                        />
                        <label htmlFor="email">Email</label>
                    </div>
					
                    <div className="input-wrapper">
                        <input 
                            type="tel" 
                            id="phone" 
                            className="floating-input" 
                            placeholder=" " 
							maxLength="10"
							value={fromData.phone}
							onChange={handalAlldata}
                            required 
                            pattern="[789][0-9]{9}" 
                            title="Phone number must start with 7, 8, or 9 and be 10 digits long"
                        />
                        <label htmlFor="phone">Phone No.</label>
                    </div>
					
                    <div className="input-wrapper">
                        <input 
                            type="password" 
                            id="password" 
                            className="floating-input" 
                            placeholder=" " 
							maxLength="8"
							value={fromData.password}
							onChange={handalAlldata}
                            required 
                        />
                        <label htmlFor="password">Password</label>
                    </div>
					
                    <button type="submit" 
					className="submit-btn">Submit</button>
					<div className="account-prompt">
                    <p>Already have an account? <Link to="/login">Login</Link>.</p>
                </div>
                </form>
				
            </div>
        </div>
    );
}

export default Signup;
