const express = require("express");
const {
  registerUser,
  getUserInfo,
  updateUser,
} = require("../controllers/userController");
const { basicAuth } = require("../middleware/auth");
const {checkParams,checkBodyContent}=require('../middleware/paramCheck')


const multer = require('multer');
const {
  uploadProfileImage,
  getProfileImage,
  deleteProfileImage,
} = require('../controllers/imageController');

const multerStorage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage: multerStorage });

const router = express.Router();

router.post("/v1/user",checkParams, registerUser);

router.all("/v1/user", (req, res) => {
    return res
      .status(405)
      .set({
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      })
      .end();
  });


router.head("/v1/user/self",checkParams, (req, res) => {
  return res
    .status(405)
    .set({
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    })
    .end();
});

router.get("/v1/user/self",checkParams,checkBodyContent, basicAuth, getUserInfo);

router.put("/v1/user/self",checkParams, basicAuth, updateUser);

router.all("/v1/user/self", (req, res) => {
  return res
    .status(405)
    .set({
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    })
    .end();
});




// POST /v1/user/self/pic
router.post("/v1/user/self/pic",basicAuth, upload.single('profilePic'), uploadProfileImage);

// GET /v1/user/self/pic
router.get("/v1/user/self/pic",basicAuth, getProfileImage);

// DELETE /v1/user/self/pic
router.delete("/v1/user/self/pic",basicAuth, deleteProfileImage);


module.exports = router;
