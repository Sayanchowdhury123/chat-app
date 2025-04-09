const mongoose = require("mongoose");

const groupmessageschema = new mongoose.Schema({
    message:{type:String},
    group: {type:mongoose.Schema.Types.ObjectId, ref:"Group",required:true},
    sender: {type:mongoose.Schema.Types.ObjectId, ref:"User"},
    timestamp: {type: Date, default: Date.now},
    file:{
        name: {type:String},
        type: {type:String},
        path: {type:String},
        size: {type:Number},

    },
      reactions: [
            {
                emoji: String,
                userids: [{
                    type: mongoose.Schema.Types.ObjectId,
                    ref:"User"
                }]
            }
        ],

        read: {type: String, default: false}
})


module.exports = mongoose.model("Groupmessage", groupmessageschema)