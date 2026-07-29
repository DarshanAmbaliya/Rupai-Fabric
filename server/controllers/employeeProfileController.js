const mongoose = require("mongoose");
const EmployeeProfile = require("../models/EmployeeProfile");
const Payroll = require("../models/Employee");
const cloudinary = require("../config/cloudinary");

/*
=========================================
Get All Employees
=========================================
*/

exports.getAllEmployees = async (req, res) => {

    try {

        const payrolls = await Payroll.find().sort({ year: 1 });

        const employees = new Map();

        payrolls.forEach((yearDoc) => {

            const year = yearDoc.year;

            yearDoc.months.forEach((monthEmployees, monthName) => {

                const months = {
                    january: 1,
                    february: 2,
                    march: 3,
                    april: 4,
                    may: 5,
                    june: 6,
                    july: 7,
                    august: 8,
                    september: 9,
                    october: 10,
                    november: 11,
                    december: 12
                };

                const month = months[monthName.toLowerCase()];

                // Ignore everything before July 2026
                if (
                    year < 2026 ||
                    (year === 2026 && month < 7)
                ) {
                    return;
                }

                monthEmployees.forEach((emp) => {

                    if (!emp.name) return;

                    const key = emp.name.trim().toUpperCase();

                    if (!employees.has(key)) {

                        employees.set(key, {
                            employeeId: emp.employeeId,
                            name: emp.name.trim(),
                            dailySalary: emp.dailySalary
                        });

                    }

                });

            });

        });

        res.status(200).json(
            Array.from(employees.values()).sort((a, b) =>
                a.name.localeCompare(b.name)
            )
        );

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};


/*
=========================================
Get Employee Profile By ID
=========================================
*/

exports.getEmployeeProfile = async (req, res) => {

    try {

        const profile = await EmployeeProfile.findById(req.params.id);

        if (!profile) {

            return res.status(404).json({
                message: "Profile not found"
            });

        }

        res.status(200).json(profile);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};


/*
=========================================
Create / Update Profile
=========================================
*/

exports.createEmployeeProfile = async (req, res) => {

    try {

        const { employeeId, name } = req.body;

        if (!employeeId) {

            return res.status(400).json({
                message: "Employee ID is required"
            });

        }

        let employee = await EmployeeProfile.findById(employeeId);

        if (!employee) {

            employee = new EmployeeProfile({

                _id: new mongoose.Types.ObjectId(employeeId),

                name,

                profilePicture: {
                    url: "",
                    public_id: ""
                },

                aadhaarPhoto: {
                    url: "",
                    public_id: ""
                },

                passbookPhoto: {
                    url: "",
                    public_id: ""
                }

            });

        } else {

            employee.name = name;

        }


        /*
        ===========================
        Profile Picture
        ===========================
        */

        if (req.files?.profilePicture) {

            if (employee.profilePicture?.public_id) {

                await cloudinary.uploader.destroy(
                    employee.profilePicture.public_id
                );

            }

            employee.profilePicture = {

                url: req.files.profilePicture[0].path,

                public_id: req.files.profilePicture[0].filename

            };

        }


        /*
        ===========================
        Aadhaar
        ===========================
        */

        if (req.files?.aadhaarPhoto) {

            if (employee.aadhaarPhoto?.public_id) {

                await cloudinary.uploader.destroy(
                    employee.aadhaarPhoto.public_id
                );

            }

            employee.aadhaarPhoto = {

                url: req.files.aadhaarPhoto[0].path,

                public_id: req.files.aadhaarPhoto[0].filename

            };

        }


        /*
        ===========================
        Passbook
        ===========================
        */

        if (req.files?.passbookPhoto) {

            if (employee.passbookPhoto?.public_id) {

                await cloudinary.uploader.destroy(
                    employee.passbookPhoto.public_id
                );

            }

            employee.passbookPhoto = {

                url: req.files.passbookPhoto[0].path,

                public_id: req.files.passbookPhoto[0].filename

            };

        }

        await employee.save();

        res.status(200).json(employee);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};
/*
=========================================
Update Image Helper
=========================================
*/

const updateImage = async (req, res, field) => {

    try {

        const employee = await EmployeeProfile.findById(req.params.id);

        if (!employee) {

            return res.status(404).json({
                message: "Employee profile not found"
            });

        }

        if (!req.file) {

            return res.status(400).json({
                message: "Image file is required"
            });

        }

        // Delete old image from Cloudinary
        if (employee[field]?.public_id) {

            await cloudinary.uploader.destroy(
                employee[field].public_id
            );

        }

        employee[field] = {

            url: req.file.path,

            public_id: req.file.filename

        };

        await employee.save();

        res.status(200).json(employee);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};


/*
=========================================
Update Profile Picture
=========================================
*/

exports.updateProfilePicture = async (req, res) => {

    await updateImage(req, res, "profilePicture");

};


/*
=========================================
Update Aadhaar Photo
=========================================
*/

exports.updateAadhaarPhoto = async (req, res) => {

    await updateImage(req, res, "aadhaarPhoto");

};


/*
=========================================
Update Passbook Photo
=========================================
*/

exports.updatePassbookPhoto = async (req, res) => {

    await updateImage(req, res, "passbookPhoto");

};



/*
=========================================
Delete Image Helper
=========================================
*/

const deleteImage = async (req, res, field) => {

    try {

        const employee = await EmployeeProfile.findById(req.params.id);

        if (!employee) {

            return res.status(404).json({
                message: "Employee profile not found"
            });

        }

        if (employee[field]?.public_id) {

            await cloudinary.uploader.destroy(
                employee[field].public_id
            );

        }

        employee[field] = {

            url: "",

            public_id: ""

        };

        await employee.save();

        res.status(200).json({

            message: "Image deleted successfully",

            employee

        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};



/*
=========================================
Delete Profile Picture
=========================================
*/

exports.deleteProfilePicture = async (req, res) => {

    await deleteImage(req, res, "profilePicture");

};



/*
=========================================
Delete Aadhaar Photo
=========================================
*/

exports.deleteAadhaarPhoto = async (req, res) => {

    await deleteImage(req, res, "aadhaarPhoto");

};



/*
=========================================
Delete Passbook Photo
=========================================
*/

exports.deletePassbookPhoto = async (req, res) => {

    await deleteImage(req, res, "passbookPhoto");

};