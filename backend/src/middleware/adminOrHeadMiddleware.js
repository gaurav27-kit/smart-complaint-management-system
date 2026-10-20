import DepartmentMember from "../models/DepartmentMember.js";

/**
 * @file adminOrHeadMiddleware.js
 * @description Middleware allowing access to Admins OR active Department HEADs.
 */
export const adminOrHeadMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (req.user.role === "admin") {
      return next();
    }

    if (req.user.role === "department_member") {
      const callerRecord = await DepartmentMember.findOne({ user: req.user.id })
        .select("department deptRole isActive")
        .lean();

      const isCallerActiveHead =
        callerRecord &&
        (callerRecord.isActive === undefined || callerRecord.isActive === true) &&
        callerRecord.deptRole === "HEAD";

      if (isCallerActiveHead) {
        req.memberHeadDepartment = callerRecord.department;
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: "Access denied. Admin or Department Head authorization required.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error in department authorization.",
    });
  }
};
