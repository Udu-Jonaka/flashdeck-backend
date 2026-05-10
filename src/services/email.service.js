const axios = require("axios");

const sendVerificationEmail = async (userEmail, pin) => {
  try {
    await axios.post(
      "https://api.resend.com/emails",
      {
        from: "Flashdeck <onboarding@resend.dev>", // Note: Resend allows sending TO your own email for testing
        to: userEmail,
        subject: "Verify your Flashdeck Account",
        html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h2>Welcome to Flashdeck!</h2>
          <p>We are excited to have you. Please use the PIN below to verify your account:</p>
          <h1 style="color: #2A9D8F; letter-spacing: 5px;">${pin}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );
    console.log(`Verification email sent to ${userEmail} via Resend API`);
  } catch (error) {
    console.error("Resend Error:", error.response?.data || error.message);
    throw new Error("Could not send verification email");
  }
};

module.exports = { sendVerificationEmail };
