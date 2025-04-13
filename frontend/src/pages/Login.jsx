import React, { useContext, useState } from 'react';
import { Authcontext, useAuth } from '@/context/authcontext';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function Login() {
const[username,setusername] = useState("")
  const [password, setpassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    try {
      await login(username, password)
      navigate("/")
    } catch (error) {
      console.log(error);
    }


  }
  return (
    


<div className=' bg-gray-100  '>

      <div className='text-right mr-6'>
      <Button className=" mt-4" onClick={() => navigate("/register")} >Register</Button>
      </div>

   <div className='flex justify-center items-center h-[92vh]'>

   <div className='bg-white p-8 rounded-lg shadow-md w-96'>
        <h1 className='text-2xl font-bold mb-6'>Login</h1>
        <form className='space-y-4' onSubmit={handle}>
          <Input type={Text} value={username} placeholder="Username" onChange={(e) => setusername(e.target.value)} className="mb-4" />

          <Input type={password} value={password} placeholder="Password" onChange={(e) => setpassword(e.target.value)} className="mb-6" />

          <Button type="submit" className="w-full">Login</Button>
        </form>
       
      </div>

   </div>
   

    </div>


     
      
    
 


  );
}

export default Login;