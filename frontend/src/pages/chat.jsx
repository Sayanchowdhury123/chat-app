import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Authcontext, useAuth } from '@/context/authcontext';
import { useSocket } from '@/context/socketcontext';
import axios from 'axios';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from "../api";



function Chat() {
    const { contactid } = useParams();
    const [messages, setmessages] = useState([]);
    const [newmessage, setnewmessage] = useState("");
    const { user } = useAuth();
    const socket = useSocket();
    const messageendref = useRef(null);
    const [typingusers, settypingusers] = useState([]);
    const [istyping, setistyping] = useState(false)
    const typingtimeout = useRef(null);
    

    const room = [user._id, contactid].sort().join('_');

    useEffect(() => {
        socket.emit("joinroom", room);

        socket.on("singleusertyping", ({ userids }) => {
            settypingusers(userids)
        })

        fetchmessages();

        socket.on("recivemessage", (message) => {
            setmessages((prev) => [...prev, message])
        })


        return () => {
            socket.emit("leaveroom", room)
            socket.off("recivemessage")
            socket.off("singleusertyping")
        }
    }, [contactid])

    useEffect(() => {
        messageendref.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, typingusers])

    const fetchmessages = async () => {
        try {
            const res = await api.get(`/messages/${contactid}`);
            setmessages(res.data)
        } catch (error) {
            console.log(error);
        }

    }

    const sendmessage = async (e) => {
        if (newmessage.trim()) {
            try {
                const message = {
                    sender: user._id,
                    reciver: contactid,
                    message: newmessage
                }

                socket.emit("sendmessage", { room, message })
                setnewmessage("")
                handletyping(false)
            } catch (error) {
                console.log(error);
            }
        }

    }


    const handletyping = (iscurrentlytyping) => {
        clearTimeout(typingtimeout.current);

        if (iscurrentlytyping && !istyping) {
            socket.emit("singletypingstart", room)
            setistyping(true)
        } else if (!iscurrentlytyping && istyping) {
            socket.emit("singletypingstop", room)
            setistyping(false)
        }


        if (iscurrentlytyping) {
            typingtimeout.current = setTimeout(() => {
                handletyping(false)
            }, 2000);
        }
    }


      useEffect(() => {
            clearTimeout(typingtimeout.current)
        },[])

    return (
        <div className='p-6 flex flex-col h-screen'>
            <h1 className='text-2xl font-bold mb-6'>Chat</h1>
            <div className='mb-4 flex-1 overflow-y-auto'>
                {
                    messages.map((msg) => (
                        <div key={msg._id} className={`mb-2 ${msg.sender === user._id ? "text-right" : "text-left"}`}>
                            <div className={`inline-block p-2 rounded-lg ${msg.sender === user._id ? "bg-blue-500 text-white" : "bg-gray-200"}`}>
                                {msg.message}
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
                            typingusers.length === 1 ? `typing...` : ``
                        }
                     </span>
                </div>
            )
        }

            <div className='sticky bottom-0 pt-4 pb-6 bg-white'>
                <div className='flex '>
                    <Input autoFocus value={newmessage} placeholder="Type a message..." className="mr-4" onChange={(e) => {
                        setnewmessage(e.target.value)
                        handletyping(e.target.value.length > 0)
                    }}
                        onKeyPress={(e) => e.key === "Enter" && sendmessage()}

                        onBlur={() => {
                            handletyping(false)
                        }}

                    />
                    <Button onClick={sendmessage}>Send</Button>
                </div>
            </div>


        </div>
    );
}

export default Chat;