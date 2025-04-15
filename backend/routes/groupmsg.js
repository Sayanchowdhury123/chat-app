const express = require("express");
const Message = require("../models/Message");
const auth = require("../middleware/authmiddleware");
const User = require("../models/User");
const Group = require("../models/Groupchats");
const Groupmsg = require("../models/Groupmessages");
const router = express.Router();


router.get("/:groupid/messages", auth,async (req,res) => {
    try {
          const ismember = Group.exists({
            _id: req.params.groupid,
            members: req.user.id
          })
          
          if(!ismember){
            throw new Error("user not in group")
        }

        const messages = await Groupmsg.find({
            group: req.params.groupid
        }).populate("sender", "username").sort({timestamp: 1});


        res.json(messages)
    } catch (error) {
        return res.status(500).json({error: error})
    }
})


router.delete("/:messageid", auth, async (req,res) => {
  try {
          await Groupmsg.findByIdAndDelete(req.params.messageid)
      } catch (error) {
          console.log(error);
          res.status(500).send("server error")  
        
      }
})



router.put("/:messageid", auth, async (req,res) => {
    console.log(req.params.messageid,req.body.edittext);
    const edittext = req.body.edittext;
    try {
        const updatedmsg = await Groupmsg.findByIdAndUpdate(req.params.messageid, {$set: {message: edittext}}, {new:true}).populate("sender", "username").sort({timestamp: 1});
        res.json(updatedmsg)

    } catch (error) {
        console.log(error);
        res.status(500).send("server error") 
    }
})





module.exports = router;

