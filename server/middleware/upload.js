const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
        folder: "RupaiFabrics",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        public_id: Date.now() + "-" + file.originalname.split(".")[0]

    })
});

module.exports = multer({ storage });