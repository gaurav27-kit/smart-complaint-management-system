import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Search,
  Building2,
  ShieldCheck,
  UserCheck,
  Trash2,
  RotateCcw,
  X,
  Loader2,
  Mail,
  Phone,
  Key,
  IdCard,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getDepartments,
  getDepartmentMembers,
  createDepartmentMember,
  deleteDepartmentMember,
  reactivateDepartmentMember,
} from "../../services/adminService";
import { getMemberProfile } from "../../services/dashboardService";
import { useAuth } from "../../context/AuthContext";

const DepartmentMembers = () => {
  const { user } = useAuth();
  const isDeptHead = user?.role === "department_member";
  const [headDept, setHeadDept] = useState(null);

  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);

  // Modal & Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    employeeId: "",
    password: "",
    departmentId: "",
    deptRole: "FIELD_OFFICER",
  });

  // Action loading state
  const [actionId, setActionId] = useState(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);

      if (isDeptHead && !headDept) {
        try {
          const profileRes = await getMemberProfile();
          if (profileRes.department) {
            setHeadDept(profileRes.department);
            setFormData((prev) => ({
              ...prev,
              departmentId: profileRes.department._id || profileRes.department,
              deptRole: "FIELD_OFFICER",
            }));
          }
        } catch {
          // ignore error if not a department member
        }
      }

      const [membersRes, deptsRes] = await Promise.all([
        getDepartmentMembers(selectedDept, { includeInactive }),
        getDepartments(),
      ]);
      const loadedDepts = Array.isArray(deptsRes.departments)
        ? deptsRes.departments
        : Array.isArray(deptsRes)
        ? deptsRes
        : [];
      setMembers(membersRes.members || []);
      setDepartments(loadedDepts);
      if (loadedDepts.length > 0 && !formData.departmentId && !isDeptHead) {
        setFormData((prev) => ({ ...prev, departmentId: loadedDepts[0]._id }));
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load department members."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDept, includeInactive]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password) {
      toast.error("Full Name, Email, and Temporary Password are required.");
      return;
    }

    if (!formData.departmentId) {
      toast.error("Please select a department.");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await createDepartmentMember(formData);
      toast.success(res.message || "Department member created successfully!");
      setIsModalOpen(false);
      setFormData({
        fullName: "",
        email: "",
        phoneNumber: "",
        employeeId: "",
        password: "",
        departmentId: isDeptHead && headDept ? (headDept._id || headDept) : (departments[0]?._id || ""),
        deptRole: "FIELD_OFFICER",
      });
      fetchData();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to create department member."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivateMember = async (memberId) => {
    if (!window.confirm("Are you sure you want to deactivate this department member?")) {
      return;
    }

    try {
      setActionId(memberId);
      await deleteDepartmentMember(memberId);
      toast.success("Department member deactivated successfully.");
      fetchData();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to deactivate department member."
      );
    } finally {
      setActionId(null);
    }
  };

  const handleReactivateMember = async (memberId) => {
    try {
      setActionId(memberId);
      await reactivateDepartmentMember(memberId);
      toast.success("Department member reactivated successfully.");
      fetchData();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to reactivate department member."
      );
    } finally {
      setActionId(null);
    }
  };

  // Client-side filtering
  const filteredMembers = members.filter((member) => {
    const name = member.user?.fullName?.toLowerCase() || "";
    const email = member.user?.email?.toLowerCase() || "";
    const empId = member.user?.employeeId?.toLowerCase() || "";
    const matchesSearch =
      name.includes(search.toLowerCase()) ||
      email.includes(search.toLowerCase()) ||
      empId.includes(search.toLowerCase());
    const matchesRole = selectedRole ? member.deptRole === selectedRole : true;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2.5 rounded-lg text-blue-600">
              <Users className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Department Members</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage department staff accounts, Employee IDs, roles, and status.
          </p>
        </div>

        <button
          onClick={() => {
            if (isDeptHead && headDept) {
              setFormData((prev) => ({
                ...prev,
                departmentId: headDept._id || headDept,
                deptRole: "FIELD_OFFICER",
              }));
            } else if (departments.length > 0 && !formData.departmentId) {
              setFormData((prev) => ({ ...prev, departmentId: departments[0]._id }));
            }
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-5 h-5" />
          Create Member
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-3/4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search by name, email, or EMP ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Filter by Department */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name} ({dept.code})
              </option>
            ))}
          </select>

          {/* Filter by Department Role */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
          >
            <option value="">All Department Roles</option>
            <option value="HEAD">HEAD</option>
            <option value="FIELD_OFFICER">FIELD_OFFICER</option>
          </select>
        </div>

        {/* Toggle Deactivated Members */}
        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-600 hover:text-gray-800 shrink-0">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
          />
          Include Deactivated Members
        </label>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700">No Department Members Found</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
              No personnel match your filter criteria or no members have been created yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Member & Employee ID</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Dept Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredMembers.map((member) => (
                  <tr key={member._id} className={`hover:bg-gray-50/80 transition-colors ${!member.isActive ? "bg-gray-50/50" : ""}`}>
                    {/* Member Name & Employee ID */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full font-bold flex items-center justify-center text-sm shrink-0 ${member.isActive ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-600"}`}>
                          {member.user?.fullName?.charAt(0).toUpperCase() || "M"}
                        </div>
                        <div>
                          <p className={`font-semibold ${member.isActive ? "text-gray-900" : "text-gray-500 line-through"}`}>
                            {member.user?.fullName || "N/A"}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {member.user?.employeeId && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                <IdCard className="w-3 h-3 text-slate-500" />
                                {member.user.employeeId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <p className="text-gray-700 font-medium flex items-center gap-1.5 text-xs">
                          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          {member.user?.email}
                        </p>
                        {member.user?.phoneNumber && (
                          <p className="text-gray-500 flex items-center gap-1.5 text-xs">
                            <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            {member.user.phoneNumber}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        {member.department?.name || "General Department"}
                      </span>
                    </td>

                    {/* Department Role */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          member.deptRole === "HEAD"
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : "bg-blue-100 text-blue-800 border border-blue-200"
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        {member.deptRole}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      {member.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          Deactivated
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      {member.isActive ? (
                        <button
                          onClick={() => handleDeactivateMember(member._id)}
                          disabled={actionId === member._id}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Deactivate Member (Soft Delete)"
                        >
                          {actionId === member._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivateMember(member._id)}
                          disabled={actionId === member._id}
                          className="text-emerald-600 hover:text-emerald-800 p-2 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Reactivate Member"
                        >
                          {actionId === member._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RotateCcw className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Create Department Member</h3>
                  <p className="text-xs text-gray-500">
                    Add a new user and assign department role
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateMember} className="p-6 space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="e.g. Sarah Jenkins"
                    required
                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g. sarah.j@citygov.org"
                    required
                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Phone & Employee ID Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="e.g. +1 555-0192"
                      className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Employee ID (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Employee ID <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <IdCard className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleInputChange}
                      placeholder="Auto (e.g. EMP0001)"
                      className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Temporary Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Temporary Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Department & Role Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Department Selection */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Department <span className="text-red-500">*</span>
                    {isDeptHead && (
                      <span className="ml-2 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-normal">
                        Read Only
                      </span>
                    )}
                  </label>
                  {isDeptHead ? (
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={headDept ? `${headDept.name} (${headDept.code})` : "Your Department"}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-100 text-gray-600 cursor-not-allowed font-medium"
                    />
                  ) : (
                    <select
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="" disabled>Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Department Role Selection */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Department Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="deptRole"
                    value={formData.deptRole}
                    onChange={handleInputChange}
                    required
                    disabled={isDeptHead}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                      isDeptHead ? "bg-gray-100 text-gray-600 cursor-not-allowed" : "bg-white"
                    }`}
                  >
                    {!isDeptHead && <option value="HEAD">HEAD (Max 1 per dept)</option>}
                    <option value="FIELD_OFFICER">FIELD_OFFICER</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Member"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentMembers;
