import express from "express";
const router = express.Router();

import rateLimiter from "express-rate-limit";

const apiLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many requests please try again later",
});

import { register, login, updateUser } from "../controllers/authController.js";
import authenticateUser from "../middleware/auth.js";
router.route("/register").post(apiLimiter, register);
router.route("/login").post(apiLimiter, login);
// These two above is public every one can register or login
//but the one below is  restricted
router.route("/updateUser").patch(authenticateUser, updateUser);

export default router;
