const mongoose = require("mongoose");

const messageschema = new mongoose.Schema({
    sender:{type: mongoose.Schema.Types.ObjectId, ref:"User",required:true },
    reciver:{type: mongoose.Schema.Types.ObjectId, ref:"User",required:true },
   message:{type:String, required:true},
   timestamp: {type:Date,default: Date.now},
   read:{type:Boolean, default:false}
})


module.exports = mongoose.model("Message", messageschema)