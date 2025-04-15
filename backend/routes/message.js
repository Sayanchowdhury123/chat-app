const express = require("express");
const Message = require("../models/Message");
const auth = require("../middleware/authmiddleware");
const User = require("../models/User");
const router = express.Router();


router.post("/send", auth ,async(req,res) => {

    const{receiverid,message} = req.body;

    try {

        const sender = await User.findById(req.user.id);
        const reciver = await User.findById(receiverid);
        
         const newmessage = new Message({
            sender: sender._id,
            reciver: reciver._id,
            message,
         })
         await newmessage.save();

         res.json({ newmessage})
    } catch (error) {
        res.status(500).send("server error")
        console.log(error);
    }
})


router.get("/:conatctid", auth,async (req,res) => {
    try {
      const messages = await Message.find({
          $or:[
            {sender: req.user.id, reciver: req.params.conatctid},
            {sender: req.params.conatctid,reciver: req.user.id}
          ]
      }).sort({timesamp: 1})

      res.json(messages)
    } catch (error) {
        res.status(500).send("server error")  
        console.log(error);
    }
})

router.put("/:messageid", auth, async (req,res) => {
    const edittext = req.body.edittext;
    try {
        const updatedmsg = await Message.findByIdAndUpdate(req.params.messageid, {$set: {message: edittext}}, {new:true})
        res.json(updatedmsg)

    } catch (error) {
        console.log(error);
        res.status(500).send("server error") 
    }
})


router.delete("/:messageid", auth, async (req,res) => {
   
    try {
        await Message.findByIdAndDelete(req.params.messageid)
    } catch (error) {
        console.log(error);
        res.status(500).send("server error")  
      
    }
})


module.exports = router;