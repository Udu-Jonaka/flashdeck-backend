const nodemailer = require("nodemailer");

// Create the transporter using your SMTP connection string from .env
// e.g. SMTP_URL=smtps://user:password@smtp.gmail.com
const transporter = nodemailer.createTransport(process.env.SMTP_URL);

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
