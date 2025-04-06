import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Authcontext, useAuth } from '@/context/authcontext';
import { useSocket } from '@/context/socketcontext';
import axios from 'axios';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from "../api";
import { FaPaperclip, FaTimes, FaCheck, FaCheckDouble, FaFilePdf, FaRegFilePdf } from "react-icons/fa"
import EmojiPicker from 'emoji-picker-react';
import { FaSmile } from 'react-icons/fa';


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
    const room = [user._id, contactid].sort().join('_')
    const [showemojipicker, setshowemojipicker] = useState(false)
    const [loading, setloading] = useState(true)
    const [selectedmsg, setselectedmsg] = useState(null)
    const emojiPickerref = useRef()



    useEffect(() => {


        fetchmessages();
    }, [contactid])


    const fetchmessages = async () => {
        try {
            const res = await api.get(`/messages/${contactid}`);
            setmessages(res.data)


        } catch (error) {
            console.log(error);
        } finally {
            setloading(false)
        }

    }



    const handlenewmessage = (message) => {
        
        setmessages((prev) => [...prev, message])
    }

    const singletyping = ({ userids }) => {
        settypingusers(userids)
    }


    useEffect(() => {

        socket.emit("joinroom", {
            userid: user._id,
            otheruserid: contactid
        });

        socket.on("messageupdated", (updatedmessage) => {
            
            setmessages(prev => prev.map(msg => msg._id === updatedmessage._id ? { ...msg, reactions: updatedmessage.reactions || [] } : msg))


        })

        socket.on("singleusertyping", singletyping)
        socket.on("recivemessage", handlenewmessage)

        return () => {
            socket.emit("leaveroom", {
                userid: user._id,
                otheruserid: contactid
            })
            socket.off("recivemessage")
            socket.off("singleusertyping")
            socket.off("messageupdated")
        }
    }, [contactid, socket, user._id])

    useEffect(() => {

        messageendref.current?.scrollIntoView({ behavior: "smooth" })

    }, [messages.length, typingusers])



    const sendmessage = async () => {
        if (!newmessage.trim() && !file) return;

        if (file) {
            uploadfile()
            setfilepreview(null)

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

        try {
            const formdata = new FormData();
            formdata.append("file", file)
            formdata.append("userid", user._id)
            formdata.append("room", room)
            formdata.append("contactid", contactid)

            const res = await api.post('/upload', formdata, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            })



            clearfile()
        } catch (error) {
            console.log("upload failed", error);
        }

    }


    const renderfilemessage = (message) => {
        const file = message.file;

        if (!file) return null;

        if (file.type?.startsWith('image/')) {
            return (
                <div className='max-w-xs md:max-w-md'>
                    <img src={`http://localhost:5000/${file.path}`} alt={file.name} className='rounded-lg shadow-sm' />
                    <div className='flex items-center justify-end mt-1 space-x-1'>
                        <span className='text-xs text-black '>
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    {message.reactions?.length > 0 && (
                        <div className='flex flex-wrap gap-1 mt-1 justify-end'>
                            {message.reactions?.map((reaction, index) => (
                                <div key={index} className='flex items-center px-2 py-0.5 bg-white bg-opacity-20 rounded-full'>
                                    <span className='text-xs'>{reaction.emoji}</span>
                                    {reaction.userids?.length > 1 && (
                                        <span className='ml-1 text-xs '>{reaction.userids.length}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )
        }

        if (file.type?.startsWith('video/')) {
            return (
                <div className='max-w-xs md:max-w-md'>
                    <video controls className='rounded-lg shadow-sm' >
                        <source src={`http://localhost:5000/${file.path}`} type={file.type} />
                    </video>
                    <div className='flex items-center justify-end mt-1 space-x-1'>
                        <span className='text-xs text-black '>
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    {message.reactions?.length > 0 && (
                        <div className='flex flex-wrap gap-1 mt-1 justify-end'>
                            {message.reactions?.map((reaction, index) => (
                                <div key={index} className='flex items-center px-2 py-0.5 bg-white bg-opacity-20 rounded-full'>
                                    <span className='text-xs'>{reaction.emoji}</span>
                                    {reaction.userids?.length > 1 && (
                                        <span className='ml-1 text-xs '>{reaction.userids.length}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )
        }

        return (
            <div className='max-w-xs p-3 bg-gray-100 rounded-lg shadow-sm'>
                <a href={`http://localhost:5000/${file.path}`} download={message.filename} className='flex items-center space-x-2' >
                    <div className='p-2 bg-white rounded'>
                        {file.type?.includes('pdf') ? (<FaFilePdf className='text-xs' />) : (<FaRegFilePdf className='text-xs' />)}
                    </div>
                    <div>
                        <p className='font-medium truncate'>{message.filename}</p>
                        <p className='text-xs text-gray-500'>
                            {(file?.size / 1024 / 1024).toFixed(2)}MB
                        </p>
                    </div>
                </a>
                <div className='flex items-center justify-end mt-1 space-x-1'>
                    <span className='text-xs text-black '>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                {message.reactions?.length > 0 && (
                    <div className='flex flex-wrap gap-1 mt-1 justify-end'>
                        {message.reactions?.map((reaction, index) => (
                            <div key={index} className='flex items-center px-2 py-0.5 bg-white bg-opacity-20 rounded-full'>
                                <span className='text-xs'>{reaction.emoji}</span>
                                {reaction.userids?.length > 1 && (
                                    <span className='ml-1 text-xs '>{reaction.userids.length}</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )
    }




    const handledoubleclick = (messageid) => {
        setselectedmsg(messageid)
        setshowemojipicker(true)
    }

    const hamdleemojiclick = (emojidata) => {
        if (selectedmsg) {

            socket.emit("addreaction", {
                messageid: selectedmsg,
                emoji: emojidata.emoji,
                userid: user._id
            })

        }
        setshowemojipicker(false)
        //fetchmessages()

    }

    const rendertextmessage = (message) => {
        return (
            <div className={`inline-block p-2 rounded-lg ${message?.sender === user._id ? "bg-blue-500 text-white" : "bg-gray-200"}`}   >
                <p>{message.message}</p>
                <div className='flex items-center justify-end mt-1 space-x-1'>
                    <span className='text-xs text-black '>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                {message.reactions?.length > 0 && (
                    <div className='flex flex-wrap gap-1 mt-1 justify-end'>
                        {message.reactions?.map((reaction, index) => (
                            <div key={index} className='flex items-center px-2 py-0.5 bg-white bg-opacity-20 rounded-full'>
                                <span className='text-xs'>{reaction.emoji}</span>
                                {reaction.userids?.length > 1 && (
                                    <span className='ml-1 text-xs '>{reaction.userids.length}</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

        )
    }
    if (loading) return <div className='p-4'>Loading message...</div>
    return (
        <div className=' flex flex-col h-screen p-6'>


            <div className='flex-1 overflow-y-auto pb-4 space-y-3 ' ref={emojiPickerref} style={{ scrollbarWidth: "none" }}  >
                {
                    messages.map((message) => (
                        <div key={message._id} className={`flex ${message.sender === user._id ? "justify-end" : "justify-start"}`}
                            onDoubleClick={() => handledoubleclick(message._id)}    >

                            {message.file ? renderfilemessage(message) : rendertextmessage(message)}

                            {
                                showemojipicker && selectedmsg === message._id && (
                                    <div className='absolute bottom-[11%] mb-4  right-162 z-10 shadow-lg'>
                                        <EmojiPicker onEmojiClick={hamdleemojiclick} width={300} height={350} previewConfig={{ showPreview: false }} />
                                    </div>
                                )
                            }

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

                        {file.type?.startsWith('image/') ? (
                            <img src={filepreview} alt="preview" className='h-32 rounded' />
                        ) : file.type?.startsWith('video/') ? (
                            <video className='h-32 rounded'>
                                <source src={filepreview} type={file.type} />
                            </video>
                        ) : (
                            <div className='flex items-center p-2 bg-white rounded border'>
                                <div className='text-2xl mr-2'>
                                    {file.type?.includes('pdf') ? (<FaFilePdf className='text-xs' />) : (<FaRegFilePdf className='text-xs' />)}
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
                    <Button onClick={sendmessage} disabled={(!newmessage && !file)}>
                        Send
                    </Button>
                </div>
            </div>




        </div>
    );
}

export default Chat;