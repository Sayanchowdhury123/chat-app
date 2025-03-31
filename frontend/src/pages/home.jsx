import { Authcontext, useAuth } from '@/context/authcontext';
import React, { useContext } from 'react';
import Login from './Login';
import Register from './register';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';


function Home() {
    const {user,logout} = useAuth();
 

    return(
      <div className='p-6'>
          <h1 className='text-2xl font-bold'>Welcome, {user?.username}!</h1>
          <div className='mt-4 space-x-4'>
           <Link to="/contacts">
             <Button>
              Contacts
             </Button>
           </Link>
           <Button onClick={logout} className="mt-4">Logout</Button>
          </div>
          
      </div>
    )

    


      
    
}

export default Home;