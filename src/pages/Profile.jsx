import React, { useState, useEffect } from "react";

const Profile = () => {
  const [formData, setFormData] = useState({
    employee_id: "",
    designation: "",
    username: "",
    email: "",
    name: "",
    mobile: "",
    ien: "",
    role: "admin",
    password: "",
  });

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [action, setAction] = useState("create");
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Styles object with responsive properties
  const styles = {
    wrapper: {
      minHeight: "100vh",
      background: "#f8fafc",
      padding: isMobile ? "16px" : "24px",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
    },
    container: {
      width: "100%",
      maxWidth: "1200px",
      background: "#ffffff",
      borderRadius: isMobile ? "8px" : "12px",
      boxShadow: isMobile 
        ? "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.05)"
        : "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      overflow: "hidden",
      border: "1px solid #e2e8f0",
    },
    header: {
      padding: isMobile ? "20px 16px 16px" : "32px 40px 24px",
      borderBottom: "1px solid #e2e8f0",
      background: "#ffffff",
      position: "relative",
    },
    headerTitle: {
      color: "#1e293b",
      fontSize: isMobile ? "22px" : "28px",
      fontWeight: "600",
      margin: isMobile ? "0 0 8px 0" : "0 0 8px 0",
      letterSpacing: "-0.5px",
      paddingRight: isMobile ? "80px" : "0",
    },
    headerSubtitle: {
      color: "#64748b",
      fontSize: isMobile ? "13px" : "14px",
      margin: "0",
      fontWeight: "400",
    },
    actionTabs: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      gap: "8px",
      background: "#f8fafc",
      padding: isMobile ? "12px" : "8px",
      borderRadius: isMobile ? "8px" : "8px",
      border: "1px solid #e2e8f0",
      margin: isMobile ? "12px" : "20px",
      overflowX: isMobile ? "auto" : "visible",
      flexWrap: isMobile ? "wrap" : "nowrap",
    },
    actionTab: {
      flex: isMobile ? "1 0 calc(50% - 8px)" : "1",
      padding: isMobile ? "12px 8px" : "10px 16px",
      background: "transparent",
      border: "none",
      borderRadius: "6px",
      fontSize: isMobile ? "12px" : "13px",
      fontWeight: "500",
      color: "#64748b",
      cursor: "pointer",
      transition: "all 0.2s ease",
      textAlign: "center",
      minWidth: isMobile ? "100px" : "auto",
    },
    actionTabActive: {
      background: "#2563eb",
      color: "white",
    },
    actionTabDisabled: {
      opacity: "0.5",
      cursor: "not-allowed",
    },
    managementContainer: {
      display: isMobile ? "flex" : "grid",
      flexDirection: isMobile ? "column" : "row",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 2fr",
      gap: isMobile ? "16px" : "24px",
      padding: isMobile ? "12px" : "20px",
    },
    userListPanel: {
      background: "#ffffff",
      borderRadius: isMobile ? "8px" : "12px",
      border: "1px solid #e2e8f0",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      minHeight: isMobile ? "300px" : "auto",
    },
    panelHeader: {
      padding: isMobile ? "16px" : "20px",
      borderBottom: "1px solid #e2e8f0",
      background: "#f8fafc",
    },
    panelTitle: {
      color: "#1e293b",
      fontSize: isMobile ? "16px" : "18px",
      fontWeight: "600",
      margin: "0 0 16px 0",
    },
    searchBox: {
      position: "relative",
    },
    searchInput: {
      width: "100%",
      padding: isMobile ? "10px 14px 10px 38px" : "10px 14px 10px 40px",
      borderRadius: "8px",
      border: "1.5px solid #e2e8f0",
      fontSize: isMobile ? "13px" : "14px",
      color: "#1e293b",
      background: "#ffffff",
    },
    searchIcon: {
      position: "absolute",
      left: "14px",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#94a3b8",
      fontSize: isMobile ? "14px" : "16px",
    },
    userList: {
      flex: "1",
      overflowY: "auto",
      padding: isMobile ? "12px" : "20px",
      maxHeight: isMobile ? "400px" : "500px",
    },
    userCard: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      padding: isMobile ? "12px" : "16px",
      marginBottom: "12px",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    userCardSelected: {
      borderColor: "#2563eb",
      background: "rgba(37, 99, 235, 0.05)",
    },
    userCardHeader: {
      display: "flex",
      alignItems: "center",
      gap: isMobile ? "8px" : "12px",
      marginBottom: isMobile ? "8px" : "12px",
    },
    userAvatar: {
      width: isMobile ? "36px" : "40px",
      height: isMobile ? "36px" : "40px",
      minWidth: isMobile ? "36px" : "40px",
      borderRadius: "50%",
      background: "#2563eb",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "600",
      fontSize: isMobile ? "14px" : "16px",
      overflow: "hidden",
    },
    userInfo: {
      flex: "1",
      minWidth: 0,
      overflow: "hidden",
    },
    userName: {
      color: "#1e293b",
      fontSize: isMobile ? "13px" : "14px",
      fontWeight: "600",
      margin: "0 0 2px 0",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    userEmail: {
      color: "#64748b",
      fontSize: isMobile ? "11px" : "12px",
      margin: "0",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    roleBadge: {
      padding: isMobile ? "3px 8px" : "4px 10px",
      borderRadius: "20px",
      fontSize: isMobile ? "10px" : "11px",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      whiteSpace: "nowrap",
    },
    roleBadgeAdmin: {
      background: "rgba(37, 99, 235, 0.1)",
      color: "#2563eb",
    },
    roleBadgeUser: {
      background: "rgba(5, 150, 105, 0.1)",
      color: "#059669",
    },
    formPanel: {
      background: "#ffffff",
      borderRadius: isMobile ? "8px" : "12px",
      border: "1px solid #e2e8f0",
      overflow: "hidden",
    },
    formHeader: {
      padding: isMobile ? "16px" : "20px",
      borderBottom: "1px solid #e2e8f0",
      background: "#f8fafc",
    },
    formContainer: {
      padding: isMobile ? "16px" : "20px",
    },
    formSection: {
      marginBottom: isMobile ? "24px" : "32px",
      paddingBottom: isMobile ? "16px" : "24px",
      borderBottom: "1px solid #e2e8f0",
    },
    sectionTitle: {
      color: "#1e293b",
      fontSize: isMobile ? "15px" : "16px",
      fontWeight: "600",
      margin: "0 0 16px 0",
      display: "flex",
      alignItems: "center",
    },
    formGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: isMobile ? "16px" : "24px",
      marginBottom: isMobile ? "16px" : "24px",
    },
    formGroup: {
      display: "flex",
      flexDirection: "column",
    },
    label: {
      color: "#1e293b",
      fontSize: isMobile ? "13px" : "14px",
      fontWeight: "500",
      marginBottom: isMobile ? "6px" : "8px",
      display: "flex",
      alignItems: "center",
    },
    input: {
      padding: isMobile ? "10px 12px" : "10px 14px",
      borderRadius: "8px",
      border: "1.5px solid #e2e8f0",
      fontSize: isMobile ? "13px" : "14px",
      color: "#1e293b",
      background: "#ffffff",
      transition: "all 0.2s ease",
      width: "100%",
      boxSizing: "border-box",
    },
    inputFocus: {
      outline: "none",
      borderColor: "#2563eb",
      boxShadow: "0 0 0 3px rgba(37, 99, 235, 0.1)",
    },
    select: {
      padding: isMobile ? "10px 12px" : "10px 14px",
      paddingRight: isMobile ? "36px" : "40px",
      borderRadius: "8px",
      border: "1.5px solid #e2e8f0",
      fontSize: isMobile ? "13px" : "14px",
      color: "#1e293b",
      background: "#ffffff",
      cursor: "pointer",
      appearance: "none",
      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
      backgroundRepeat: "no-repeat",
      backgroundPosition: isMobile ? "right 12px center" : "right 14px center",
      backgroundSize: "16px",
      width: "100%",
      boxSizing: "border-box",
    },
    submitButton: {
      width: "100%",
      padding: isMobile ? "12px 20px" : "14px 28px",
      background: "#2563eb",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: isMobile ? "14px" : "15px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      boxSizing: "border-box",
    },
    submitButtonHover: {
      background: "#1d4ed8",
      transform: "translateY(-1px)",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    },
    submitButtonDisabled: {
      background: "#94a3b8",
      cursor: "not-allowed",
      opacity: "0.7",
    },
    message: {
      marginTop: isMobile ? "16px" : "24px",
      padding: isMobile ? "12px" : "16px",
      borderRadius: "8px",
      fontSize: isMobile ? "13px" : "14px",
      fontWeight: "500",
      textAlign: "center",
      animation: "slideIn 0.3s ease",
    },
    messageSuccess: {
      background: "rgba(5, 150, 105, 0.1)",
      color: "#059669",
      border: "1px solid rgba(5, 150, 105, 0.2)",
    },
    messageError: {
      background: "rgba(220, 38, 38, 0.1)",
      color: "#dc2626",
      border: "1px solid rgba(220, 38, 38, 0.2)",
    },
    modalOverlay: {
      position: "fixed",
      top: "0",
      left: "0",
      right: "0",
      bottom: "0",
      background: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "1000",
      padding: isMobile ? "16px" : "20px",
    },
    modalContainer: {
      background: "#ffffff",
      borderRadius: isMobile ? "8px" : "12px",
      width: "100%",
      maxWidth: "400px",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    },
    modalHeader: {
      padding: isMobile ? "16px" : "20px",
      borderBottom: "1px solid #e2e8f0",
    },
    modalBody: {
      padding: isMobile ? "16px" : "20px",
    },
    modalActions: {
      padding: isMobile ? "16px" : "20px",
      borderTop: "1px solid #e2e8f0",
      display: "flex",
      gap: isMobile ? "8px" : "12px",
      flexDirection: isMobile ? "column" : "row",
    },
    modalCancel: {
      flex: "1",
      padding: isMobile ? "10px" : "12px",
      background: "transparent",
      color: "#64748b",
      border: "1.5px solid #e2e8f0",
      borderRadius: "8px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s ease",
      fontSize: isMobile ? "13px" : "14px",
    },
    modalDelete: {
      flex: "1",
      padding: isMobile ? "10px" : "12px",
      background: "#dc2626",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s ease",
      fontSize: isMobile ? "13px" : "14px",
    },
    backButton: {
      position: isMobile ? "relative" : "absolute",
      top: isMobile ? "0" : "20px",
      left: isMobile ? "0" : "20px",
      right: isMobile ? "auto" : "auto",
      bottom: isMobile ? "auto" : "auto",
      background: "#f8fafc",
      border: "1.5px solid #e2e8f0",
      color: "#64748b",
      fontSize: isMobile ? "13px" : "14px",
      fontWeight: "500",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: isMobile ? "8px 12px" : "8px 16px",
      borderRadius: "8px",
      transition: "all 0.2s ease",
      marginBottom: isMobile ? "16px" : "0",
      width: isMobile ? "100%" : "auto",
      justifyContent: "center",
    },
    backButtonHover: {
      background: "#ffffff",
      borderColor: "#2563eb",
      color: "#2563eb",
      boxShadow: "0 2px 4px rgba(37, 99, 235, 0.1)",
    },
    buttonRow: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? "12px" : "12px",
      width: "100%",
    },
    resetButton: {
      flex: "1",
      padding: isMobile ? "12px 20px" : "14px 28px",
      background: "transparent",
      color: "#64748b",
      border: "1.5px solid #e2e8f0",
      borderRadius: "8px",
      fontSize: isMobile ? "14px" : "15px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s ease",
      boxSizing: "border-box",
      width: isMobile ? "100%" : "auto",
    },
    userDetails: {
      borderTop: "1px solid #e2e8f0",
      paddingTop: isMobile ? "8px" : "12px",
    },
    detailText: {
      color: "#64748b",
      fontSize: isMobile ? "11px" : "12px",
      margin: "4px 0",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    fileInputLabel: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: isMobile ? "12px" : "16px",
      border: "2px dashed #e2e8f0",
      borderRadius: "8px",
      background: "#f8fafc",
      cursor: "pointer",
      transition: "all 0.2s ease",
      fontSize: isMobile ? "13px" : "14px",
    },
    fileInputText: {
      flex: "1",
      color: "#64748b",
      fontSize: isMobile ? "13px" : "14px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    fileButton: {
      padding: isMobile ? "6px 16px" : "8px 20px",
      background: "#2563eb",
      color: "white",
      borderRadius: "6px",
      fontSize: isMobile ? "12px" : "13px",
      fontWeight: "500",
      transition: "all 0.2s ease",
      whiteSpace: "nowrap",
    },
    selectedFile: {
      padding: isMobile ? "8px 12px" : "12px 16px",
      background: "rgba(5, 150, 105, 0.05)",
      border: "1px solid rgba(5, 150, 105, 0.2)",
      borderRadius: "8px",
      color: "#059669",
      fontSize: isMobile ? "12px" : "13px",
      fontWeight: "500",
      marginTop: "12px",
    },
    // Add keyframes for animations
    keyframes: `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `,
  };

  // Add CSS keyframes to head
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles.keyframes;
    document.head.appendChild(styleSheet);
    
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("https://attendance-backend-d4vi.onrender.comauth/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    setProfile(e.target.files[0]);
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setFormData({
      employee_id: user.employee_id || "",
      designation: user.designation || "",
      username: user.username || "",
      email: user.email || "",
      name: user.name || "",
      mobile: user.mobile || "",
      ien: user.ien || "",
      role: user.role || "admin",
      password: "",
    });
  };

  const resetForm = () => {
    setFormData({
      employee_id: "",
      designation: "",
      username: "",
      email: "",
      name: "",
      mobile: "",
      ien: "",
      role: "admin",
      password: "",
    });
    setProfile(null);
    setSelectedUser(null);
    setAction("create");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== "") {
        data.append(key, value);
      }
    });

    if (profile) {
      data.append("profile", profile);
    }

    try {
      let url, method;

      switch (action) {
        case "create":
          url = "https://attendance-backend-d4vi.onrender.comauth/create-user";
          method = "POST";
          break;
        case "update":
          url = `https://attendance-backend-d4vi.onrender.comauth/update-user/${formData.employee_id}`;
          method = "PUT";
          break;
        case "partial":
          url = `https://attendance-backend-d4vi.onrender.comauth/update-user/${formData.employee_id}`;
          method = "PATCH";
          break;
        default:
          throw new Error("Invalid action");
      }

      const response = await fetch(url, {
        method,
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Operation failed");
      }

      setMessage(`✅ ${action === 'create' ? 'User created' : 'User updated'} successfully`);
      resetForm();
      fetchUsers();
    } catch (error) {
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://attendance-backend-d4vi.onrender.comauth/delete-user/${userToDelete.employee_id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Delete failed");
      }

      setMessage(`✅ User deleted successfully`);
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      resetForm();
      fetchUsers();
    } catch (error) {
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <div style={styles.header}>
          <button
            onClick={() => window.history.back()}
            style={styles.backButton}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#ffffff"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
          >
            ← Back
          </button>
          <h2 style={styles.headerTitle}>User Management System</h2>
          <p style={styles.headerSubtitle}>
            Create, update, or delete user accounts
          </p>
        </div>

        {/* Action Selector */}
        <div style={styles.actionTabs}>
          <button
            style={{
              ...styles.actionTab,
              ...(action === "create" ? styles.actionTabActive : {})
            }}
            onClick={() => resetForm()}
          >
            Create User
          </button>
          <button
            style={{
              ...styles.actionTab,
              ...(action === "update" ? styles.actionTabActive : {}),
              ...(!selectedUser ? styles.actionTabDisabled : {})
            }}
            onClick={() => setAction("update")}
            disabled={!selectedUser}
          >
            Full Update
          </button>
          <button
            style={{
              ...styles.actionTab,
              ...(action === "partial" ? styles.actionTabActive : {}),
              ...(!selectedUser ? styles.actionTabDisabled : {})
            }}
            onClick={() => setAction("partial")}
            disabled={!selectedUser}
          >
            Partial Update
          </button>
          <button
            style={{
              ...styles.actionTab,
              ...(!selectedUser ? styles.actionTabDisabled : {})
            }}
            onClick={() => {
              if (selectedUser) handleDeleteClick(selectedUser);
            }}
            disabled={!selectedUser}
          >
            Delete User
          </button>
        </div>

        <div style={styles.managementContainer}>
          {/* User List Panel */}
          <div style={styles.userListPanel}>
            <div style={styles.panelHeader}>
              <h3 style={styles.panelTitle}>User Directory</h3>
              <div style={styles.searchBox}>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.searchInput}
                />
                <span style={styles.searchIcon}>🔍</span>
              </div>
            </div>
            
            <div style={styles.userList}>
              {filteredUsers.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                  <p>No users found</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.employee_id}
                    style={{
                      ...styles.userCard,
                      ...(selectedUser?.employee_id === user.employee_id ? styles.userCardSelected : {})
                    }}
                    onClick={() => handleSelectUser(user)}
                  >
                    <div style={styles.userCardHeader}>
                      <div style={styles.userAvatar}>
                        {user.profile_url ? (
                          <img 
                            src={user.profile_url} 
                            alt={user.name} 
                            style={{ 
                              width: "100%", 
                              height: "100%", 
                              objectFit: "cover" 
                            }} 
                          />
                        ) : (
                          <span>{user.name?.charAt(0) || "U"}</span>
                        )}
                      </div>
                      <div style={styles.userInfo}>
                        <h4 style={styles.userName}>{user.name || "Unnamed User"}</h4>
                        <p style={styles.userEmail}>{user.email}</p>
                      </div>
                      <span style={{
                        ...styles.roleBadge,
                        ...(user.role === "admin" ? styles.roleBadgeAdmin : styles.roleBadgeUser)
                      }}>
                        {user.role}
                      </span>
                    </div>
                    <div style={styles.userDetails}>
                      <p style={styles.detailText}>
                        <strong>ID:</strong> {user.employee_id}
                      </p>
                      <p style={styles.detailText}>
                        <strong>Designation:</strong> {user.designation || "-"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Form Panel */}
          <div style={styles.formPanel}>
            <div style={styles.formHeader}>
              <h3 style={styles.panelTitle}>
                {action === "create" && "Create New User"}
                {action === "update" && "Full Update User"}
                {action === "partial" && "Partial Update User"}
              </h3>
              {selectedUser && (
                <div style={{ 
                  background: "rgba(37, 99, 235, 0.05)",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  borderLeft: "3px solid #2563eb",
                  marginTop: "8px"
                }}>
                  <p style={{ 
                    color: "#64748b", 
                    fontSize: isMobile ? "12px" : "13px", 
                    margin: "0",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>
                    Editing: <strong>{selectedUser.name}</strong> ({selectedUser.employee_id})
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} style={styles.formContainer}>
              {action === "create" && (
                <div style={styles.formSection}>
                  <h3 style={styles.sectionTitle}>Basic Information</h3>
                  <div style={styles.formGrid}>
                    <div style={styles.formGroup}>
                      <label htmlFor="employee_id" style={styles.label}>Employee ID *</label>
                      <input
                        id="employee_id"
                        name="employee_id"
                        placeholder="Enter employee ID"
                        value={formData.employee_id}
                        onChange={handleChange}
                        required
                        style={styles.input}
                      />
                    </div>
                    
                    <div style={styles.formGroup}>
                      <label htmlFor="designation" style={styles.label}>Designation</label>
                      <input
                        id="designation"
                        name="designation"
                        placeholder="Enter designation"
                        value={formData.designation}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>
                  </div>
                </div>
              )}

              {(action === "create" || action === "update") && (
                <>
                  <div style={styles.formSection}>
                    <h3 style={styles.sectionTitle}>Account Details</h3>
                    <div style={styles.formGrid}>
                      <div style={styles.formGroup}>
                        <label htmlFor="username" style={styles.label}>Username *</label>
                        <input
                          id="username"
                          name="username"
                          placeholder="Enter username"
                          value={formData.username}
                          onChange={handleChange}
                          required
                          style={styles.input}
                        />
                      </div>
                      
                      <div style={styles.formGroup}>
                        <label htmlFor="email" style={styles.label}>Email Address *</label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="Enter email address"
                          value={formData.email}
                          onChange={handleChange}
                          required={action === "create"}
                          disabled={action === "update"}
                          style={{
                            ...styles.input,
                            ...(action === "update" ? { 
                              background: "#f8fafc", 
                              color: "#94a3b8", 
                              cursor: "not-allowed" 
                            } : {})
                          }}
                        />
                        {action === "update" && (
                          <small style={{ 
                            color: "#94a3b8", 
                            fontSize: "12px", 
                            marginTop: "4px", 
                            display: "block" 
                          }}>
                            Email cannot be changed
                          </small>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={styles.formSection}>
                    <h3 style={styles.sectionTitle}>Personal Information</h3>
                    <div style={styles.formGrid}>
                      <div style={styles.formGroup}>
                        <label htmlFor="name" style={styles.label}>Full Name *</label>
                        <input
                          id="name"
                          name="name"
                          placeholder="Enter full name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          style={styles.input}
                        />
                      </div>
                      
                      <div style={styles.formGroup}>
                        <label htmlFor="mobile" style={styles.label}>Mobile Number</label>
                        <input
                          id="mobile"
                          name="mobile"
                          placeholder="Enter mobile number"
                          value={formData.mobile}
                          onChange={handleChange}
                          style={styles.input}
                        />
                      </div>
                    </div>
                    
                    <div style={{ ...styles.formGroup, ...(isMobile ? {} : { gridColumn: "span 2" }) }}>
                      <label htmlFor="ien" style={styles.label}>Emergency Contact (IEN)</label>
                      <input
                        id="ien"
                        name="ien"
                        placeholder="Enter emergency contact number"
                        value={formData.ien}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>
                  </div>

                  <div style={styles.formSection}>
                    <h3 style={styles.sectionTitle}>Security & Role</h3>
                    <div style={styles.formGrid}>
                      <div style={styles.formGroup}>
                        <label htmlFor="role" style={styles.label}>User Role *</label>
                        <select
                          id="role"
                          name="role"
                          value={formData.role}
                          onChange={handleChange}
                          style={styles.select}
                        >
                          <option value="admin">Administrator</option>
                          <option value="user">Standard User</option>
                        </select>
                      </div>
                      
                      <div style={styles.formGroup}>
                        <label htmlFor="password" style={styles.label}>
                          {action === "create" ? "Password *" : "New Password"}
                        </label>
                        <input
                          id="password"
                          name="password"
                          type="password"
                          placeholder={
                            action === "create" 
                              ? "Enter password" 
                              : "Enter new password (leave blank to keep current)"
                          }
                          value={formData.password}
                          onChange={handleChange}
                          required={action === "create"}
                          style={styles.input}
                        />
                        {action === "update" && (
                          <small style={{ 
                            color: "#94a3b8", 
                            fontSize: "12px", 
                            marginTop: "4px", 
                            display: "block" 
                          }}>
                            Leave blank to keep current password
                          </small>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={styles.formSection}>
                    <h3 style={styles.sectionTitle}>Profile Picture</h3>
                    <div>
                      <label style={styles.fileInputLabel}>
                        <span style={{ fontSize: isMobile ? "18px" : "20px", color: "#64748b" }}>📁</span>
                        <span style={styles.fileInputText}>
                          {profile ? profile.name : "Choose profile picture"}
                        </span>
                        <span style={styles.fileButton}>
                          Browse
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          style={{ display: "none" }}
                        />
                      </label>
                      {profile && (
                        <div style={styles.selectedFile}>
                          Selected: {profile.name}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {action === "partial" && (
                <div style={styles.formSection}>
                  <h3 style={styles.sectionTitle}>Partial Update</h3>
                  <p style={{ 
                    color: "#64748b", 
                    fontSize: isMobile ? "12px" : "13px", 
                    margin: isMobile ? "-4px 0 12px 0" : "-8px 0 16px 0" 
                  }}>
                    Update only the fields you want to change
                  </p>
                  
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
                    gap: isMobile ? "16px" : "20px" 
                  }}>
                    <div style={styles.formGroup}>
                      <label htmlFor="name" style={styles.label}>Full Name</label>
                      <input
                        id="name"
                        name="name"
                        placeholder="Enter new full name"
                        value={formData.name}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>
                    
                    <div style={styles.formGroup}>
                      <label htmlFor="mobile" style={styles.label}>Mobile Number</label>
                      <input
                        id="mobile"
                        name="mobile"
                        placeholder="Enter new mobile number"
                        value={formData.mobile}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>
                    
                    <div style={styles.formGroup}>
                      <label htmlFor="designation" style={styles.label}>Designation</label>
                      <input
                        id="designation"
                        name="designation"
                        placeholder="Enter new designation"
                        value={formData.designation}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>
                    
                    <div style={styles.formGroup}>
                      <label htmlFor="role" style={styles.label}>User Role</label>
                      <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        style={styles.select}
                      >
                        <option value="">Keep current role</option>
                        <option value="admin">Administrator</option>
                        <option value="user">Standard User</option>
                      </select>
                    </div>
                    
                    <div style={{ ...styles.formGroup, ...(isMobile ? {} : { gridColumn: "span 2" }) }}>
                      <label htmlFor="password" style={styles.label}>New Password</label>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Enter new password (leave blank to keep current)"
                        value={formData.password}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ 
                marginTop: isMobile ? "32px" : "40px", 
                paddingTop: isMobile ? "20px" : "24px", 
                borderTop: "1px solid #e2e8f0" 
              }}>
                <div style={styles.buttonRow}>
                  <button 
                    type="submit" 
                    disabled={loading}
                    style={{
                      ...styles.submitButton,
                      ...(loading ? styles.submitButtonDisabled : {})
                    }}
                  >
                    {loading ? (
                      <>
                        <span style={{ 
                          width: "18px", 
                          height: "18px", 
                          border: "2px solid rgba(255, 255, 255, 0.3)", 
                          borderTopColor: "white", 
                          borderRadius: "50%", 
                          animation: "spin 0.8s linear infinite" 
                        }}></span>
                        {action === "create" && "Creating User..."}
                        {action === "update" && "Updating User..."}
                        {action === "partial" && "Updating User..."}
                      </>
                    ) : (
                      <>
                        {action === "create" && "Create User Account"}
                        {action === "update" && "Update User Account"}
                        {action === "partial" && "Update Selected Fields"}
                      </>
                    )}
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={resetForm}
                    style={styles.resetButton}
                    disabled={loading}
                  >
                    Reset Form
                  </button>
                </div>
              </div>

              {message && (
                <div style={{
                  ...styles.message,
                  ...(message.includes('✅') ? styles.messageSuccess : styles.messageError)
                }}>
                  {message}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && userToDelete && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContainer}>
              <div style={styles.modalHeader}>
                <h3 style={styles.panelTitle}>Confirm Deletion</h3>
              </div>
              <div style={styles.modalBody}>
                <p style={{ color: "#64748b", margin: "0 0 12px 0", fontSize: isMobile ? "13px" : "14px" }}>
                  Are you sure you want to delete user <strong>{userToDelete.name}</strong>?
                </p>
                <p style={{ 
                  color: "#dc2626", 
                  fontSize: isMobile ? "12px" : "13px", 
                  background: "rgba(220, 38, 38, 0.05)", 
                  padding: "12px", 
                  borderRadius: "6px", 
                  borderLeft: "3px solid #dc2626", 
                  margin: "0" 
                }}>
                  ⚠️ This action cannot be undone. All user data will be permanently deleted.
                </p>
              </div>
              <div style={styles.modalActions}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={styles.modalCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  style={styles.modalDelete}
                  disabled={loading}
                >
                  {loading ? "Deleting..." : "Delete User"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;