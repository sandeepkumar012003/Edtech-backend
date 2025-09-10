const nodemailer = require("nodemailer");
require("dotenv").config();

const mailSender = async (email, title, body) => {
  try {
    let transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || "smtp.gmail.com", // Default to Gmail if env is missing
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS || "ysig yijk kkfy ggxt",
      },
    });
    console.log("ankit ->", transporter.sendMail);
    let info = await transporter.sendMail({
      from: '"StudyNotion || CodeHelp" <your-sundepgangwar@gmail.com>',
      to: email,
      subject: title,
      html: body,
    });

    console.log("Email sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw new Error("Failed to send email");
  }
};

module.exports = mailSender;
