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


module.exports = router;

