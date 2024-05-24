import  mongoose, { Schema } from 'mongoose';

const commentschema=new mongoose.Schema({
    comment:{
        type:String,
      
    },
    owner:{
     type:Schema.Types.ObjectId,
     ref:"User"
    },
    videoid:{
        type:Schema.Types.ObjectId,
        ref:"video"
    }
},{
    timestamps:true
})


export const commentmodel=mongoose.model('comment',commentschema)