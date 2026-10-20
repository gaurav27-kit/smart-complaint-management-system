import jwt from "jsonwebtoken";
import User from "../models/User.js";
import DepartmentMember from "../models/DepartmentMember.js";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("+isActive +passwordChangedAt");
    if (!user || user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: "Account is inactive or no longer exists.",
      });
    }

    if (user.passwordChangedAt) {
      const changedTimestamp = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < changedTimestamp) {
        return res.status(401).json({
          success: false,
          message: "Password was recently changed. Please log in again.",
        });
      }
    }

    if (user.role === "department_member") {
      const member = await DepartmentMember.findOne({ user: user._id }).select("isActive");
      if (member && member.isActive === false) {
        return res.status(401).json({
          success: false,
          message: "Department member account has been deactivated.",
        });
      }
    }

    req.user = {
      ...decoded,
      _id: user._id,
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      fullName: user.fullName,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

export default authMiddleware;
