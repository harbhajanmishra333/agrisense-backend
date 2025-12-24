import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import nodemailer from "nodemailer";

/* ================= OTP STORE (TEMP - IN MEMORY) ================= */
// key: email (lowercase) → value: { otp, name, password, expires }
const otpStore = new Map();

/* ================= OTP GENERATOR ================= */
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/* ================= EMAIL SETUP ================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_APP_PASSWORD,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: `"AgriSense" <${process.env.ADMIN_EMAIL}>`,
    to,
    subject,
    html,
  });
};

/* ================================================= */
/* ===================== SIGNUP ==================== */
/* ================================================= */
// Sends OTP only
export const signup = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const otp = generateOTP();

    otpStore.set(email, {
      otp,
      name,
      password,
      expires: Date.now() + 5 * 60 * 1000, // 5 min
    });

    console.log("OTP STORED:", email, otp); // debug

    await sendEmail({
      to: email,
      subject: "AgriSense OTP Verification",
      html: `<h3>Your OTP is ${otp}</h3><p>Valid for 5 minutes</p>`,
    });

    res.json({ message: "OTP sent to email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signup failed" });
  }
};

/* ================================================= */
/* ================== VERIFY OTP =================== */
/* ================================================= */
export const verifySignupOtp = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const otp = req.body.otp?.trim();

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP required" });
    }

    const data = otpStore.get(email);
    console.log("VERIFY OTP:", email, otp, data);

    if (!data) {
      return res.status(400).json({ message: "OTP expired or not found" });
    }

    if (Date.now() > data.expires) {
      otpStore.delete(email);
      return res.status(400).json({ message: "OTP expired" });
    }

    if (data.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await User.create({
      name: data.name,
      email,
      password: hashedPassword,
      isVerified: true,
      status: "PENDING",
      approvedByAdmin: false,
    });

    otpStore.delete(email);

    // Admin email
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: "New User Approval Required",
      html: `
        <p><b>Name:</b> ${user.name}</p>
        <p><b>Email:</b> ${user.email}</p>
        <a href="${process.env.BACKEND_URL}/api/auth/approve/${user._id}">✅ Approve</a>
        |
        <a href="${process.env.BACKEND_URL}/api/auth/reject/${user._id}">❌ Reject</a>
      `,
    });

    // User email
    await sendEmail({
      to: email,
      subject: "Registration Pending Approval",
      html: `<p>Your account is awaiting admin approval.</p>`,
    });

    res.json({ message: "OTP verified. Waiting for admin approval." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "OTP verification failed" });
  }
};

/* ================================================= */
/* ================= ADMIN APPROVE ================= */
/* ================================================= */
export const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).send(`
        <h2>User not found</h2>
      `);
    }

    // already approved safeguard
    if (user.approvedByAdmin && user.status === "ACTIVE") {
      return res.send(`
        <h2>User already approved ✅</h2>
        <p>${user.email}</p>
      `);
    }

    user.status = "ACTIVE";
    user.approvedByAdmin = true;
    await user.save();

    await sendEmail({
      to: user.email,
      subject: "AgriSense Account Approved 🎉",
      html: `
        <p>Hello ${user.name},</p>
        <p>Your account has been approved.</p>
        <p>You can now login to the app.</p>
      `,
    });

    // ✅ SEND HTML RESPONSE (IMPORTANT)
    res.send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 40px;">
          <h1>✅ User Approved Successfully</h1>
          <p><b>${user.email}</b> is now active.</p>
          <p>You may close this window.</p>
        </body>
      </html>
    `);

  } catch (err) {
    console.error("APPROVE ERROR:", err);
    res.status(500).send(`
      <h2>Something went wrong</h2>
    `);
  }
};


/* ================================================= */
/* ================= ADMIN REJECT ================== */
/* ================================================= */
export const rejectUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).send(`<h2>User not found</h2>`);
    }

    user.status = "REJECTED";
    await user.save();

    res.send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 40px;">
          <h1>❌ User Rejected</h1>
          <p><b>${user.email}</b> has been rejected.</p>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("REJECT ERROR:", err);
    res.status(500).send(`<h2>Error rejecting user</h2>`);
  }
};


/* ================================================= */
/* ===================== LOGIN ===================== */
/* ================================================= */
export const login = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (!user.approvedByAdmin || user.status !== "ACTIVE") {
      return res
        .status(403)
        .json({ message: "Account pending admin approval" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    res.json({
      message: "Login success",
      user,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
};
