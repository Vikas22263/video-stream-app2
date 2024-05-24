import { asyncHandler } from "../utils/asyncHandeler.js";
import { ApiErrors } from "../utils/APIErrors.js";
import { User } from "./../models/UserModel.js";
import { uploadOncload } from "../utils/Cloudnay.js";
import { ApiResponse } from "../utils/APIResponse.js";
import Jwt from "jsonwebtoken";
import mongoose from "mongoose";
import  axios  from "axios";
import {googleAuth} from './../models/authgoogle.js';

const genrateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const AccessToken = user.generateAccessToken();
    const RefreshToken = user.generateRefreshToken();
    user.RefreshToken = RefreshToken;
    await user.save({ validateBeforeSave: false });
    return { AccessToken, RefreshToken };
  } catch (error) {
    throw new ApiErrors(
      500,
      "Something went wrong while genrating refresh access Token"
    );
  }
};

export const registerUser = asyncHandler(async (req, res) => {
  const { Fullname, email, username, password } = req.body;

  if (
    [Fullname, email, username, password].some((filed) => filed?.trim() === "")
  ) {
    throw new ApiErrors(400, "All fileds are required");
  }
  const existeduser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existeduser) {
    throw new ApiErrors(409, "User with email or username alreday exists");
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.converimage[0]?.path;
  // console.log(req.files)
  let coverimageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.converimage) &&
    req.files.converimage.length > 0
  ) {
    coverimageLocalPath = req.files.converimage[0].path;
  }
  if (!avatarLocalPath) {
    throw new ApiErrors(400, "Avatar file is required");
  }
  const avatar = await uploadOncload(avatarLocalPath);
  const converimage = await uploadOncload(coverimageLocalPath);

  if (!avatar) {
    throw new ApiErrors(400, "Avatar file is required");
  }

  const user = await User.create({
    Fullname,
    avatar: avatar.url,
    coverImage: converimage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createduser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createduser) {
    throw new ApiErrors(500, "something went wrong while register user");
  }

  return res
    .status(201)
    .send(new ApiResponse(200, createduser, "User Register Succefully"));
});

export const loginUser = asyncHandler(async (req, res) => {
  //data
  //validation
  //finduser
  //match password
  //refresh token access token send to user
  //cookies send
  //response send to user

  const { email, username, password } = req.body;
  if (!username && username) {
    throw new ApiErrors(400, "usename or password is required");
  }

  const user = await User.findOne({ $or: [{ username }, { email }] });

  if (!user) {
    throw new ApiErrors(404, "User does not exists");
  }

  const ispasswordvalid = await user.isPasswordCorrect(password);

  if (!ispasswordvalid) {
    throw new ApiErrors(401, "Invalid user credential");
  }

  const { AccessToken, RefreshToken } = await genrateAccessAndRefreshTokens(
    user._id
  );

  const loggedinUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const option = {
    httpsOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", AccessToken, option)
    .cookie("RefreshToken", RefreshToken, option)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedinUser,
          AccessToken,
          RefreshToken,
        },
        "User Loggedin Successfully"
      )
    );
});

export const logoutuser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $set: { refreshToken: undefined },
  });

  const option = {
    httpsOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("RefreshToken", option)
    .json(new ApiResponse(200, {}, "User logged Out"));
});
export const refreshAccessToken = asyncHandler(async (req, res) => {
 try {
   const incomingRefreshTojen =
     req.cookie.refreshToken || req.body.refreshAccessToken;
 
   if (!incomingRefreshTojen) {
     throw new ApiErrors(401, "unauthorized request");
   }
  const decodedtoken= Jwt.verify(incomingRefreshTojen,process.env.REFRESH_TOKEN_SECRET)
 const user= User.findById(decodedtoken?._id)

 if (!user) {
   throw new ApiErrors(401, "unauthorized refresh token");
 }
 
 if(incomingRefreshTojen !==user?.refreshToken){
   throw new ApiErrors(401,"Refresh token is expired or used")
 }
 
 const option={
   httpsOnly:true,
   secure:true
 }
 const {AccessToken,newRefreshToken}= await genrateAccessAndRefreshTokens(user._id)
 
 return res
 .status(200)
 .cookie("accessToken", AccessToken, option)
 .cookie("RefreshToken", newRefreshToken, option)
 .json(
   new ApiResponse(200,{AccessToken,newRefreshToken},"Access token refreshed")
 )
 } catch (error) {
  throw new ApiErrors(401,error?.message || "Invalid refresh token") 

 }

}
);

export const changeCurrentPassword=asyncHandler(async(req,res)=>{
  const {oldPassword,newPassword}=req.body
   const user= await User.findById( req.user?._id)
   const isPasswordcorrect=  await user.isPasswordCorrect(oldPassword)
  if(!isPasswordcorrect) {
    throw new ApiErrors(400,"Invalid old password")
   }

   user.password=newPassword
   await user.save({validateBeforeSave:false})
   return res
   .status(200)
   .json(new ApiResponse(200,{},"Password Changed Succesfully "))


})

export const getCurrentuser=asyncHandler(async(req,res)=>{
  return res
  .status(200)
  .json(200,req.user,"current user fetched successfully")
})

export const updateAccountDetails=asyncHandler(async(req,res)=>{
const {Fullname,email}=req.body
if(!Fullname || email){
  throw new ApiErrors(400, "All fields are required")
}
 const user=User.findByIdAndUpdate( req.user?._id,{$set:{
  Fullname,
  email
 }},{new:true}).select("-password")

 return res
 .status(200)
 .json(new ApiResponse (200,user,"Account details updated successfully"))

})

export const updateUserAvatar=asyncHandler(async(req,res)=>{
   const avatarlocalpath=req.file?.path
   if(!avatarlocalpath){
    throw new ApiErrors(400,"Avatar file is missing")
   }
   const avatar=await uploadOncload(avatarlocalpath)
   if (!avatar.url){
    throw new ApiErrors(400,"Errore while uploading on avatar")
   }
  const updatedavatar= await User.findByIdAndUpdate( req.user?._id,{$set:{
    avatar:avatar.url
  }},{new:true}).select('-password')

  return res
  .status(200)
  .json(new ApiResponse(200,updatedavatar,"avatar updated succesfully"))
})
export const updatecoverimage=asyncHandler(async(req,res)=>{
  const coverimagelocalpath=req.file?.path
  if(!coverimagelocalpath){
   throw new ApiErrors(400,"cover image is missing")
  }
  const coverImage=await uploadOncload(coverimagelocalpath)
  if (!coverImage.url){
   throw new ApiErrors(400,"Error while uploading on coverImage")
  }
 const updatecoverImage= await User.findByIdAndUpdate( req.user?._id,{$set:{
  coverImage:coverImage.url
 }},{new:true}).select('-password')

 return res
 .status(200)
 .json(new ApiResponse(200,updatecoverImage,"coverImage updated succesfully"))
})
export const getUserChannelProfile=asyncHandler(async(req,res)=>{
const {username}=req.params
if(!username?.trim()){
throw new ApiErrors(400,"Username is missing")
}
const channel=await User.aggregate([
  {$match:{
    username:username?.toLowerCase()
  }},{
    $lookup:{
      from:Subscription,
      localField:"_id",
      foreignField:"channel",
      as:"Subscribers"
    }
  },{
    $lookup:{
      from:Subscription,
      localField:"_id",
      foreignField:"subscriber",
      as:"SubscribedTo"
    }
  },{
    $addFields:{
      subscribersCount:{
        $size:"$Subscribers"
      },
      ChannelsSubscribedTocount:{
        $size:"$SubscribedTo"
      },
      isSubscribed:{
        $cond:{
          if:{$in:[req.user?._id,"$Subscribers.subscriber"]},
          then:true,
          else:false
        }
      }
    }
  },{
    $project:{
      Fullname:1,
      username:1,
      subscribersCount:1,
      ChannelsSubscribedTocount:1,
      isSubscribed:1,
      avatar:1,
      coverImage:1,
      email:1

    }
  }
  
])
if(!channel.length){
  throw new ApiErrors(404,"channel does not exists")
}
return res
.status(200)
.json(
new ApiResponse(200,channel[0],"User channel fetched successfully")

)
})

export const getWatchHistory=asyncHandler(async(req,res)=>{
  const user=await User.aggregate([
    {
      $match:{
        _id:new mongoose.Types.ObjectId(req.user._id)
      }
    },{
      $lookup:{
        from:"video",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistory",
        pipeline:[{
          $lookup:{
            from:User,
            localField:"owner",
            foreignField:"_id",
            as:"Owner",
            pipeline:[
              {$project:{
                Fullname:1,
                username:1,
                avatar:1
              }}
            ]
          }
        },{
          $addFields:{
            owner:{
              $first:"$Owner "
            }
          }
        }
      ]
      }
    }
  ])
  return res
  .status(200)
  .json(
    new ApiResponse(200,
      user[0].getWatchHistory,
      "Watch history fetched successfully"
      )
  )
})
export const authgoogle=asyncHandler(async(req,res)=>{
  try {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENTID}&redirect_uri=${process.env.REDIRECT_URI }&response_type=code&scope=profile email`;
  res.redirect(url);
  } catch (error) {
    throw new ApiErrors(401, error?.message)
  }
})
export const finalgoogleauth=asyncHandler(async(req,res)=>{
  const { code } = req.query;

  try {
    const { data } = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENTID,
      client_secret: process.env.GOOGLECLIENTSERET,
      code,
      redirect_uri: process.env.REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const { access_token, id_token } = data;

    const { data: profile } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
     console.log(profile);
     const alreadyuser=await User.findOne({
      email:profile.email
     })
    
     const gooleauthchek=await googleAuth.findOne(
      {
        eamil:profile.email
      }
     )
     if(!googleAuth){
      const alreadyuser=await User.findOne({
        email:profile.email
       })
       if(alreadyuser){
        const loggedinUser = await User.findById(alreadyuser._id).select(
          "-password -refreshToken"
        );
        const { AccessToken, RefreshToken } = await genrateAccessAndRefreshTokens(
          alreadyuser._id
        );
        return res
        .status(200)
        .cookie("accessToken", AccessToken, option)
        .cookie("RefreshToken", RefreshToken, option)
        .json(
          new ApiResponse(
            200,
            {
              user:loggedinUser,
              AccessToken,
              RefreshToken,
            },
            "User Loggedin Successfully"
          )
        );
       }
  
      }

     
  } catch (error) {
    console.error('Error:', error);
   
  }
})