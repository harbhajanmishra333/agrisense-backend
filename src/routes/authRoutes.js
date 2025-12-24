import express from "express";
import { 
  signup, 
  login, 
  verifySignupOtp, // Import this
  approveUser,     // Import this
  rejectUser       // Import this
} from "../controllers/authController.js";

const router = express.Router();

console.log("Auth routes loaded");

// Existing routes
router.post("/signup", signup);
router.post("/login", login);

// === ADD THESE ===

// 1. Matches frontend: await axios.post("/auth/verify-otp", ...)
router.post("/verify-otp", verifySignupOtp); 

// 2. Matches email link: /api/auth/approve/:id
// Must be GET because links clicked in emails are GET requests
router.get("/approve/:id", approveUser); 

// 3. Matches email link: /api/auth/reject/:id
router.get("/reject/:id", rejectUser);

export default router;