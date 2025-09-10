// Importing required modules
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../models/User");

// Configuring dotenv to load environment variables from .env file
dotenv.config();

// This function is used as middleware to authenticate user requests
exports.auth = async (req, res, next) => {
  try {
    console.log("✅ [auth middleware] Entered");

    // Extracting JWT from request cookies, body or header
    const token =
      req.cookies.token ||
      req.body.token ||
      req.header("Authorization")?.replace("Bearer ", "");

    console.log("👉 Received Token:", token);

    // If JWT is missing, return 401 Unauthorized response
    if (!token) {
      console.warn("⚠️ Token missing in request");
      return res.status(401).json({ success: false, message: `Token Missing` });
    }

    try {
      // Verifying the JWT using the secret key stored in environment variables
      const decode = await jwt.verify(token, process.env.JWT_SECRET);
      console.log("🔓 Token Decoded Successfully:", decode);

      // Storing the decoded JWT payload in the request object for further use
      req.user = decode;
    } catch (error) {
      console.error("❌ Token Verification Failed:", error.message);
      return res
        .status(401)
        .json({ success: false, message: "Token is invalid" });
    }

    console.log("✅ [auth middleware] Authentication Passed, moving to next()");
    next();
  } catch (error) {
    console.error("🔥 Error in auth middleware:", error);
    return res.status(401).json({
      success: false,
      message: `Something Went Wrong While Validating the Token`,
    });
  }
};

exports.isStudent = async (req, res, next) => {
  try {
    console.log("✅ [isStudent middleware] Checking student role");

    const userDetails = await User.findOne({ email: req.user.email });
    console.log("👤 User Details:", userDetails);

    if (userDetails.accountType !== "Student") {
      console.warn("❌ Not a Student account");
      return res.status(401).json({
        success: false,
        message: "This is a Protected Route for Students",
      });
    }
    console.log("✅ Student verified — moving to next()");
    next();
  } catch (error) {
    console.error("🔥 Error in isStudent middleware:", error);
    return res
      .status(500)
      .json({ success: false, message: `User Role Can't be Verified` });
  }
};

exports.isAdmin = async (req, res, next) => {
  try {
    console.log("✅ [isAdmin middleware] Checking admin role");

    const userDetails = await User.findOne({ email: req.user.email });
    console.log("👤 User Details:", userDetails);

    if (userDetails.accountType !== "Admin") {
      console.warn("❌ Not an Admin account");
      return res.status(401).json({
        success: false,
        message: "This is a Protected Route for Admin",
      });
    }
    console.log("✅ Admin verified — moving to next()");
    next();
  } catch (error) {
    console.error("🔥 Error in isAdmin middleware:", error);
    return res
      .status(500)
      .json({ success: false, message: `User Role Can't be Verified` });
  }
};

exports.isInstructor = async (req, res, next) => {
  try {
    console.log("✅ [isInstructor middleware] Checking instructor role");

    const userDetails = await User.findOne({ email: req.user.email });
    console.log("👤 User Details:", userDetails);

    if (userDetails.accountType !== "Instructor") {
      console.warn("❌ Not an Instructor account");
      return res.status(401).json({
        success: false,
        message: "This is a Protected Route for Instructor",
      });
    }
    console.log("✅ Instructor verified — moving to next()");
    next();
  } catch (error) {
    console.error("🔥 Error in isInstructor middleware:", error);
    return res
      .status(500)
      .json({ success: false, message: `User Role Can't be Verified` });
  }
};
