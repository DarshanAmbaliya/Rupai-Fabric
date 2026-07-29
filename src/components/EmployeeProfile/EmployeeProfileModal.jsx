import React, { useEffect, useState } from "react";
import axios from "axios";
import "./EmployeeProfileModal.css";

const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://rupai-fabric-n9zz.onrender.com";

const EmployeeProfileModal = ({
  open,
  employeeId,
  employeeName,
  onClose,
  onProfileUpdated
}) => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [aadhaarPhoto, setAadhaarPhoto] = useState(null);
  const [passbookPhoto, setPassbookPhoto] = useState(null);
  const [profilePreview, setProfilePreview] = useState("");
  const [aadhaarPreview, setAadhaarPreview] = useState("");
  const [passbookPreview, setPassbookPreview] = useState("");
  
  // State for full-screen image viewer lightbox
  const [selectedImage, setSelectedImage] = useState(null);
  useEffect(() => {
    if (open && employeeName) {
      fetchProfile();
    }
  }, [open, employeeName]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/api/employee-profile/${employeeId}`
      );
      setProfile(res.data);
      setProfilePreview(res.data.profilePicture?.url || "");
      setAadhaarPreview(res.data.aadhaarPhoto?.url || "");
      setPassbookPreview(res.data.passbookPhoto?.url || "");
    } catch (err) {
      setProfile(null);
      setProfilePreview("");
      setAadhaarPreview("");
      setPassbookPreview("");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfilePicture(file);
    setProfilePreview(URL.createObjectURL(file));
  };

  const handleAadhaarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAadhaarPhoto(file);
    setAadhaarPreview(URL.createObjectURL(file));
  };

  const handlePassbookChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPassbookPhoto(file);
    setPassbookPreview(URL.createObjectURL(file));
  };

  const saveProfile = async () => {
    try {
      const formData = new FormData();
  
      formData.append("employeeId", employeeId);
      formData.append("name", employeeName);
  
      if (profilePicture) {
        formData.append("profilePicture", profilePicture);
      }
  
      if (aadhaarPhoto) {
        formData.append("aadhaarPhoto", aadhaarPhoto);
      }
  
      if (passbookPhoto) {
        formData.append("passbookPhoto", passbookPhoto);
      }
  
      await axios.post(
        `${API_BASE_URL}/api/employee-profile/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
  
      // Refresh modal data
      await fetchProfile();
  
      // Refresh Employees.jsx
      if (onProfileUpdated) {
        await onProfileUpdated();
      }
  
      // Clear selected files
      setProfilePicture(null);
      setAadhaarPhoto(null);
      setPassbookPhoto(null);
  
      alert("Profile Saved");
    } catch (err) {
      console.log(err);
      alert("Upload Failed");
    }
  };

  const deleteProfilePicture = async () => {
    if (!profile) return;
  
    try {
      await axios.delete(
        `${API_BASE_URL}/api/employee-profile/profile-picture/${profile._id}`
      );
  
      await fetchProfile();
  
      if (onProfileUpdated) {
        await onProfileUpdated();
      }
    } catch (err) {
      console.log(err);
    }
  };

  const deleteAadhaar = async () => {
    if (!profile) return;
  
    try {
      await axios.delete(
        `${API_BASE_URL}/api/employee-profile/aadhaar/${profile._id}`
      );
  
      await fetchProfile();
  
      if (onProfileUpdated) {
        await onProfileUpdated();
      }
    } catch (err) {
      console.log(err);
    }
  };

  const deletePassbook = async () => {
    if (!profile) return;
  
    try {
      await axios.delete(
        `${API_BASE_URL}/api/employee-profile/passbook/${profile._id}`
      );
  
      await fetchProfile();
  
      if (onProfileUpdated) {
        await onProfileUpdated();
      }
    } catch (err) {
      console.log(err);
    }
  };
  
  if (!open) return null;

  return (
    <>
      <div className="employeeModalOverlay">
        <div className="employeeModal">
          <div className="employeeHeader">
            <h2>Employee Profile</h2>
            <button className="closeBtn" onClick={onClose}>
              ✖
            </button>
          </div>

          <h3 className="employeeName">{employeeName}</h3>

          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <>
              {/* Profile Picture */}
              <div className="imageSection">
                <h4>Profile Picture</h4>
                <div className="imageCard">
                  {profilePreview ? (
                    <img
                      src={profilePreview}
                      alt="Profile"
                      className="previewImage"
                      onClick={() => setSelectedImage(profilePreview)}
                    />
                  ) : (
                    <div className="noImage">No Image</div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileChange}
                  />

                  <div className="buttonGroup">
                    <button className="saveBtn" onClick={saveProfile}>
                      Upload
                    </button>
                    {profile?.profilePicture?.url && (
                      <button
                        className="deleteBtn"
                        onClick={deleteProfilePicture}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Aadhaar */}
              <div className="imageSection">
                <h4>Aadhaar Card</h4>
                <div className="imageCard">
                  {aadhaarPreview ? (
                    <img
                      src={aadhaarPreview}
                      alt="Aadhaar"
                      className="previewImage"
                      onClick={() => setSelectedImage(aadhaarPreview)}
                    />
                  ) : (
                    <div className="noImage">No Image</div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAadhaarChange}
                  />

                  <div className="buttonGroup">
                    <button className="saveBtn" onClick={saveProfile}>
                      Upload
                    </button>
                    {profile?.aadhaarPhoto?.url && (
                      <button className="deleteBtn" onClick={deleteAadhaar}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Passbook */}
              <div className="imageSection">
                <h4>Bank Passbook</h4>
                <div className="imageCard">
                  {passbookPreview ? (
                    <img
                      src={passbookPreview}
                      alt="Passbook"
                      className="previewImage"
                      onClick={() => setSelectedImage(passbookPreview)}
                    />
                  ) : (
                    <div className="noImage">No Image</div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePassbookChange}
                  />

                  <div className="buttonGroup">
                    <button className="saveBtn" onClick={saveProfile}>
                      Upload
                    </button>
                    {profile?.passbookPhoto?.url && (
                      <button className="deleteBtn" onClick={deletePassbook}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="footerButtons">
                <button className="closeModalBtn" onClick={onClose}>
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Full-Screen Image Viewer Lightbox */}
      {selectedImage && (
        <div
          className="imageViewer"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="viewerClose"
            onClick={() => setSelectedImage(null)}
          >
            ✖
          </button>
          <img
            src={selectedImage}
            alt="Full View"
            className="viewerImage"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default EmployeeProfileModal;