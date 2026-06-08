const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const Settings = require('../models/Setting');

dotenv.config();

const sendEmail = async (options) => {
  console.log("=====================================");
  console.log("Starting sendEmail Function");
  console.log("Incoming Email Options:", options);
  console.log("=====================================");

  const SettingsFind = await Settings.findOne();
  console.log("🔍 Loaded Settings:", SettingsFind);

  try {
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = process.env.SMTP_PORT || 587;
    const smtpUser = process.env.SMTP_MAIL || SettingsFind?.smtp_email;
    const smtpPass = process.env.SMTP_PASS || SettingsFind?.smtp_password;

    console.log("➡ Step 1: SMTP Configuration:");
    console.log(`Host: ${smtpHost}`);
    console.log(`Port: ${smtpPort}`);
    console.log(`User: ${smtpUser}`);
    console.log(`Password: ${smtpPass ? "****** (hidden)" : "NOT SET!"}`);

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    console.log("➡ Step 2: Verifying SMTP Connection...");
    transporter.verify((error, success) => {
      if (error) {
        console.log("❌ SMTP Config Error:", error);
      } else {
        console.log("✅ SMTP Server is ready to send messages");
      }
    });

    const mailOptions = {
      from: `"Grand Masala" <${smtpUser}>`,
      to: options.email,
      subject: options.subject,
      html: options.message,
    };

    console.log("➡ Step 3: Final Email Options:", mailOptions);

    console.log("➡ Step 4: Sending Email...");
    const response = await transporter.sendMail(mailOptions);

    console.log("📨 Email Sent Response:", response);

    console.log("✅ Email sent successfully!");
    return true;

  } catch (error) {
    console.error("=====================================");
    console.error("❌ ERROR SENDING EMAIL");
    console.error("Message:", error.message);
    console.error("Full Error:", error);
    console.error("=====================================");
    return false;
  }
};


module.exports = sendEmail;
