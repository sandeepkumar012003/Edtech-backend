const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate");
const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 5, // The document will be automatically deleted after 5 minutes of its creation time
  },
});

// Define a function to send emails

async function sendVerificationEmail(email, otp) {
  try {
    console.log(otp);
    // Define the email subject and body using the template
    const subject = "Verification Email";
    const html = emailTemplate(otp);

    // Send the email using the mailSender function
    const mailResponse = await mailSender(email, subject, html);
    console.log("mail response", mailResponse || "not found");
    console.log("Email sent successfully:", mailResponse.response);
  } catch (error) {
    console.error("Error occurred while sending email:", error);
    throw error; // Re-throw the error to handle it upstream if necessary
  }
}

module.exports = sendVerificationEmail;

// Define a post-save hook to send email after the document has been saved
OTPSchema.pre("save", async function (next) {
  console.log(
    this.isNew,
    "email->",
    this.email,
    "New document saved to database"
  );

  // Only send an email when a new document is created
  if (this.isNew) {
    await sendVerificationEmail(this.email, this.otp);
  }
  next();
});

const OTP = mongoose.model("otps", OTPSchema);

module.exports = OTP;





// When you create a new OTP (new OTP({ email, otp }).save()),

// Mongoose runs the pre("save") hook,

// Which automatically calls sendVerificationEmail(),

// That function sends an email to the user with their OTP,

// The OTP stays in the database for 5 hours, then gets deleted automatically.