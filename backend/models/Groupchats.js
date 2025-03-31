const mongoose = require("mongoose");

const groupschema = new mongoose.Schema({
    name:{type:String,required:true},
    admin: {type:mongoose.Schema.Types.ObjectId, ref:"User"},
    members: [{type:mongoose.Schema.Types.ObjectId, ref:"User"}],
    createdat: {type: Date, default: Date.now}
})


module.exports = mongoose.model("Group", groupschema);

