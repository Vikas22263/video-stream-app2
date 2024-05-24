import { asyncHandler } from "../utils/asyncHandeler.js";
import { ApiResponse } from "../utils/APIResponse.js";
import { ApiErrors } from "../utils/APIErrors.js";
import { delteOncloud, uploadOncload } from "../utils/Cloudnay.js";
import { video } from "./../models/VideoModel.js";
import { z } from "zod";
import mongoose from "mongoose";
import { commentmodel } from "../models/commentModel.js";
import { Subscription } from "./../models/subscription.model.js";
import { User } from "../models/UserModel.js";

const getallvideos = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const limit = parseInt(req.params.limit) || 10;
    const skip = (page - 1) * limit;

    const pipeline = [
      {
        $match: {
          isPublished: true,
        },
      },
      {
        $project: {
          owner: 0,
          isPublished: 0,
        },
      },
      {
        $sort: {
          updatedAt: 1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ];

    const videos = await video.aggregate(pipeline);

    return res
      .status(200)
      .send(new ApiResponse(200, videos, "Data fetch successfully"));
  } catch (error) {
    throw new ApiErrors(401, error?.message || "No video found");
  }
});

const singlevideo = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const videoObjet = {};
    const id = req.params.videoId;

    const updatevideoview = await video
      .findOneAndUpdate(
        { _id: id },
        { $inc: { views: 1 } },
        { new: true, session }
      )
      .session(session);
    await session.commitTransaction();

    const video_details = await video.findById(id);
    if (!video_details) {
      throw new ApiErrors(400, "video not found");
    }

    const channeldetails = await User.findById(video_details.owner).select(
      "-email -watchHistory -password -refreshToken"
    );
    videoObjet.channeldetails = channeldetails;
    const comments = await commentmodel.find({videoid:id});
    videoObjet.comments = comments;
    const subs = await Subscription.aggregate([
      
      {
        $count: "subscribers",
      },
    ]);
    videoObjet.subs = subs;
   
    const isSubscribed = await Subscription.find({
      subscriber: req.user._id,
      channel: video_details.owner,
    });

    videoObjet.isSubscribed = isSubscribed ? true : false;

    return res
      .status(200)
      .send(new ApiResponse(201, videoObjet, "video fetched sucesfully"));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new ApiErrors(401, error?.message);
  }
});

const uploadvideo = asyncHandler(async (req, res) => {
  try {
    const { title, description, isPublished } = req.body;

    if ([title, description, isPublished].some((ele) => ele === "")) {
      throw new ApiErrors(404, "please fill all fields");
    }

    const vidoepath = req.files.videofile[0].path;
    const coverimage = req.files.coverimage[0].path;

    if (!vidoepath || !coverimage) {
      throw new ApiErrors(404, "video and cover image mandatary");
    }

    const uploadvideo = await uploadOncload(vidoepath);
    const uploadcover = await uploadOncload(coverimage);

    const ownerid = req.user._id.toString();

    const addvideofileindb = await video.create({
      videoFile: uploadvideo.url,
      thumbnail: uploadcover.url,
      title: title,
      description: description,
      isPublished: isPublished,
      duration: uploadvideo.duration,
      owner: ownerid,
    });

    return res
      .status(200)
      .send(
        new ApiResponse(201, addvideofileindb, "video uploaded succesfully")
      );
  } catch (error) {
    throw new ApiErrors(401, error?.message || "No video found");
  }
});

const uservideos = asyncHandler(async (req, res) => {
  try {
    const userid = req.user._id.toString();
    const extractedId = userid.match(/[0-9a-fA-F]{24}/)[0];
    const ObjectId = mongoose.Types.ObjectId;
    const pipeline = [
      {
        $match: {
          owner: new ObjectId(extractedId),
        },
      },
    ];

    const videos = await video.aggregate(pipeline);

    return res
      .status(200)
      .send(new ApiResponse(200, videos, "video fetch succesfully"));
  } catch (error) {
    throw new ApiErrors(401, error?.message);
  }
});
const updatevideo = asyncHandler(async (req, res) => {
  try {
    const videoId = req.params.id;
    const { thumbnail, title, description, isPublished } = req.body;

    const findvideo = await video.findOneAndUpdate(
      {
        thumbnail: thumbnail,
        title: title,
        description: description,
        isPublished: isPublished,
      },
      { new: true }
    );

    if (findvideo) {
      throw new ApiErrors(404, "Video not updated");
    }
    return res
      .status(204)
      .send(new ApiResponse(204, findvideo, "video update succesfully"));
  } catch (error) {
    throw new ApiErrors(401, error?.message);
  }
});
const deltevideo = asyncHandler(async (req, res) => {
  const session = await video.startSession();
  session.startTransaction();
  try {
    const videoId = req.params.id;

    const videofile = await video.findById(videoId).session(session);

    if (!videofile) {
      throw new ApiErrors(400, "video not found");
    }

    const deltevideooncloud = await delteOncloud(videofile.videoFile);
    const deltethumbnailoncloud = await delteOncloud(videofile.thumbnail);

    if (!deltevideooncloud || !deltethumbnailoncloud) {
      throw new ApiErrors(400, "video not delted");
    }

    const deltevideodata = await video
      .findByIdAndDelete(videoId)
      .session(session);
    console.log(deltevideodata);

    if (!deltevideodata) {
      throw new ApiErrors(400, "video not delted");
    }
    await session.commitTransaction();
    session.endSession();
    return res
      .status(200)
      .send(new ApiResponse(200, "", "video deleted successfully"));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new ApiErrors(401, error?.message);
  }
});
const comments = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // const commetschema = z.object({
    //   comment: z.string().min(1)
    // });

    const video_id = req.params.id;
    const { comment } = req.body;
   
     console.log(comment);

    const ownerid = req.user._id.toString();

    const savecomment = await commentmodel.create(
      {
        comment: comment,
        owner: ownerid,
        videoid: video_id
      },
      { session: session } 
    );

    if (!savecomment) {
      throw new ApiErrors(400, "Comment not added ");
    }

    await session.commitTransaction();

    return res.status(201).send(new ApiResponse(201, savecomment, "Comment added"));

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    throw new ApiErrors(400, error?.message || "Error occurred while adding comment");
  }
});

const subscribe = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const channel_id = req.params.channel_id;

    const createsubscribe = await Subscription.create({
      subscriber: req.user._id.toString(),
      channel: channel_id,
    })

    await session.commitTransaction();
    return res
      .status(200)
      .send(
        new ApiResponse(201, createsubscribe, "chanel subscrice succesfuly")
      );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new ApiErrors(401, error?.message);
  }
});

const unsubscribe=asyncHandler(async(req,res)=>{
  try {
    const channel_id = req.params.channel_id;
     
    const result= await Subscription.deleteOne({
      subscriber:req.user._id.toString(),
      channel:channel_id
    })
    if(result.deletedCount ===0){
      throw new ApiErrors(404, 'Subscription not found');
    }
    return res.status(200).send(new ApiResponse(200,'',' unsubscribed'))
    
  } catch (error) {
    throw new ApiErrors(401, error?.message);

  }
})

export {
  getallvideos,
  singlevideo,
  uploadvideo,
  uservideos,
  updatevideo,
  deltevideo,
  comments,
  subscribe,
  unsubscribe
};
