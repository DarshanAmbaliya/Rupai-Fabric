const express = require("express");
const router = express.Router();

const controller = require("../controllers/employeeProfileController");
const upload = require("../middleware/upload");

// Get all employees
router.get("/employees", controller.getAllEmployees);

// Get employee profile by Payroll ID
router.get("/:id", controller.getEmployeeProfile);

// Create / Update Profile
router.post(
    "/upload",
    upload.fields([
        {
            name: "profilePicture",
            maxCount: 1
        },
        {
            name: "aadhaarPhoto",
            maxCount: 1
        },
        {
            name: "passbookPhoto",
            maxCount: 1
        }
    ]),
    controller.createEmployeeProfile
);

// Update Images
router.put(
    "/profile-picture/:id",
    upload.single("profilePicture"),
    controller.updateProfilePicture
);

router.put(
    "/aadhaar/:id",
    upload.single("aadhaarPhoto"),
    controller.updateAadhaarPhoto
);

router.put(
    "/passbook/:id",
    upload.single("passbookPhoto"),
    controller.updatePassbookPhoto
);

// Delete Images
router.delete(
    "/profile-picture/:id",
    controller.deleteProfilePicture
);

router.delete(
    "/aadhaar/:id",
    controller.deleteAadhaarPhoto
);

router.delete(
    "/passbook/:id",
    controller.deletePassbookPhoto
);

module.exports = router;