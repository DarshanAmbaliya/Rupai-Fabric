const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema({

    url: {
        type: String,
        default: ""
    },

    public_id: {
        type: String,
        default: ""
    }

}, { _id: false });

const EmployeeProfileSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    name: {
        type: String,
        required: true,
        unique: true
    },

    profilePicture: {
        type: ImageSchema,
        default: () => ({})
    },

    aadhaarPhoto: {
        type: ImageSchema,
        default: () => ({})
    },

    passbookPhoto: {
        type: ImageSchema,
        default: () => ({})
    }

}, {
    timestamps: true
});

module.exports = mongoose.model(
    "EmployeeProfile",
    EmployeeProfileSchema
);