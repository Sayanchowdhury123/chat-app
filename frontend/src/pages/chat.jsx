import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Authcontext, useAuth } from '@/context/authcontext';
import { useSocket } from '@/context/socketcontext';
import axios from 'axios';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from "../api";
import { FaPaperclip, FaTimes, FaCheck, FaCheckDouble, FaFilePdf, FaRegFilePdf } from "react-icons/fa"



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
    const [readrecipts, setreadrecipts] = useState({})
    const msgendref = useRef(null)
    const [file, setfile] = useState(null)
    const [filepreview, setfilepreview] = useState(null)
    const fileinputref = useRef(null)
    const max_size = 10 * 1024 * 1024;
    const room = [user._id, contactid].sort().join('_');
    const [isuploading, setisuploading] = useState(false)

    useEffect(() => {


        const fetchmessages = async () => {
            try {
                const res = await api.get(`/messages/${contactid}`);
                setmessages(res.data)
                console.log(user._id);

            } catch (error) {
                console.log(error);
            }

        }

        fetchmessages();

        //read recipt
        socket.on("readupdate", ({ messageid, readby }) => {
            setreadrecipts(prev => ({ ...prev, [messageid]: readby }))
        })




        socket.emit("joinroom", room);

        socket.on("singleusertyping", ({ userids }) => {
            settypingusers(userids)
        })



        socket.on("recivemessage", (message) => {
            setmessages((prev) => [...prev, message])
        })




        return () => {
            socket.emit("leaveroom", room)
            socket.off("recivemessage")
            socket.off("singleusertyping")
            socket.off("readupdate")
        }
    }, [contactid])

    useEffect(() => {

        messageendref.current?.scrollIntoView({ behavior: "smooth" })

    }, [messages, typingusers])




    useEffect(() => {


        const unreadmessages = messages.filter(msg => msg.sender !== user._id && !readrecipts[msg._id]?.includes(user._id))
        if (unreadmessages.length > 0) {
            socket.emit("markasread", {
                messageids: unreadmessages.map((msg) => msg._id),
                readerid: user._id,
                room
            })
        }

    }, [messages, readrecipts, room, user._id, socket])




    const renderreadstatus = (message) => {
        if (message.sender !== user._id) return null;
        const isread = readrecipts[message._id]?.length > 0;

        return (
            <div className='flex items-center justify-end mt-1 space-x-1'>
                <span className='text-xs text-gray-500'>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {isread ? (
                    <FaCheckDouble className='text-xs text-blue-500' />
                ) : (
                    <FaCheck className='text-xs text-gray-400' />
                )}
            </div>
        )
    }



    const sendmessage = async () => {
        if (!newmessage.trim() && !file) return;

        if (file) {
            uploadfile()
        } else {
            const message = {
                sender: user._id,
                reciver: contactid,
                message: newmessage
            }

            socket.emit("sendmessage", { room, message })
            setnewmessage("")
            handletyping(false)
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
    }, [])




    const handlefilechange = (e) => {
        const selectedfile = e.target.files[0];
        if (!selectedfile) return;

        if (selectedfile.size > max_size) {
            alert("file size exceeds 10Mb")
            return;
        }
        setfile(selectedfile)


        if (selectedfile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => setfilepreview(reader.result)
            reader.readAsDataURL(selectedfile)
        } else if (selectedfile.type.startsWith('video/')) {
            setfilepreview(URL.createObjectURL(selectedfile))
        }

    }

    const clearfile = () => {
        setfile(null)
        setfilepreview(null)
        if (fileinputref.current) fileinputref.current.value = '';

    }

    const uploadfile = async () => {
        if (!file) return;

        setisuploading(true)

        try {
            const formdata = new FormData();
            formdata.append("file", file)
            formdata.append("userid", user._id)
            formdata.append("room", room)
            formdata.append("contactid", contactid)

         const res =   await api.post('/upload', formdata, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            })

            console.log(res.data);

            clearfile()
        } catch (error) {
            console.log("upload failed", error);
        } finally {
            setisuploading(false)
        }

    }


    const renderfilemessage = (message) => {
        const file = message.filetype;
        if (!file) return null;

        if (file.startsWith('image/')) {
            return (
                <div className='max-w-xs md:max-w-md'>
                    <img src={`uploads\${message.filepath}`} alt={message.filename} className='rounded-lg shadow-sm' />
                    {renderreadstatus(message)}
                </div>
            )
        }

        if (file.startsWith('video/')) {
            return (
                <div className='max-w-xs md:max-w-md'>
                    <video controls className='rounded-lg shadow-sm' >
                        <source src={`/uploads/${message.filepath}`} type={message.filetype} />
                    </video>
                    {renderreadstatus(message)}
                </div>
            )
        }

        return (
            <div className='max-w-xs p-3 bg-gray-100 rounded-lg shadow-sm'>
                <a href={`/uploads/${message.filepath}`} download={message.filename} className='flex items-center space-x-2' >
                    <div className='p-2 bg-white rounded'>
                        {file.includes('pdf') ? (<FaFilePdf className='text-xs' />) : (<FaRegFilePdf className='text-xs' />)}
                    </div>
                    <div>
                        <p className='font-medium truncate'>{message.filename}</p>
                        <p className='text-xs text-gray-500'>
                            {(message.filesize / 1024 / 1024).toFixed(2)}MB
                        </p>
                    </div>
                </a>
                {renderreadstatus(message)}
            </div>
        )
    }


    const rendertextmessage = (message) => {
        return (
        
            <div className={`inline-block p-2 rounded-lg ${message.sender === user._id ? "bg-blue-500 text-white" : "bg-gray-200"}`}>
                <p>{message.message}</p>
                {renderreadstatus(message)}
            </div>
        
        )
    }




    return (
        <div className=' flex flex-col h-screen p-6'>
          

            <div className='flex-1 overflow-y-auto pb-4 space-y-3 ' ref={msgendref}>
                {
                    messages.map((message) => (
                        <div key={message._id} className={`flex ${message.sender === user._id ? "justify-end":"justify-start"}`}>
                              
                        {   message.file ? renderfilemessage(message) : rendertextmessage(message) }
                        </div>


                    ))}
                <div ref={messageendref} />
            </div>

            {
                filepreview && (
                    <div className='relative p-4 bg-gray-50 border-t'>
                        <button onClick={clearfile} className='absolute top-2 right-2 p-1 text-gray-500 hover:text-red-500'>
                            <FaTimes />
                        </button>

                        {file.type.startsWith('image/') ? (
                            <img src={filepreview} alt="preview" className='h-32 rounded' />
                        ) : file.type.startsWith('video/') ? (
                            <video className='h-32 rounded'>
                                <source src={filepreview} type={file.type} />
                            </video>
                        ) : (
                            <div className='flex items-center p-2 bg-white rounded border'>
                                <div className='text-2xl mr-2'>
                                    {file.type.includes('pdf') ? (<FaFilePdf className='text-xs' />) : (<FaRegFilePdf className='text-xs' />)}
                                </div>
                                <div>
                                    <p className='font-medium'>{file.name}</p>
                                    <p className='text-xs text-gray-500'>{(file.size / 1024 / 1024).toFixed(2)}MB</p>
                                </div>
                            </div>

                        )
                        }
                    </div>
                )
            }





            {
                typingusers.length > 0 && (
                    <div className='flex items-center p-2 text-gray-500 italic'>
                        <div className='flex space-x-1 mr-2'>
                            {
                                [0, 1, 2].map((i) => (
                                    <div key={i} className='typing-dot'
                                        style={{ animationDelay: `${i * 0.2}s` }}
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


            <div className='p-4 bg-white border-t'>

                <div className='flex items-center space-x-2'>

                    <input type="file" ref={fileinputref} onChange={handlefilechange} accept="image/*,video/*,.pdf,.doc,docx" className="hidden" id="file-upload" />
                    <label htmlFor="file-upload" className='p-2 text-gray-500 rounded-full hover:bg-gray-100 cursor-pointer'>
                        <FaPaperclip />
                    </label>


                    <Input autoFocus value={newmessage} placeholder="Type a message..." className="mr-4" onChange={(e) => {
                        setnewmessage(e.target.value)
                        handletyping(e.target.value.length > 0)
                    }}
                        onKeyPress={(e) => e.key === "Enter" && sendmessage()}

                        onBlur={() => {
                            handletyping(false)
                        }}

                    />
                    <Button onClick={sendmessage} disabled={(!newmessage && !file) || isuploading}>
                        {isuploading ? "Sending..." : "Send"}
                    </Button>
                </div>
            </div>


        </div>
    );
}

export default Chat;