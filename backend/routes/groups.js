const express = require("express");
const Message = require("../models/Message");
const auth = require("../middleware/authmiddleware");
const User = require("../models/User");
const Group = require("../models/Groupchats");
const router = express.Router();


router.get("/", auth, async (req,res) => {
    try {
        const groups = await Group.find({
            members: req.user.id
        }).populate("admin", "username").populate("members", "username").sort({createddat: -1})

        res.json(groups)
    } catch (error) {
        res.status(500).json({error: error})
    }
})




router.post("/create", auth, async (req,res) => {
    const {name,memberids} = req.body;
    try {
        const group = new Group({
            name: name,
            members: [...memberids, req.user.id],
            admin: req.user.id
        })

        await group.save();
        res.status(201).json(group)
    } catch (error) {
        res.status(500).json({error: error})
        console.log(error);
    }
})

router.get("/:groupid",auth,async (req,res) => {
    try {
        const group = await Group.findOne({
           _id: req.params.groupid,
           members: req.user.id
        }).populate("admin", "username").populate("members", "username");

        if(!group){
            return res.status(404).json({error:"group not found"})
        }

        res.json(group)
    } catch (error) {
        return res.status(500).json({error: error})
    }
})

router.post("/:groupid/add-members", auth, async (req,res) => {
    const {memberids} = req.body;
    try {
        const group = await Group.findById(req.user.id);
        if(group.admin.toString() !== req.user.id){
            return res.status(403).json({error: "only admin can add members"})
        }
        group.members.push(...memberids);
        await group.save();
        res.json(group)
    } catch (error) {
        res.status(500).json({error: error})
    }
})

module.exports = router;