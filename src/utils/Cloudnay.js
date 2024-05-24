import { v2 as cloudinary } from "cloudinary";
import { response } from "express";
import fs from "fs";
cloudinary.config({
  cloud_name: "dlpoohamk",
  api_key: "859936331577545",
  api_secret: "gLoN7NKewNZ89Zoc6eTQVFiPZcA",
});

const uploadOncload = async (localfilePath) => {
  try {
    if (!localfilePath) return null;
    const response = await cloudinary.uploader.upload(localfilePath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localfilePath)
    return response;
  } catch (error) {
    fs.unlinkSync(localfilePath); 
    return null;
  }
};
const delteOncloud=async(videoUrl)=>{
  try {
    const public_id = cloudinary.url(videoUrl).split('/').pop().split('.')[0];
    const response=await cloudinary.uploader.destroy(public_id,{resource_type: "auto"})
   return response
  } catch (error) {
    return null
  }
}

export { uploadOncload,delteOncloud};
