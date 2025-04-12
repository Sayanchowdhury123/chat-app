import { Authcontext, useAuth } from '@/context/authcontext';
import React, { useContext } from 'react';
import Login from './Login';
import Register from './register';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';


function Home() {
    const {user,logout} = useAuth();
    const navigate = useNavigate();
 

    return(
      <div className='p-6 '>

        <div className='flex justify-between'>
       
        <h1 className='text-2xl font-bold'>Welcome, {user?.username}!</h1>
        <Button onClick={logout} className=" ">Logout</Button>
        </div>
         

          <div className='mt-4 space-x-4'>
           <Link to="/contacts">
             <Button>
              Contacts
             </Button>
           </Link>
            <Button className="" onClick={() => navigate("/groups")}>Groupchats</Button>
           
          </div>
          
     
    
     

      </div>
    )

    


      
    
}

export default Home;