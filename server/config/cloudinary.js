const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
    cloud_name: "zdxwis1o",
    api_key: "324493331894416",
    api_secret: "N5h97Go_GaL04eCjH21Kipq2fqA",
});

module.exports = cloudinary;