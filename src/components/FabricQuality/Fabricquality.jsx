import React, { useState, useEffect } from "react";
import axios from "axios";

const Fabricquality = () => {
  const [qualityName, setQualityName] = useState("");
  const [fabrics, setFabrics] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const API_BASE_URL = window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://rupai-fabric-n9zz.onrender.com";

  const API_URL = `${API_BASE_URL}/api/fabrics`;

  const fetchFabrics = async () => {
    try {
      const response = await axios.get(API_URL);
      setFabrics(response.data);
    } catch (err) {
      console.error("Error fetching fabrics:", err);
    }
  };

  useEffect(() => {
    fetchFabrics();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!qualityName) return alert("Please enter a fabric name");

    try {
      await axios.post(API_URL, {
        fabricName: qualityName,
      });
      setQualityName("");
      fetchFabrics();
    } catch (err) {
      alert(err.response?.data?.message || "Error adding fabric");
    }
  };

  // 2. Logic to filter fabrics based on the search term
  const filteredFabrics = fabrics.filter((item) =>
    item.fabric_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="FabricQuality-section">
      <div className="container">
        <div className="row">
          {/* Add Form */}
          <form onSubmit={handleSubmit}>
            <div className="input-box">
              <input
                type="text"
                placeholder="Add New Quality"
                value={qualityName}
                onChange={(e) => setQualityName(e.target.value)}
              />
              <button type="submit">Add Quality</button>
            </div>
          </form>

          <hr />

          {/* 3. Search Input */}
          <div className="search-box" style={{ margin: "20px 0" }}>
            <input
              type="text"
              placeholder="Search qualities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: "8px", width: "100%", maxWidth: "300px" }}
            />
          </div>

          <div className="main-box">
            <div className="box">
              <table border="1" width="100%">
                <thead>
                  <tr>
                    <th>Sr. No</th>
                    <th>Quality Name</th>
                  </tr>
                </thead>
                <tbody>
                  {/* 4. Use filteredFabrics instead of fabrics */}
                  {filteredFabrics.length > 0 ? (
                    filteredFabrics.map((item, index) => (
                      <tr key={item._id}>
                        <td>{index + 1}</td>
                        <td>{item.fabric_name}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" style={{ textAlign: "center" }}>
                        No Fabric found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Fabricquality;