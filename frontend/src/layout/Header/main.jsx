import React from 'react';
import './main.css';
import NavBar from './NavBar/Navbar.jsx';
 
function Main(){
	return(<>
	
	{/* The `.Header sticky` classes live on the wrapper in App.jsx: a sticky
	    rule on this inner div would only be able to stick inside its own
	    (navbar-height) parent, i.e. never. The className prop passed here
	    before was silently ignored by Navbar. */}
	<NavBar />
	 
	</>);
}
export default Main;