import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentuser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logoutuser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
  updatecoverimage,
  authgoogle,
  finalgoogleauth
} from "../controller/user.cotroller.js";
import { upload } from "./../middlewares/multer.js";
import { verifyJWT } from "../middlewares/auth.midleware.js";
import multer from "multer";
const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    {
      name: "converimage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secured Route
router.route("/logout").post(verifyJWT, logoutuser);
router.route('/refreshtoken').post(refreshAccessToken);
router.route("/change-password").post(verifyJWT,changeCurrentPassword);
router.route("/current-user").get(verifyJWT,getCurrentuser);
router.route("/update-account").patch(verifyJWT,updateAccountDetails)
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updatecoverimage)
router.route("/channel/:username").get(verifyJWT,getUserChannelProfile)
router.route("/watchhistory").get(verifyJWT,getWatchHistory)
router.route("/auth/google").get(authgoogle)
router.route("/login/callback").get(finalgoogleauth)

export default router;
