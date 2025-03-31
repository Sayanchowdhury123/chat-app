import { useNavigate } from "react-router-dom";
import api from "../api";
import React, { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";


function Groupchatpage() {
    const[name,setname] = useState("");
    const[selectedmembers,setselectedmembers] = useState([])
    const[isloading,setisloading] = useState(false);
    const[contacts,setcontacts] = useState([]);
   const navigate = useNavigate();

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

   const handle = async (e) => {
    e.preventDefault();
    setisloading(true)


    if(selectedmembers.length === 0){
        alert("select atleast one contact")
        return;
    }
    try {
        const res = await api.post("/groups/create", {
            name,
            memberids: selectedmembers
        });

        alert("group created")
     navigate(`/group-chat/${res.data._id}`)
        
    } catch (error) {
        console.log(error);
    } finally{
        setisloading(false)
    }
   }

   const togglemember = (contactid) => {
    setselectedmembers(prev => prev.includes(contactid) ? prev.filter(id => id !== contactid) : [...prev, contactid])
   }

    return ( 
        <div className="max-w-md mx-auto p-6">
           <h1 className="text-2xl font-bold mb-6">Create New Group</h1>

           <form onSubmit={handle}>
            <div className="mb-6">
               <label htmlFor="" className="block text-sm font-medium mb-2">Group Name</label>
               <Input type={Text} value={name} onChange={(e) => setname(e.target.value)} placeholder="Enter Group Name" required />
            </div>
          
          <div className="mb-6">
             <label htmlFor="" className="block text-sm font-medium mb-2" >Select Members</label>
             <div className="space-y-2 border rounded-lg p-4">
            {
                contacts.map((contact) => (
                    <div key={contact._id}>
                           <input type="checkbox" id={`member-${contact._id}`} checked={selectedmembers.includes(contact._id)} 
                           
                           onChange={() => togglemember(contact._id)} className="mr-2"
                           />

                           <label htmlFor={`member-${contact._id}`}>{contact.username}</label>
                    </div>
                ))
            }
             </div>
          </div>

          <div className="flex space-x-3 ">
            <Button type="submit" variant="outline" onClick={ () => navigate(-1)} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={!name || selectedmembers.length === 0 || isloading} 
            className="flex-1 bg-blue-500 hover:bg-blue-600"
            >
                {isloading ? "creating..." : "create group"}
            </Button>
          </div>

           </form>

        </div>
     );
}

export default Groupchatpage;