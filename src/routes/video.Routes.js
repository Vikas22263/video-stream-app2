import { Router } from "express";

import {
  uploadvideo,
  getallvideos,
  singlevideo,
  uservideos,
  updatevideo,
  deltevideo,
  comments,
  subscribe
} from "../controller/video.controller.js";
import { upload } from "../middlewares/multer.js";
import { verifyJWT } from "../middlewares/auth.midleware.js";

const router = Router();

router.route("/allvideos").get(getallvideos);
router.route("/upload").post(
  verifyJWT,
  upload.fields([
    { name: "videofile", maxCount: 1 },
    { name: "coverimage", maxCount: 1 },
  ]),
  uploadvideo
);
router.route("/uservideos").get(verifyJWT, uservideos);
router.route('/singlevideo/:videoId').get(verifyJWT,singlevideo)
router.route('/comment/:id').post(verifyJWT,comments)
router.route('/subscribe/:channel_id').post(verifyJWT,subscribe)
router.route('/updatevideo/:id').patch(verifyJWT,updatevideo)
router.route('/deltevideo/:id').delete(verifyJWT,deltevideo)

export default router;
