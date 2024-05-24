import { ApiErrors } from "../utils/APIErrors.js";
import { asyncHandler } from "../utils/asyncHandeler.js";
import Jwt from "jsonwebtoken"
import { User } from "../models/UserModel.js";
export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies.accessToken ||
      req.header("Authorization")?.replace("Bearer","");
    
    if (!token) {
      throw new ApiErrors(401, "Unauthorized request");
    }
    const decodedInformation = await Jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );

    const user = await User.findById(decodedInformation?._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiErrors(401, "Invalid Access Token");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiErrors(401, error?.message || "Invaild acess token");
  }
});
