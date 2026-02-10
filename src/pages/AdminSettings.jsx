import React, { useState, useEffect, useContext } from "react";
import { motion } from "framer-motion";
import {
  Save,
  Search,
  User,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle
} from "lucide-react";
import { AuthContext } from "../App";

const AdminSettings = () => {
  const { showNotification } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);

  // Available pages to control access for
  const AVAILABLE_PAGES = [
    "Attendance",
    "Travel",
    "History",
    "Video",
    "License",
    "Local Travel",
    "Local Travel History",
    "OTR",
    "Report"
  ];

  const SPREADSHEET_ID = "1q9fSzJEIj7QpmHEVlAuvgkUaU7VGOJpyF171TiWGrdA";
  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx2k73Y40yVytGHKfS0NMV5Ct72rgMkfD0JUj7ZKpYSr3PjZeWnOrMR8Lr1bnvDDIUH/exec";

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const masterSheetUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=Master`;
      const response = await fetch(masterSheetUrl);
      const text = await response.text();

      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}") + 1;
      const jsonData = text.substring(jsonStart, jsonEnd);
      const data = JSON.parse(jsonData);

      if (data?.table?.rows) {
        const parsedUsers = data.table.rows.map((row, index) => {
          const accessValue = row.c?.[4]?.v || "";
          let userAccess = [];

          if (accessValue === "all") {
            userAccess = [...AVAILABLE_PAGES];
          } else if (typeof accessValue === "string") {
            userAccess = accessValue.split(",").map(item => item.trim());
          }

          return {
            id: index, // Using index as ID since we don't have a unique ID in the sheet
            rowIndex: index + 1, // Row index for update (0-based in array, 1-based in sheet, header is 1)
            name: row.c?.[0]?.v || "Unknown",
            username: row.c?.[1]?.v || "",
            role: row.c?.[3]?.v || "user",
            access: userAccess,
            originalAccess: accessValue // Store original to track changes if needed
          };
        }).filter(user => user.username); // Filter out empty rows

        setUsers(parsedUsers);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      showNotification("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAccessToggle = (userId, page) => {
    setUsers(users.map(user => {
      if (user.id === userId) {
        const hasAccess = user.access.includes(page);
        let newAccess;
        if (hasAccess) {
          newAccess = user.access.filter(p => p !== page);
        } else {
          newAccess = [...user.access, page];
        }
        return { ...user, access: newAccess };
      }
      return user;
    }));
  };

  const handleSelectAll = (userId) => {
    setUsers(users.map(user => {
      if (user.id === userId) {
        const allSelected = AVAILABLE_PAGES.every(page => user.access.includes(page));
        return {
          ...user,
          access: allSelected ? [] : [...AVAILABLE_PAGES]
        };
      }
      return user;
    }));
  };

  const saveChanges = async (user) => {
    try {
      setSaving(true);
      const accessString = user.access.join(",");

      const formData = new URLSearchParams();
      formData.append("action", "updateUserAccess");
      formData.append("username", user.username);
      formData.append("access", accessString);

      // Using fetch with no-cors mode since we can't read the response due to CORS
      // but the request will still go through
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: formData,
        mode: 'no-cors'
      });

      showNotification(`Updated access for ${user.name}`, "success");

    } catch (error) {
      console.error("Error saving changes:", error);
      showNotification("Failed to save changes", "error");
    } finally {
      setSaving(false);
    }
  };

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    password: "",
    role: "user",
    employeeType: "Out Of Office",
    latitude: "",
    longitude: "",
    range: "",
    access: []
  });

  const handleAddUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleAddUserAccessToggle = (page) => {
    setNewUser(prev => {
      const hasAccess = prev.access.includes(page);
      return {
        ...prev,
        access: hasAccess ? prev.access.filter(p => p !== page) : [...prev.access, page]
      };
    });
  };

  const handleAddUserSelectAll = () => {
    setNewUser(prev => ({
      ...prev,
      access: prev.access.length === AVAILABLE_PAGES.length ? [] : [...AVAILABLE_PAGES]
    }));
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();

    if (!newUser.name || !newUser.username || !newUser.password) {
      showNotification("Please fill in all required fields", "error");
      return;
    }

    try {
      setSaving(true);
      const accessString = newUser.access.length === AVAILABLE_PAGES.length ? "all" : newUser.access.join(",");

      const formData = new URLSearchParams();
      formData.append("action", "addUser");
      formData.append("name", newUser.name);
      formData.append("username", newUser.username);
      formData.append("password", newUser.password);
      formData.append("role", newUser.role);
      formData.append("employeeType", newUser.employeeType);
      formData.append("latitude", newUser.latitude);
      formData.append("longitude", newUser.longitude);
      formData.append("range", newUser.range);
      formData.append("access", accessString);

      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: formData,
        mode: 'no-cors'
      });

      showNotification(`User ${newUser.name} added successfully (refresh to see)`, "success");
      setIsAddUserModalOpen(false);
      setNewUser({
        name: "",
        username: "",
        password: "",
        role: "user",
        employeeType: "Out Of Office",
        latitude: "",
        longitude: "",
        range: "",
        access: []
      });
      // Optionally fetch users again after a delay
      setTimeout(fetchUsers, 2000);

    } catch (error) {
      console.error("Error adding user:", error);
      showNotification("Failed to add user", "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 relative">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Access Management
            </h1>
            <p className="text-gray-500 mt-1">Manage page access permissions for all users</p>
          </div>

          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm w-full sm:w-64 bg-white"
              />
            </div>
            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl shadow-md transition-colors flex items-center gap-2"
            >
              <User className="w-4 h-4" /> Add User
            </button>
          </div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6"
        >
          {filteredUsers.map((user) => (
            <motion.div
              key={user.id}
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* User Info */}
                  <div className="flex items-center gap-4 min-w-[250px]">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <User className="w-3 h-3" />
                        <span>{user.username}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${user.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-emerald-100 text-emerald-700'
                          }`}>
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Permissions Grid */}
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <button
                        onClick={() => handleSelectAll(user.id)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                      >
                        {AVAILABLE_PAGES.every(page => user.access.includes(page))
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {AVAILABLE_PAGES.map((page) => {
                        const hasAccess = user.access.includes(page);
                        return (
                          <button
                            key={page}
                            onClick={() => handleAccessToggle(user.id, page)}
                            className={`
                              relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border
                              ${hasAccess
                                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100"}
                            `}
                          >
                            {hasAccess ? (
                              <CheckCircle className="w-3.5 h-3.5" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            {page}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6 mt-4 lg:mt-0">
                    <button
                      onClick={() => saveChanges(user)}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-200"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>Save Access</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No users found</h3>
              <p className="text-gray-500">Try adjusting your search terms</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Add New Employee</h2>
              <button onClick={() => setIsAddUserModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sales Person Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={newUser.name}
                    onChange={handleAddUserChange}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={newUser.username}
                    onChange={handleAddUserChange}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="text" // Visible for admin convenience or password type
                    name="password"
                    value={newUser.password}
                    onChange={handleAddUserChange}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    name="role"
                    value={newUser.role}
                    onChange={handleAddUserChange}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee Type</label>
                  <select
                    name="employeeType"
                    value={newUser.employeeType}
                    onChange={handleAddUserChange}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Out Of Office">Out Of Office</option>
                    <option value="In Office">In Office</option>
                  </select>
                </div>
              </div>

              {newUser.employeeType === "In Office" && (
                <div className="bg-indigo-50 p-4 rounded-xl space-y-4 border border-indigo-100">
                  <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Geofencing Settings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-indigo-900 mb-1">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        name="latitude"
                        value={newUser.latitude}
                        onChange={handleAddUserChange}
                        className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="e.g. 28.6139"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-indigo-900 mb-1">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        name="longitude"
                        value={newUser.longitude}
                        onChange={handleAddUserChange}
                        className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="e.g. 77.2090"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-indigo-900 mb-1">Range (Meters)</label>
                      <input
                        type="number"
                        name="range"
                        value={newUser.range}
                        onChange={handleAddUserChange}
                        className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="e.g. 50"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Page Access</label>
                  <button
                    type="button"
                    onClick={handleAddUserSelectAll}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    {newUser.access.length === AVAILABLE_PAGES.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_PAGES.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => handleAddUserAccessToggle(page)}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border
                        ${newUser.access.includes(page)
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                          : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100"}
                      `}
                    >
                      {newUser.access.includes(page) ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      {page}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-6 py-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Create User
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default AdminSettings;
