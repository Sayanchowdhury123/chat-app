import { useNavigate } from 'react-router-dom';
import api from '../api';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';


function Grouplist() {
const[groups,setgroups] = useState([]);
const navigate = useNavigate();

useEffect(() => {
  fetchgroups();
},[])


const fetchgroups = async () => {
    try {
        const res = await api.get("/groups")
        setgroups(res.data)
    } catch (error) {
        console.log(error);
    }
}

    return ( 
        <div className='p-4'>
            <div className='flex justify-between items-center mb-6'>
            <h2 className='text-2xl font-bold mb-4'>Your Groups</h2>
            <Button onClick={() => navigate("/create-group")} className="bg-blue-500 hover:bg-blue-600 text-white">Create New Group</Button>
            </div>
               
                <div className='space-y-2'>
                   {
                    groups.map((group) => (
                        <div key={group._id} onClick={() => navigate(`/group-chat/${group._id}`)} className='p-3 border rounded-lg hover:bg-gray-50 cursor-pointer'>
                         <h3 className='font-medium'>{group.name}</h3>
                         <p className='text-sm text-gray-500 '>{group.members.length} members</p>
                        </div>
                    ))
                   }
                </div>
        </div>
     );
}

export default Grouplist;