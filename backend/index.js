const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const {Server} = require("socket.io");
const http = require("http");
const connectdb = require("./config/db");
const Message = require("./models/Message");
const Groupmessages = require("./models/Groupmessages");
const { JsonWebTokenError } = require("jsonwebtoken");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Group = require("./models/Groupchats");
const path = require("path");
const { arrayBuffer } = require("stream/consumers");


dotenv.config();
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors:{
        origin:"*",
        methods:["GET","POST"]
    }
})


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));


connectdb();



app.use("/api/auth", require("./routes/auth"));
app.use("/api/contacts", require("./routes/contact"));
app.use("/api/messages", require("./routes/message"));
app.use("/api/groups", require("./routes/groups"))
app.use("/api/groupmsg" , require("./routes/groupmsg"))

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

io.on("connection", (socket) => {
    console.log("user connected");
  

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
   

    socket.on("joinroom", (room) => {
        socket.join(room)
        console.log(`user ${socket.id} joined room ${room}`);
    })

    socket.on("joingroup", (groupid) => {
        socket.join(`group_${groupid}`)
    })

    socket.on("leavegroup", (groupid) => {
        socket.leave(`group_${groupid}`)
    })

    socket.on("sendmessage",async ({room,message}) => {
        try {
            const newmessage = new Message({
                sender: message.sender,
                reciver: message.reciver,
                message: message.message
            })
  
            await newmessage.save();
            

           
        io.to(room).emit("recivemessage", newmessage);
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

            io.to(`group_${groupid}`).emit("recivegroupmessage", populatedmsg)

        } catch (error) {
            console.log(error);
        }
    })

    socket.on("leaveroom", (room) => {
        socket.leave(room)
        console.log(`user ${socket.id} left room ${room}`);
    })

   

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

