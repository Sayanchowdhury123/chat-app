
const mongoose = require("mongoose");

const messageschema = new mongoose.Schema({
    sender:{type: mongoose.Schema.Types.ObjectId, ref:"User",required:true },
    reciver:{type: mongoose.Schema.Types.ObjectId, ref:"User" },
   message:{type:String},
   timestamp: {type:Date,default: Date.now},
   read:{type:Boolean, default:false},
    filename: {type:String},
    filepath:{type:String},
    filetype:{type: String},
    filesize:{type:Number}
})


module.exports = mongoose.model("Message", messageschema)