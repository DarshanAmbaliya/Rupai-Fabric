import React, { useState, useEffect } from "react";
import axios from "axios";

const YarnQuality = () => {
  const [qualityName, setQualityName] = useState("");
  const [yarns, setYarns] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const API_BASE_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:5000"
      : "https://rupai-fabric-n9zz.onrender.com";

  const API_URL = `${API_BASE_URL}/api/yarns`;

  const fetchYarns = async () => {
    try {
      const response = await axios.get(API_URL);
      setYarns(response.data);
    } catch (err) {
      console.error("Error fetching yarns:", err);
    }
  };

  useEffect(() => {
    fetchYarns();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!qualityName) return alert("Please enter a yarn quality");

    try {
      await axios.post(API_URL, { yarnName: qualityName });
      setQualityName("");
      fetchYarns();
    } catch (err) {
      alert(err.response?.data?.message || "Error adding yarn quality");
    }
  };

  // DELETE FUNCTION
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchYarns();
    } catch (err) {
      alert("Error deleting yarn quality");
    }
  };

  const filteredYarns = yarns.filter((item) =>
    item.yarn_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="YarnQuality-section">
      <div className="container">
        <form onSubmit={handleSubmit}>
          <div className="input-box">
            <input
              type="text"
              placeholder="Add New Yarn Quality"
              value={qualityName}
              onChange={(e) => setQualityName(
                e.target.value
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ')
              )}
            />
            <button type="submit">Add Quality</button>
          </div>
        </form>

        <hr />

        <div style={{ margin: "20px 0" }}>
          <input
            type="text"
            placeholder="Search yarn qualities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: "8px", width: "100%", maxWidth: "300px" }}
          />
        </div>

        <table border="1" width="100%">
          <thead>
            <tr>
              <th>Sr. No</th>
              <th>Yarn Quality</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredYarns.length > 0 ? (
              filteredYarns.map((item, index) => (
                <tr key={item._id}>
                  <td>{index + 1}</td>
                  <td>{item.yarn_name}</td>
                  <td>
                    <button
                      onClick={() => handleDelete(item._id)}
                      style={{
                        backgroundColor: "red",
                        color: "#fff",
                        border: "none",
                        padding: "5px 10px",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" style={{ textAlign: "center" }}>
                  No Yarn Quality found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default YarnQuality;