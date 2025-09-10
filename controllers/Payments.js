const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const crypto = require("crypto");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const mongoose = require("mongoose");
const {
  courseEnrollmentEmail,
} = require("../mail/templates/courseEnrollmentEmail");
const {
  paymentSuccessEmail,
} = require("../mail/templates/paymentSuccessEmail");
const CourseProgress = require("../models/CourseProgress");

// ---------------------------
// 1. CAPTURE PAYMENT
// ---------------------------
exports.capturePayment = async (req, res) => {
  const { courses } = req.body;
  const userId = req.user.id;

  if (!courses || courses.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide course IDs" });
  }

  let total_amount = 0;

  for (const course_id of courses) {
    if (!mongoose.Types.ObjectId.isValid(course_id)) {
      return res
        .status(400)
        .json({ success: false, message: `Invalid course ID: ${course_id}` });
    }

    const course = await Course.findById(course_id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: `Course not found: ${course_id}` });
    }

    const uid = new mongoose.Types.ObjectId(userId);
    if (course.studentsEnrolled.includes(uid)) {
      return res.status(409).json({
        success: false,
        message: `Already enrolled in course: ${course.courseName}`,
      });
    }

    total_amount += course.price;
  }

  const options = {
    amount: total_amount * 100, // in paise
    currency: "INR",
    receipt: `receipt_${Math.floor(Math.random() * 1000000)}`,
  };

  try {
    const paymentResponse = await instance.orders.create(options);
    return res.status(200).json({
      success: true,
      data: paymentResponse,
    });
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not initiate order." });
  }
};

// ---------------------------
// 2. VERIFY PAYMENT
// ---------------------------
exports.verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    courses,
  } = req.body;
  const userId = req.user.id;

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !courses ||
    !userId
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }

  // Double check: user not already enrolled
  for (const courseId of courses) {
    const course = await Course.findById(courseId);
    if (course && course.studentsEnrolled.includes(userId)) {
      return res.status(409).json({
        success: false,
        message: `User already enrolled in course: ${course.courseName}`,
      });
    }
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res
      .status(400)
      .json({ success: false, message: "Payment verification failed" });
  }

  try {
    await enrollStudents(courses, userId);
    return res
      .status(200)
      .json({ success: true, message: "Payment verified and enrolled" });
  } catch (error) {
    console.error("Enrollment failed after payment verification:", error);
    return res
      .status(500)
      .json({ success: false, message: "Enrollment failed" });
  }
};

// ---------------------------
// 3. SEND PAYMENT SUCCESS EMAIL
// ---------------------------
exports.sendPaymentSuccessEmail = async (req, res) => {
  const { orderId, paymentId, amount } = req.body;
  const userId = req.user.id;

  if (!orderId || !paymentId || !amount || !userId) {
    return res
      .status(400)
      .json({ success: false, message: "Missing payment details" });
  }

  try {
    const enrolledStudent = await User.findById(userId);
    if (!enrolledStudent) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    await mailSender(
      enrolledStudent.email,
      `Payment Received`,
      paymentSuccessEmail(
        `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
        amount / 100,
        orderId,
        paymentId
      )
    );

    return res
      .status(200)
      .json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending payment success email:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not send email" });
  }
};

// ---------------------------
// 4. ENROLL STUDENTS IN COURSES
// ---------------------------
const enrollStudents = async (courses, userId) => {
  for (const courseId of courses) {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new Error(`Invalid course ID: ${courseId}`);
    }

    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error(`Course not found: ${courseId}`);
    }

    if (course.studentsEnrolled.includes(userId)) {
      console.log(`Skipping course ${course.courseName}: already enrolled`);
      continue;
    }

    course.studentsEnrolled.push(userId);
    await course.save();

    const courseProgress = await CourseProgress.create({
      courseID: courseId,
      userId: userId,
      completedVideos: [],
    });

    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    user.courses.push(courseId);
    user.courseProgress.push(courseProgress._id);
    await user.save();

    await mailSender(
      user.email,
      `Successfully Enrolled into ${course.courseName}`,
      courseEnrollmentEmail(
        course.courseName,
        `${user.firstName} ${user.lastName}`
      )
    );
  }
};
