const express = require("express");
const bcrypts = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User")
const auth = require("../middleware/authmiddleware");
const router = express.Router();



router.get("/user", auth, async (req,res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if(!user){
            return res.status(404).json({msg:"user not found"})
        }
        res.json(user)
    } catch (error) {
        console.log(error);
        res.status(500).send("server error")
    }
})

router.post("/register", async (req,res) => {
  
    const {username,password} = req.body;

    try {
        let user = await User.findOne({username})

        if(user){
            return res.status(400).json({msg: "user already exists"})
        }

        user = new User({
            username,
            
            password
        })

        const salt = await bcrypts.genSalt(10);
        user.password = await bcrypts.hash(password,salt);

        await user.save();

        const payload = {user: {id: user.id}};
        const token = jwt.sign(payload, process.env.TOKEN, {expiresIn:"1h"});

        res.json({msg:"user registered",token})
        
    } catch (error) {
        res.status(500).send("server error")
        console.log(error);
    }
})



router.post("/login", async (req,res) => {
  
    const {username,password} = req.body;

    try {
        let user = await User.findOne({username})

        if(!user){
            return res.status(400).json({msg: "invalid credentials"})
        }

        const ismatch = await bcrypts.compare(password,user.password)
        if(!ismatch){
            return res.status(400).json({msg: "invalid credentials"})
        }

        const payload = {user: {id: user.id}};
        const token = jwt.sign(payload, process.env.TOKEN, {expiresIn:"1h"});

        res.json({msg:"user is logged in",token})
    } catch (error) {
        res.status(500).send("server error")
        console.log(error);
    }
})




module.exports = router;