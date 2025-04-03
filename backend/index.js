const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const http = require("http");
const connectdb = require("./config/db");
const Message = require("./models/Message");
const Groupmessages = require("./models/Groupmessages");
const { JsonWebTokenError } = require("jsonwebtoken");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Group = require("./models/Groupchats");
const path = require("path");
const multer = require("multer");
const socketio = require("socket.io")
const auth = require("./middleware/authmiddleware")



dotenv.config();
const app = express();
const server = http.createServer(app);

const io = socketio(server, {
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

const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req,file,cb) => {
        cb(null, `${Date.now()}-${file.originalname}`)
    }
})

const fileFilter = (req,file,cb) => {
    const allowedtypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/wbbp",

    ];

    cb(null, allowedtypes.includes(file.mimetype))
}

const upload = multer({
    storage,
    fileFilter,
    limits:{fileSize: 10 * 1024 * 1024}
})



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
            
                filename: req.file.originalname,
                filepath: req.file.filename,
                filetype: req.file.mimetype,
                filesize: req.file.size
        
           

        })

        const savedmessage = await message.save();
         res.json(savedmessage)
        io.to(req.body.room).emit("recivemessage", savedmessage)
        
    } catch (error) {
        console.log(error);
        res.status(400).json({error: error})
    }
} )


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

io.on("connection", (socket) => {
    console.log("user connected");

//read recipt
socket.on("markasread",  ({messageids,readerid,room}) => {
  console.log(messageids)
    messageids.forEach((messageid) => {
        if(!readrecipts.has(messageid)){
            readrecipts.set(messageid, new Set())
        }
        readrecipts.get(messageid).add(readerid)
    
        io.to(room).emit("readupdate", {
           messageid,
           readby: Array.from( readrecipts.get(messageid))
        })

        
    })

   
})

//read recipt group
socket.on("markasread-group",  ({messageids,readerid,groupid}) => {
    
      messageids.forEach((messageid) => {
          if(!readreciptsgroup.has(messageid)){
              readreciptsgroup.set(messageid, new Set())
          }
          readreciptsgroup.get(messageid).add(readerid)
      
          io.to(`group_${groupid}`).emit("readupdate-group", {
             messageid,
             readby: Array.from( readreciptsgroup.get(messageid))
          })

           
      })
  
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

