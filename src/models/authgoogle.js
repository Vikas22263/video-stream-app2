import  mongoose  from 'mongoose';
const googleauthschema=new mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    verified_email:{
        type:Boolean
    },
    name:{
        type:String,
        required:true
    },

})

export  const googleAuth=mongoose.model('googleauth',googleauthschema) 