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

function Contacts() {
const[contacts,setcontacts] = useState([]);
const[contactusername,setcontactusername] = useState("");
const navigate = useNavigate();
const {user} = useAuth();


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

const gotochat = (contactid) => {
 navigate(`/chat/${contactid}`)
}

    return ( 
      <div className='p-6'>
            <h1 className='text-2xl font-bold mb-6'>Contacts</h1>
            <div className='mb-6'>
             <Input type={Text} placeholder="Enter username" value={contactusername} onChange={(e) => setcontactusername(e.target.value)} className="mr-4" />
             <Button onClick={addcontact} className="mt-3">Add Contacts</Button>
             <Button className="ml-4" onClick={() => navigate("/groups")}>Groupchats</Button>
            </div>


            <ul>
                {
                    contacts.map((contact) => (
                        <li key={contact._id} className='mb-2' onClick={() => gotochat(contact._id)}>
                             {contact.username}
                        </li>
                    ))
                }
            </ul>
      </div>
     );
}

export default Contacts;