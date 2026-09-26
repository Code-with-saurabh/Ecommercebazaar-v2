import {createSlice} from '@reduxjs/toolkit'
 
const initialState = {
	data : [],
}

const Alldata = createSlice({
	name:"AllFormData",
	initialState,
	reducers :{
		AddToDB:(state,action)=>{
			state.data.push(action.payload);
		},
		RemoveToDB:(state,action)=>{
			state.data = state.data.filter((i)=>{
				return i.phone!== action.payload;
			});
		},
	}
});

export const {AddToDB,RemoveToDB} = Alldata.actions;

export default Alldata.reducer;   