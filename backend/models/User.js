const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs")

const userschema = new mongoose.Schema({
   username: {type: String,required:true,unique:true},
  
   password:{type:String,required:true},
   contacts:[{type: mongoose.Schema.Types.ObjectId, ref:"User" }],

  
})





module.exports = mongoose.model("User",userschema)