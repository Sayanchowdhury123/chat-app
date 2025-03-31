import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import React, { useContext } from 'react';
import { useState } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Authcontext } from '@/context/authcontext';
import { useAuth } from '@/context/authcontext';

function Register() {
  
    const[username,setusername] = useState("")
      const [password, setpassword] = useState("");
      const { register } = useAuth();
      const navigate = useNavigate();
    
      const handle = async (e) => {
        e.preventDefault();
        try {
          await register(username, password)
          navigate("/login")
        } catch (error) {
          console.log(error);
        }
    

    }
    return (
         <div className='flex items-center justify-center h-screen bg-gray-100'>
              <div className='bg-white p-8 rounded-lg shadow-md w-96'>
                <h1 className='text-2xl font-bold mb-6'>Register</h1>
                <form className='space-y-4' onSubmit={handle}>
                  <Input type={Text} value={username} placeholder="Username" onChange={(e) => setusername(e.target.value)} className="mb-4" />
        
                  <Input type={password} value={password} placeholder="Password" onChange={(e) => setpassword(e.target.value)} className="mb-6" />
        
                  <Button type="submit" className="w-full">Register</Button>
                </form>
              </div>
        
            </div>
    );
      
}
export default Register;