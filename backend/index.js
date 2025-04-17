const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const http = require("http");
const connectdb = require("./config/db");
const Message = require("./models/Message")
const Groupmessages = require("./models/Groupmessages");
const { JsonWebTokenError } = require("jsonwebtoken");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Group = require("./models/Groupchats");
const path = require("path");
const multer = require("multer");
const {Server} = require("socket.io")
const auth = require("./middleware/authmiddleware")
const upload = require("./middleware/uploadimage");
const { timeStamp } = require("console");


dotenv.config();
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors:{
        origin:"*",
        methods:["GET","POST"]
    }
})


app.use(cors({
    origin: true,
    credentials: true,
    methods:["GET","POST","PUT","DELETE","OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]

}));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use("/uploads", express.static(path.join(__dirname,"uploads")));
 //app.use("/uploads", express.static("uploads"))

connectdb();





app.use("/api/auth", require("./routes/auth"));
app.use("/api/contacts", require("./routes/contact"));
app.use("/api/messages", require("./routes/message"));
app.use("/api/groups", require("./routes/groups"))
app.use("/api/groupmsg" , require("./routes/groupmsg"))


app.post("/api/upload", upload.single("file"),async (req,res) => {
    try {
        if(!req.file){
            return res.status(400).json({msg:"invalid file type"})
        }

       

        const message = new Message({
            sender: req.body.userid,
            reciver: req.body.contactid,
              file:{
                name: req.file.originalname,
                path: req.file.path,
                type: req.file.mimetype,
                size: req.file.size
            } 

        })


        const savedmessage = await message.save();
         
        io.to(req.body.room).emit("recivemessage", savedmessage)
        
        
    } catch (error) {
        console.log(error);
        res.status(400).json({error: error})
    }
} )

app.put("/api/upload", upload.single("file"),async (req,res) => {
    try {
        
      if(!req.file){
        res.status(4000).json({error: "no file recived"})
      }
       const updatedfile = await Message.findByIdAndUpdate(req.body.messageid,
        {$set: 
            {file: {
            name:req.file.originalname,
            path: req.file.path,
            type: req.file.mimetype,
            size: req.file.size
        }
    }},
         {new: true}  )

           
       res.json(updatedfile)
    
        
    } catch (error) {
        console.log(error);
        res.status(400).json({error: error})
    }
} )






app.post("/api/upload/group", upload.single("file"),async (req,res) => {
    try {
        if(!req.file){
            return res.status(400).json({msg:"invalid file type"})
        }

    
        const newmessage = new Groupmessages({
        
            group: req.body.groupid,
            sender: req.body.userid,
            file:{
                name: req.file.originalname,
                path: req.file.path,
                type: req.file.mimetype,
                size: req.file.size
            } 
        })

        await newmessage.save()
        const populatedmsg = await Groupmessages.populate(newmessage,{ path:"sender", select: "username"})

        io.to(`group_${req.body.groupid}`).emit("recivegroupmessage", populatedmsg)
        
    } catch (error) {
        console.log(error);
        res.status(400).json({error: error})
    }
} )

//search group

app.get("/api/search/group",auth,async (req,res) => {
    const userid = req.user.id;
    
    try {

        const usergroups = await Group.find({members: userid}).select("_id")

        
       
        const result = await Groupmessages.find({
            $and:[
                {
                    $or: [
                        {message: {$regex: req.query.q, $options: "i" }}
                    ]
                },
                {
                    $or: [
                        {sender: userid},
                        {group: {$in: usergroups.map(g => g._id)}}
                    ]
                }
            ]
        }).populate({path: "sender", select: "username"}).sort({timestap: -1})
     
        res.json(result)
    } catch (error) {
        console.log(error);
        res.status(500).json({msg:"error seraching"})
    }
})





io.use(async (socket,next) => {
    try {
        const token = socket.handshake.auth.token;
        if(!token) throw new Error("no token provided")

            const decoded = jwt.verify(token,process.env.TOKEN);
              socket.userid = decoded.user.id;
                next();

    } catch (error) {
        next(new Error("Auth error"))
    }
})

const typingusers = new Map();
const singletypingusers = new Map();
const onlineusers = new Map();
const readrecipts = new Map();
const readreciptsgroup = new Map();
const activegroups = {};

io.on("connection", (socket) => {
    console.log("user connected");


    //file updating
    socket.on("send-file", ({room,updatedfile}) => {
       io.to(room).emit("receive-file", updatedfile)
    })

    //text updating
    socket.on("send-putmsg", ({room,textupdated}) => {
        io.to(room).emit("receive-putmsg", textupdated)
    })


    //text deleteing
    socket.on("del-msg", ({messageid,room}) => {
        io.to(room).emit("del", messageid)
    })

    //emoji rection
socket.on("addreaction", async ({messageid,emoji,userid}) => {
    try {
        const message = await Message.findById(messageid)

        const reactionindex = message.reactions.findIndex(r => r.emoji === emoji);
        if(reactionindex >= 0){
            if(!message.reactions[reactionindex].userids.includes(userid)){
                message.reactions[reactionindex].userids.push(userid)
            }
        }else{
            message.reactions.push({emoji, userids: [userid]})
        }
    
        const updatedmessage = await message.save()
        const roomname = `${[message.sender,message.reciver].sort().join('_')}`;
        io.to(roomname).emit("messageupdated", updatedmessage)
    } catch (error) {
        console.log(error);
    }
  
} )

//emoji reaction group
socket.on("addreactiongroup", async ({messageid,emoji,userid,groupid}) => {
    try {
        const message = await Groupmessages.findById(messageid)

        const reactionindex = message.reactions.findIndex(r => r.emoji === emoji);
        if(reactionindex >= 0){
            if(!message.reactions[reactionindex].userids.includes(userid)){
                message.reactions[reactionindex].userids.push(userid)
            }
        }else{
            message.reactions.push({emoji, userids: [userid]})
        }
    
        const updatedmessage = await message.save()
       // const roomname = `${[message.sender,message.reciver].sort().join('_')}`;
      // console.log(updatedmessage);
        io.to(`group_${groupid}`).emit("messageupdatedgroup", updatedmessage)
    } catch (error) {
        console.log(error);
    }
  
} )




//read recipt
socket.on("markmessageasread", async   ({messageids,readerid}) => {
  
await Message.updateMany(
    {_id: {$in: messageids}},
    {$set: {read: true}}
)

const messages = await Message.find({_id: {$in: messageids}})
const senderid = messages[0]?.sender;

if(senderid){
    io.to(senderid.toString()).emit("messageread",{
        messageids,
        readerid
    })
}




 //   messageids.forEach( (messageid) => {

   //     if(!readrecipts.has(messageid)){
     //       readrecipts.set(messageid, new Set())
       // }
      //  readrecipts.get(messageid).add(readerid)
    
      //  io.to(room).emit("readupdate", {
          // messageid,
        //   readby: Array.from( readrecipts.get(messageid))
    //    })
    
  // })
})




//online 
  socket.on("set-online", (userid) => {
       onlineusers.set(userid, Date.now());
       io.emit("online-users", Object.fromEntries(onlineusers))
      
  })


  

    socket.on("singletypingstart", (room) => {
        const userid = socket.userid;
        if(!singletypingusers.has(room)){
            singletypingusers.set(room, new Set())
        }
        singletypingusers.get(room).add(userid)
        socket.to(room).emit("singleusertyping", {
            room,
            userids: Array.from(singletypingusers.get(room))
        })

    })


    socket.on("singletypingstop", (room) => {
        const userid = socket.userid;
        if(singletypingusers.has(room)){
            singletypingusers.get(room).delete(userid)
            socket.to(room).emit("singleusertyping", {
                room,
                userids: Array.from(singletypingusers.get(room))
            })
        }
    })



    socket.on("typingstart", (groupid) => {
        const userid = socket.userid;
        if(!typingusers.has(groupid)){
            typingusers.set(groupid, new Set())
        }
        typingusers.get(groupid).add(userid)
        socket.to(`group_${groupid}`).emit("usertyping", {
            groupid,
            userids: Array.from(typingusers.get(groupid))
        })

    })

 


    socket.on("typingstop", (groupid) => {
        const userid = socket.userid;
        if(typingusers.has(groupid)){
            typingusers.get(groupid).delete(userid)
            socket.to(`group_${groupid}`).emit("usertyping", {
                groupid,
                userids: Array.from(typingusers.get(groupid))
            })
        }
    })
   

    socket.on("joinroom", ({userid,otheruserid}) => {
        socket.join(userid)
        socket.join(`${[userid,otheruserid].sort().join('_')}`)
        console.log(`user ${socket.id} joined room ${[userid,otheruserid].sort().join('_')}`);
    })

    socket.on("joingroup", (groupid) => {
        socket.join(`group_${groupid}`)
        activegroups[groupid] = activegroups[groupid] || new Set();
        activegroups[groupid].add(socket.userid)
    })

    socket.on("leavegroup", (groupid) => {
        socket.leave(`group_${groupid}`)
        if(activegroups[groupid]){
            activegroups[groupid].delete(socket.userid)
        }
    })


    //read recipt group
socket.on("markasread-group", async ({messageids,groupid}) => {
   
    const othermembersactive = Array.from(activegroups[groupid] || []).some(id => id !== socket.userid)

   if(othermembersactive){
    await Groupmessages.updateMany(
        {_id: {$in: messageids}},
        { read: true}
    )

    const updatedmessages = await Groupmessages.find({_id: {$in: messageids}}).populate("sender", "username")
     
    io.to(`group_${groupid}`).emit("readupdategroup", updatedmessages)
   }

  })

    socket.on("sendmessage",async ({room,message}) => {
        try {
            const newmessage = new Message({
                sender: message.sender,
                reciver: message.reciver,
                message: message.message
            })
  
            await newmessage.save();
            

           const roomname = `${[message.sender,message.reciver].sort().join('_')}`
        io.to(roomname).emit("recivemessage", newmessage);
        } catch (error) {
            console.log(error);
        }
        
      
       
    })


    socket.on("sendgroupmessage", async ({message,groupid}) => {
        try {
         
        const ismember = await Group.exists({
            _id: groupid,
            members: socket.userid
        })

        if(!ismember){
            throw new Error("user not in group")
        }

            const newmessage = new Groupmessages({
                message,
                group: groupid,
                sender: socket.userid,
            })

            await newmessage.save();
            
            const populatedmsg = await Groupmessages.populate(newmessage,{ path:"sender", select: "username"})
            console.log(populatedmsg);
            io.to(`group_${groupid}`).emit("recivegroupmessage", populatedmsg)

        } catch (error) {
            console.log(error);
        }
    })

    socket.on("leaveroom", ({userid,otheruserid}) => {
        socket.leave(userid)
        socket.leave(`${[userid,otheruserid].sort().join('_')}`)
        console.log(`user ${socket.id} left room ${[userid,otheruserid].sort().join('_')}`);
    })

   
//offline
    socket.on("disconnect", () => {
       console.log("user disconnected", socket.id);
       if(socket.userid){
        onlineusers.delete(socket.userid);
        io.emit("online-users", Object.fromEntries(onlineusers))
        
       }
       
    })
})

const PORT = process.env.PORT;

server.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
})

