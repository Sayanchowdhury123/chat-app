const mongoose = require("mongoose");

const groupmessageschema = new mongoose.Schema({
    message:{type:String,required:true},
    group: {type:mongoose.Schema.Types.ObjectId, ref:"Group",required:true},
    sender: {type:mongoose.Schema.Types.ObjectId, ref:"User"},
    timestamp: {type: Date, default: Date.now}
})


module.exports = mongoose.model("Groupmessage", groupmessageschema)