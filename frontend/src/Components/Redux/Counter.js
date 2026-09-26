import {createSlice} from '@reduxjs/toolkit';

const initialState = {
	value:0,
};

const Counter = createSlice({
	name:"counter",
	initialState,
	reducers:{
		increment : (State)=>{State.value+=1;},
		decrements : (State)=>{State.value-=1;},
		incrementBy : (State,action)=>{State.value+=action.payload;},
		reset : (Abc)=>{Abc.value= 0},
	},
});

export const {increment,decrements,incrementBy,reset} = Counter.actions;

export default Counter.reducer;