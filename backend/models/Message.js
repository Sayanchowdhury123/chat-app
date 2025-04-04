
const mongoose = require("mongoose");

const messageschema = new mongoose.Schema({
    sender:{type: mongoose.Schema.Types.ObjectId, ref:"User",required:true },
    reciver:{type: mongoose.Schema.Types.ObjectId, ref:"User" },
   message:{type:String},
   timestamp: {type:Date,default: Date.now},
   read:{type:Boolean, default:false},
    file:{
        name: {type:String},
        type: {type:String},
        path: {type:String},
        size: {type:Number},

    }
})


module.exports = mongoose.model("Message", messageschema)