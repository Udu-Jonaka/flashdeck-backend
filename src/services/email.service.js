const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Adding a timeout helps if Render's network is briefly sluggish
  connectionTimeout: 10000,
});

const sendVerificationEmail = async (userEmail, pin) => {
  try {
    const mailOptions = {
      from: `"Flashdeck App" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: "Verify your Flashdeck Account",
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h2>Welcome to Flashdeck!</h2>
          <p>We are excited to have you. Please use the PIN below to verify your account:</p>
          <h1 style="color: #4A90E2; letter-spacing: 5px;">${pin}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${userEmail}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Could not send verification email");
  }
};

module.exports = { sendVerificationEmail };
