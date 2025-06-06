import { useAuth } from '@/context/authcontext';
import { useSocket } from '@/context/socketcontext';
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from "../api";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FaPaperclip, FaTimes, FaCheck, FaCheckDouble, FaFilePdf, FaRegFilePdf } from "react-icons/fa"
import EmojiPicker from 'emoji-picker-react';
import { IoMdSearch } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { FaEdit } from "react-icons/fa";
import { Textarea } from '@/components/ui/textarea';
import { MdCancel } from "react-icons/md";
import { Tooltip } from '@mui/material';
import toast from 'react-hot-toast';

function Groupchat() {
    const { groupid } = useParams();
    const { user } = useAuth();
    const socket = useSocket();
    const [messages, setmessages] = useState([]);
    const [newmessage, setnewmessage] = useState("");
    const [group, setgroup] = useState(null);
    const messageendref = useRef(null);
    const [typingusers, settypingusers] = useState([]);
    const [istyping, setistyping] = useState(false)
    const typingtimeout = useRef(null);
    const [readrecipts, setreadrecipts] = useState({})
    const [file, setfile] = useState(null)
    const [filepreview, setfilepreview] = useState(null)
    const fileinputref = useRef(null)
    const max_size = 10 * 1024 * 1024;
    const [selectedmsg, setselectedmsg] = useState(null)
    const emojiPickerref = useRef()
    const [showemojipicker, setshowemojipicker] = useState(false)
    const [searchtext, setsearchtext] = useState("");
    const [searchedmsg, setseachedmsg] = useState([]);
    const [isactive, setisactive] = useState(false)
    const [del, setdel] = useState(false)
    let clicktimeout = null;
    const [edittext, setedittext] = useState("");
    const [showedit, setshowedit] = useState(false)
    const [editbox, seteditbox] = useState(false)
    const [showcancel, setshowcancel] = useState(false)
    const [editfile, seteditfile] = useState(null)
    const [filechange, setfilechange] = useState(false)


    useEffect(() => {
        if (!editfile) return;
        changingfile();
        toast.success("File Edited")

    }, [editfile])


    useEffect(() => {

        socket.on("receive-file-grp", (updatedfile) => {
            setmessages(prev => prev.map((msg) => msg._id?.toString() === updatedfile?._id ? updatedfile : msg))
        })

        socket.on("receive-putmsg-grp", (textupdated) => {
            setmessages(prev => prev.map((msg) => msg._id?.toString() === textupdated?._id ? textupdated : msg))
        })

        socket.on("del-grp", (messageid) => {
            setmessages(prev => prev.filter((msg) => msg._id?.toString() !== messageid))
        })


        return () => {
            socket.off("receive-file-grp")
            socket.off("receive-putmsg-grp")
            socket.off("del-grp")
        }
    }, [])

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


    


      


        socket.on("usertyping", ({ userids }) => {
            settypingusers(userids)
        })

        socket.emit("joingroup", groupid)

        socket.on("recivegroupmessage", handlenewmessage);

        socket.on("messageupdatedgroup", (updatedmessage) => {

            setmessages(prev => prev.map(msg => msg._id?.toString() === updatedmessage._id?.toString() ? { ...msg, reactions: updatedmessage.reactions || [] } : msg))


        })

        return () => {
            socket.emit("leavegroup", groupid)
            socket.off("recivegroupmessage")
            socket.off("usertyping")

            socket.off("messageupdatedgroup")

        }

    }, [groupid, socket, user._id])

    useEffect(() => {
        //read recipt
        socket.on("readupdategroup", (updatedmessages) => {
            console.log(updatedmessages);
            setmessages(prev => prev.map(msg => {
                const updatedmsg = updatedmessages.find(u._id?.toString() === msg._id?.toString())
                return updatedmsg || msg
            }))


        })

        return () => {
            socket.off("readupdategroup")
        }
    }, [])


    useEffect(() => {

        const unreadmessageids = messages.filter(msg => !msg.read && msg.sender._id?.toString() !== user._id).map(msg => msg._id?.toString())

        if (unreadmessageids.length > 0 && socket) {
            socket.emit("markasread-group", {
                messageids: unreadmessageids,
                groupid
            })
        }

    }, [messages, groupid, user._id])


    const renderreadstatus = (message) => {
        if (message.sender._id?.toString() !== user._id) return null;



        return (
            <div className='text-right mt-1'>
                <span className={`text-xs ${message.read ? "text-green-500 font-medium" : "text-gray-400"}`}>
                    {message.read ? "Seen" : "Sent"}
                </span>
            </div>
        )
    }


    useEffect(() => {
        clearTimeout(typingtimeout.current)
    }, [])

    const handlenewmessage = (message) => {
        setmessages(prev => [...prev, message])
    }

    const sendmessage = () => {

        if (!newmessage.trim() && !file) return;

        if (file) {
            uploadfile()
            setfilepreview(null)

        } else {


            socket.emit("sendgroupmessage", {
                groupid,
                message: newmessage,
                sender: user._id
            })
            setnewmessage("")
            handletyping(false)
        }
    }

    useEffect(() => {
        messageendref.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, typingusers])

    const handletyping = (iscurrentlytyping) => {
        clearTimeout(typingtimeout.current);

        if (iscurrentlytyping && !istyping) {
            socket.emit("typingstart", groupid)
            setistyping(true)
        } else if (!iscurrentlytyping && istyping) {
            socket.emit("typingstop", groupid)
            setistyping(false)
        }


        if (iscurrentlytyping) {
            typingtimeout.current = setTimeout(() => {
                handletyping(false)
            }, 2000);
        }
    }

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
        seteditfile(null)
        setselectedmsg(null)
        setshowcancel(false)
        setshowedit(false)
        setdel(false)
        setfilechange(false)

        if (fileinputref.current) fileinputref.current.value = '';

    }


    const uploadfile = async () => {
        if (!file) return;



        try {
            const formdata = new FormData();
            formdata.append("file", file)
            formdata.append("userid", user._id)
            formdata.append("groupid", groupid)
            // formdata.append("contactid", contactid)

            const res = await api.post('/upload/group', formdata, {
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
        //console.log(message);
        if (!file) return null;

        if (file.type?.startsWith('image/')) {
            return (
                <div className='max-w-xs md:max-w-md'>
                    <p className={`text-sm font-medium`}>
                        {message.sender._id?.toString() === user._id ? "you" : message.sender.username}
                    </p>
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
                    <p className={`text-sm font-medium`}>
                        {message.sender._id?.toString() === user._id ? "you" : message.sender.username}
                    </p>
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
                <p className={`text-sm font-medium`}>
                    {message.sender._id?.toString() === user._id ? "you" : message.sender.username}
                </p>
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

    const rendertextmessage = (message) => {
        return (

            <div className={`inline-block p-2 rounded-lg ${message.sender._id?.toString() === user._id ? "bg-blue-500 text-white" : "bg-gray-200"}`}>
                <p className={`text-sm font-medium`}>
                    {message.sender._id?.toString() === user._id ? "you" : message.sender.username}
                </p>
                <p>{message.message}</p>

                <p className='text-xs opacity-70 mt-1'>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>

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
        setdel(false)
        setshowedit(false)
        setshowcancel(false)
    }

    const hamdleemojiclick = (emojidata) => {
        if (selectedmsg) {

            socket.emit("addreactiongroup", {
                messageid: selectedmsg,
                emoji: emojidata.emoji,
                userid: user._id,
                groupid
            })

        }
        setshowemojipicker(false)
        //fetchmessages()

    }

    const search = async (text) => {
        try {
            setsearchtext(text)
            if (text.trim() === "") {
                setseachedmsg([])
            } else {
                const res = await api.get(`/search/group`, { params: { q: text.trim() || undefined } })
                //  setmessages(res.data)
                setseachedmsg(res.data)

            }


        } catch (error) {
            console.log(error);
        }
    }

    const handledel = (messageid) => {
        setselectedmsg(messageid)
        setdel(true)
    }

    const msgdelete = async (messageid) => {
        toast.success("Message Deleted")
        socket.emit("del-msg-grp", { groupid, messageid })
        setmessages(prev => prev.filter((msg) => msg._id !== messageid))
        await api.delete(`/groupmsg/${messageid}`)

        setdel(false)
    }

    const handleclick = (messagesid) => {
        if (clicktimeout !== null) {
            clearTimeout(clicktimeout)
            clicktimeout = null;
            handledoubleclick(messagesid)
        } else {
            clicktimeout = setTimeout(() => {
                handledel(messagesid)
                handledit(messagesid)
                handlecancel(messagesid)
                clicktimeout = null;

            }, 250);
        }
    }

    const handlecancel = (messageid) => {
        setselectedmsg(messageid)
        setshowcancel(true)
    }

    const handledit = (messageid) => {
        setselectedmsg(messageid)
        setshowedit(true)

    }

    const msgedit = async (messageid) => {
        const upsatedmsg = await api.put(`/groupmsg/${messageid}`, { edittext })
        const textupdated = upsatedmsg.data;
        socket.emit("send-putmsg-grp", { groupid, textupdated })
        setmessages(prev => prev.map((msg) => msg._id?.toString() === upsatedmsg.data?._id?.toString() ? upsatedmsg.data : msg))
        setshowedit(false)
        setedittext("")
        seteditbox(false)
        setdel(false)
        setshowcancel(false)
         toast.success("Message Edited")


    }


    const handlechangedfile = (e) => {
        console.log("changed file");
        const selectedfile = e.target.files[0];
        if (!selectedfile) return;

        if (selectedfile.size > max_size) {
            alert("file size exceeds 10Mb")
            return;
        }
        seteditfile(selectedfile)


    }


    const changingfile = async () => {
        if (!editfile) return;

        try {
            const formdata = new FormData();
            formdata.append("file", editfile)
            formdata.append("messageid", selectedmsg)
            console.log(formdata);

            const res = await api.put('/upload/grp', formdata)
            const updatedfile = res.data;
            socket.emit("send-file-grp", { groupid, updatedfile })
            setmessages(prev => prev.map((msg) => msg._id?.toString() === selectedmsg ? res.data : msg))
          

            clearfile()
        } catch (error) {
            console.log("upload failed", error);
        }

    }


    return (
        <div className=' flex flex-col h-screen'>
            <div className='p-4 border-b'>
                <h1 className='text-xl font-bold '>{group?.name}</h1>
                <p className='text-sm text-gray-500'>{group?.members?.length} members</p>

            </div>

            <Input type={Text} className="w-[600px] mx-auto mt-2 " onChange={(e) => {
                search(e.target.value)
            }} value={searchtext} placeholder="Search Group Messages" />

            <IoMdSearch className="text-2xl relative left-[1023px] bottom-[30px]" />


            <div className={`flex-1 overflow-y-auto p-4 space-y-4  ${editbox ? "backdrop: blur-sm" : ""} transition-all `} style={{ scrollbarWidth: "none" }} >
                {
                    (searchtext ? searchedmsg : messages).map((message) => (

                        <div key={message._id} className={`flex ${message.sender._id?.toString() === user._id ? "justify-end" : "justify-start"} transition-all`}
                            onClick={() => handleclick(message._id?.toString())}
                            ref={emojiPickerref}
                        >

                            {message.file ? renderfilemessage(message) : rendertextmessage(message)}


                            {
                                showemojipicker && selectedmsg === message._id?.toString() && (
                                    <div className='absolute bottom-[11%] mb-4   z-10 shadow-lg'>
                                        <EmojiPicker onEmojiClick={hamdleemojiclick} width={300} height={350} previewConfig={{ showPreview: false }} />
                                    </div>
                                )
                            }


                            <div className={`flex flex-col relative gap-3 mr-2 left-1 ${message.file ? "relative top-5" : "top-1"}`}>



                                {
                                    del && selectedmsg === message._id?.toString() && message.sender._id?.toString() === user._id && (
                                        <Tooltip title="Delete" placement='left'>
                                            <MdDelete onClick={() => msgdelete(message._id?.toString())} className='relative  transition-all ' />
                                        </Tooltip>

                                    )
                                }


                                {
                                    showedit && message.sender._id?.toString() === user._id && selectedmsg === message._id?.toString() && message.message && (
                                        <Tooltip title="Edit" placement='left'>
                                            <FaEdit className='relative left-[2px]   transition-all ' onClick={() => seteditbox(true)} />
                                        </Tooltip>

                                    )
                                }


                                {
                                    showedit && message.sender._id?.toString() === user._id && selectedmsg === message._id?.toString() && message.file && (

                                        <Tooltip title="Edit file" placement='left'>
                                            <FaEdit className='relative left-[2px]    transition-all ' onClick={() => {
                                                fileinputref.current.click()
                                                setfilechange(true)
                                                setselectedmsg(message._id?.toString())
                                            }} />
                                        </Tooltip>

                                    )
                                }


                                {
                                    showcancel && selectedmsg === message._id?.toString() && message.sender._id?.toString() === user._id && (
                                        <Tooltip title="Cancel" placement='left'>
                                            <MdCancel onClick={(e) => {
                                                e.stopPropagation()
                                                setselectedmsg(null)
                                                setdel(false)
                                                setshowedit(false)
                                                setshowcancel(false)

                                            }}

                                                className='relative    transition-all ' />
                                        </Tooltip>

                                    )
                                }
                            </div>

                        </div>

                    ))}
                <div ref={messageendref} />
            </div>



            {
                editbox && (
                    <div className='flex justify-center'>
                        <div className='z-100 relative bottom-62 ' >
                            <Textarea onChange={(e) => setedittext(e.target.value)} value={edittext} placeholder="Enter text..." className=" w-80 h-40 bg-white " />
                            <Button onClick={() => msgedit(selectedmsg)} className="mt-2" >Edit</Button>
                            <Button onClick={() => {
                                seteditbox(false)
                                setdel(false)
                                setshowedit(false)
                                setedittext("")
                                setshowcancel(false)
                            }} className="ml-2" >Cancel</Button>
                        </div>
                    </div>

                )
            }

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
                                typingusers.length === 1 ? `someone is typing...` : `${typingusers.length} people typing...`
                            }
                        </span>
                    </div>
                )
            }



            <div className='p-4 bg-white border-t'>
                <div className='flex items-center space-x-2'>

                    <input type="file" ref={fileinputref} onChange={filechange ? handlechangedfile : handlefilechange} accept="image/*,video/*,.pdf,.doc,docx" className="hidden" id="file-upload" />
                    <label htmlFor="file-upload" className='p-2 text-gray-500 rounded-full hover:bg-gray-100 cursor-pointer'>
                        <FaPaperclip />
                    </label>


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