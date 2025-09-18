import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import '../../assets/styles/AdminPanel.css';

// ✅ Import logos instead of using /src/
import chandraaLogo from '../../assets/images/CHANDRAA.png';
import webSixLogo from '../../assets/images/WEB SIX.png';

export default function AdminPanel() {
  const [admin, setAdmin] = useState(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: "",
    designation: "",
    username: "",
    email: "",
    name: "",
    mobile: "",
    ien: "",
    role: "",
    password: "",
    profile: null,
  });

  const navigate = useNavigate();

  // ✅ Load admin from localStorage
  useEffect(() => {
    const authData = JSON.parse(localStorage.getItem("auth"));
    if (authData?.profile) {
      setAdmin({
        name: authData.profile.name || "Admin",
        email: authData.profile.email || "admin@gmail.com",
        profileUrl: authData.profile.profile_url || authData.profileUrl || "https://via.placeholder.com/130",
      });
    }
  }, []);

  const togglePassword = () => setPasswordVisible(prev => !prev);

 const handleChange = (e) => {
  const { name, value, files } = e.target;

  let newValue = files ? files[0] : value;

  // 🔽 Convert employee_id to UPPERCASE always
  if (name === "employee_id") {
    newValue = newValue.toUpperCase();
  }

  setFormData((prev) => ({
    ...prev,
    [name]: newValue,
  }));
};
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const token = JSON.parse(localStorage.getItem("auth"))?.session?.access_token;
    if (!token) throw new Error("No access token found");

    const payload = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key]) payload.append(key, formData[key]);
    });

    const response = await fetch("https://attendance-backend-5cvu.onrender.com/auth/create-user", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`, // 🔑 include token for auth
      },
      body: payload, // 👈 FormData will include text + file
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create user");
    }

    const result = await response.json();
    console.log("✅ User created:", result);

    alert("✅ User created successfully!");
    navigate("/admin/dashboard");
  } catch (error) {
    console.error("User creation failed:", error.message);
    alert("❌ Failed to create user. Check console for details.");
  }
};

  return (
    <div className="container">
      {/* Left Panel */}
      <div className="left-panel">
        <h2>ADMIN PANEL</h2>
        <div className="profile-pic">
          <img src={admin?.profileUrl} alt="Profile" />
        </div>
        <h3>{admin?.name}</h3>
        <p>
          <a href={`mailto:${admin?.email}`}>{admin?.email}</a>
        </p>
      </div>

      {/* Right Panel */}
      <div className="right-panel">
        <div className="top-logos">
          <img src={chandraaLogo} alt="Chandraa Ads" />
          <img src={webSixLogo} alt="Media Web Six" />
        </div>

        <form className="form-container" onSubmit={handleSubmit}>
          <h2>Create User</h2>

          {/* Name */}
          <div className="input-group">
            <i className="fa fa-user" />
            <input name="name" type="text" placeholder="Full Name" onChange={handleChange} required />
          </div>

          {/* Employee ID */}
          <div className="input-group">
            <i className="fa fa-id-badge" />
            <input name="employee_id" type="text" placeholder="EMP ID" onChange={handleChange} required />
          </div>

          {/* Username */}
          <div className="input-group">
            <i className="fa fa-user" />
            <input name="username" type="text" placeholder="Username" onChange={handleChange} required />
          </div>

          {/* Email */}
          <div className="input-group">
            <i className="fa fa-envelope" />
            <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
          </div>

          {/* Designation */}
          <div className="input-group">
            <i className="fa fa-briefcase" />
            <input name="designation" type="text" placeholder="Designation" onChange={handleChange} required />
          </div>

          {/* Mobile */}
          <div className="input-group">
            <i className="fa fa-phone" />
            <input name="mobile" type="text" placeholder="Mobile Number" onChange={handleChange} required />
          </div>

          {/* Emergency Number */}
          <div className="input-group">
            <i className="fa fa-phone" />
            <input name="ien" type="text" placeholder="Emergency Number" onChange={handleChange} required />
          </div>

          {/* Role */}
          <div className="input-group">
            <i className="fa fa-user-shield" />
            <select name="role" onChange={handleChange} required>
              <option value="">Select Role</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>

          {/* Password */}
          <div className="input-group password-group">
            <i className="fa fa-key left-icon" />
            <input
              name="password"
              type={passwordVisible ? "text" : "password"}
              placeholder="Password"
              onChange={handleChange}
              required
            />
            <span
              className={`fa fa-fw ${passwordVisible ? "fa-eye-slash" : "fa-eye"} field-icon toggle-password`}
              onClick={togglePassword}
            ></span>
          </div>

          {/* Profile Image */}
          <div className="file-upload">
            <input name="profile" type="file" accept="image/*" onChange={handleChange} required />
          </div>

          {/* Submit */}
          <button type="submit" className="submit-btn">
            Create <i className="fa fa-user-plus" />
          </button>
        </form>
      </div>
    </div>
  );
}
