import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AvatarFallback } from '@radix-ui/react-avatar';
import axios from 'axios';
import { Authcontext, useAuth } from '@/context/authcontext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import api from "../api";
import { useSocket } from '@/context/socketcontext';

import { formatDistanceToNow } from 'date-fns';



function Contacts() {
const[contacts,setcontacts] = useState([]);
const[contactusername,setcontactusername] = useState("");
const navigate = useNavigate();
const {user} = useAuth();
const Socket = useSocket();
const[onlineusers,setonlineusers] = useState({});

useEffect(() => {
  
Socket.emit("set-online", user._id)
    
Socket.on("online-users", (userids) => {
    setonlineusers(userids)
})


       return () => {
        
       Socket.off("online-users")
      
       }
  },[user._id])





useEffect(() => {

    fetchcontact();
},[])






const fetchcontact = async () => {
    try {

        const res = await api.get("/contacts")
        setcontacts(res.data)
     
       
    } catch (error) {
        console.log(error);
    }
}

const addcontact = async () => {
    try {
        await api.post("/contacts/add", {contactusername})
         setcontactusername("");
         fetchcontact();
    } catch (error) {
        console.log(error);
    }
}

const getstatus = (contactid) => {
    if(onlineusers[contactid]){
        return {text: "Online" , dot: "bg-green-500"}
    }else{
        return {text:"Offline", dot: "bg-red-500"}
    }

    
   
}


    return ( 
      <div className='p-6'>
            <h1 className='text-2xl font-bold mb-6'>Contacts</h1>
            <div className='mb-6'>
             <Input type={Text} placeholder="Enter username" value={contactusername} onChange={(e) => setcontactusername(e.target.value)} className="mr-4" />
             <Button onClick={addcontact} className="mt-3">Add Contacts</Button>
             <Button className="ml-4" onClick={() => navigate("/groups")}>Groupchats</Button>
            </div>

         
         <div>
            {
                contacts.map(contact => {
                  const status = getstatus(contact._id)
                     
                    return (
                        <div key={contact._id} className='flex items-center py-2' onClick={() => navigate(`/chat/${contact._id}`)}>
                           <div className='relative'>
                                <div className={`absolute -right-1 -bottom-1 w-3 h-3 rounded-full border-2 border-white ${status.dot} `} />

                               

                                <div className='ml-3'>
                                    <p className='font-medium'>{contact.username}</p>
                                    <p className='text-xs text-gray-500'>
                                       {status.text}
                                    </p>
                                </div>
                           </div>
                        </div>
                    )
                })}
         </div>

      </div>
     );
}

export default Contacts;