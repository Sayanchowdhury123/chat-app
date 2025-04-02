import { useAuth } from '@/context/authcontext';
import { useSocket } from '@/context/socketcontext';
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from "../api";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function Groupchat() {
    const { groupid } = useParams();
    const { user } = useAuth();
    const socket = useSocket();
    const [messages, setmessages] = useState([]);
    const [newmessage, setnewmessage] = useState("");
    const [group, setgroup] = useState(null);
    const messageendref = useRef(null);
    const[typingusers,settypingusers] = useState([]);
    const[istyping,setistyping] = useState(false)
    const typingtimeout = useRef(null);
     const [readrecipts, setreadrecipts] = useState({})


    useEffect(() => {
        const fetchdata = async () => {
            try {
                const [groupres, messageres] = await Promise.all([
                    api.get(`/groups/${groupid}`),
                    api.get(`/groupmsg/${groupid}/messages`)
                ])

                setgroup(groupres.data)
                setmessages(messageres.data)
            } catch (error) {
                console.log(error);
            }
        }
        fetchdata();


       //read recipt
       socket.on("readupdate-group", ({ messageid, readby }) => {
        setreadrecipts(prev => ({ ...prev, [messageid.toString()]: readby }))
       
    })


        socket.on("usertyping", ({userids}) => {
            settypingusers(userids)
        })

        socket.emit("joingroup", groupid)

        socket.on("recivegroupmessage", handlenewmessage);

        return () => {
            socket.emit("leavegroup", groupid)
            socket.off("recivegroupmessage")
            socket.off("usertyping")
            socket.off("readupdate-group")
           
        }

    }, [groupid,socket])


  useEffect(() => {
  
       const unreadmessages = messages.filter(msg => msg.sender._id.toString() !== user._id && !readrecipts[msg._id.toString()]?.includes(user._id))
          if (unreadmessages.length > 0) {
              socket.emit("markasread-group", {
                  messageids: unreadmessages.map((msg) => msg._id.toString()),
                  readerid: user._id,
                  groupid
              })
          }
  
      }, [messages,readrecipts,groupid,user._id,socket])


      const renderreadstatus = (message) => {
        if (message.sender._id.toString() !== user._id) return null;
        const isread = readrecipts[message._id.toString()]?.length > 0;
        
           
        return (
            <div className='text-right mt-1'>
                <span className={`text-xs ${isread ? "text-green-500 font-medium" : "text-gray-400"}`}>
                    {isread ? "Seen" : "Sent"}
                </span>
            </div>
        )
    }


    useEffect(() => {
        clearTimeout(typingtimeout.current)
    },[])

    const handlenewmessage = (message) => {
        setmessages(prev => [...prev, message])
    }

    const sendmessage = () => {
        if (newmessage.trim()) {
            socket.emit("sendgroupmessage", {
                groupid,
                message: newmessage,
                sender: user._id
            });
            setnewmessage("");
            handletyping(false)
        }
    }

    useEffect(() => {
        messageendref.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages,typingusers])

   const handletyping = (iscurrentlytyping) => {
      clearTimeout(typingtimeout.current);

      if(iscurrentlytyping && !istyping){
        socket.emit("typingstart", groupid)
        setistyping(true)
      }else if(!iscurrentlytyping && istyping){
        socket.emit("typingstop", groupid)
        setistyping(false)
      }


      if(iscurrentlytyping){
        typingtimeout.current = setTimeout(() => {
            handletyping(false)
        }, 2000);
      }
   }
 
    return (
        <div className=' flex flex-col h-screen'>
            <div className='p-4 border-b'>
                <h1 className='text-xl font-bold '>{group?.name}</h1>
                <p className='text-sm text-gray-500'>{group?.members?.length} members</p>
            </div>

        <div className='flex-1 overflow-y-auto p-4 space-y-4 ' style={{scrollbarWidth:"none"}} >
            {
                messages.map((message) => (


                    
                        <div key={message._id} className={`flex ${message.sender._id.toString() === user._id ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-xs p-3 rounded-lg ${message.sender._id.toString() === user._id ? "bg-blue-500 text-white" : "bg-gray-200"}`}>
                           <p className={`text-sm font-medium`}>
                                {message.sender._id.toString() === user._id ? "you" : message.sender.username}
                           </p>
                           <p>{message.message}</p>
                            {renderreadstatus(message)}
                           <p className='text-xs opacity-70 mt-1'>
                            {new Date(message.timestamp).toLocaleTimeString()}
                           </p>
                        </div>
                    </div>
                    
                  ))}
                <div ref={messageendref} />
        </div>

        {
            typingusers.length > 0 && (
                <div className='flex items-center p-2 text-gray-500 italic'>
                     <div className='flex space-x-1 mr-2'>
                       {
                        [0,1,2].map((i) => (
                            <div key={i} className='typing-dot'
                            style={{animationDelay: `${i*0.2}s`}}
                            />
                        ))
                       }
                     </div>
                     <span className=''>
                        {
                            typingusers.length === 1 ? `someone is typing...` : `${typingusers.length} people typing...`
                        }
                     </span>
                </div>
            )
        }

        <div className='sticky bottom-0 pt-4 pb-6 bg-white px-5'>
                <div className='flex '>
                    <Input autoFocus value={newmessage} placeholder="Type a message..." className="mr-4" onChange={(e) => {
                         setnewmessage(e.target.value)
                        handletyping(e.target.value.length > 0)
                         }} 

                         onBlur={() => {
                            handletyping(false)
                         }}
                         onKeyPress={(e) => e.key === "Enter" && sendmessage()} />
                    <Button onClick={sendmessage}>Send</Button>
                </div>
            </div>

        </div>
    );
}

export default Groupchat;