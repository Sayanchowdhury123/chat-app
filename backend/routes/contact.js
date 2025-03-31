const express = require("express");
const bcrypts = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User")
const auth = require("../middleware/authmiddleware");

const router = express.Router();


router.post("/add",auth,async (req,res) => {
    const {contactusername} = req.body;

    try {
        const user = await User.findById(req.user.id)
        const contact = await User.findOne({username: contactusername});
        if(!contact){
             res.status(400).json({msg:"contact not found"})
        }
      
        if(user.contacts.includes(contact._id)){
            res.status(400).json({msg:"contact already added"})
        }

        user.contacts.push(contact._id)
    

        await user.save();
        res.json({ contact})
        
    } catch (error) {
        res.status(500).send("server error")
        console.log(error);
    }
})



router.get("/",auth, async (req,res) => {
    try {
        const user = await User.findById(req.user.id).populate("contacts", "username ");
        res.json(user.contacts);
        
        
    } catch (error) {
        res.status(500).send("server error")
        console.log(error);
    }
})


module.exports = router;