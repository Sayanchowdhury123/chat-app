import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
export const Authcontext = createContext();

export const Authprovider = ({children}) => {
const[user,setuser] = useState(null);
const[isauthinticated,setisauthincated] = useState(false);



useEffect(() => {
    const token = localStorage.getItem("token");
    if(token){
        axios.defaults.headers.common['Authorization'] = token;
        setisauthincated(true)
        fetchuser()
    } else{
        delete  axios.defaults.headers.common['Authorization'];
        setisauthincated(false)
       
    }
  
    
},[])

const fetchuser = async () => {
    try {
        const res = await api.get("/auth/user");
        setuser(res.data)
      
    } catch (error) {
        console.log(error);
         
    } 
}


const login = async (username,password) => {
    
        const res = await axios.post("http://localhost:5000/api/auth/login", {username,password});
        localStorage.setItem("token",res.data.token);
        axios.defaults.headers.common['Authorization'] = res.data.token;
        setisauthincated(true)
         fetchuser();
       
        alert("you are logged in")
        
        
   
}


const register = async (username,password) => {
    
    const res = await axios.post("http://localhost:5000/api/auth/register", {username,password});
  
    
    alert("you have registered successfully")
    
    
}

const logout = () =>{
    localStorage.removeItem("token");
 
    delete  axios.defaults.headers.common['Authorization'];
    setisauthincated(false)

    setuser(null)

}




return(
    <Authcontext.Provider value={{user,login,register,logout,isauthinticated}}>
        {children}
    </Authcontext.Provider>
)


}


export const useAuth = () => useContext(Authcontext)