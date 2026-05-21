import { Router } from "express";
import { authController } from "./auth.controller.js";

const router = Router();

router.post("/signup", authController.registerUser);
router.post("/login", authController.loginUser);

export const authRoute = router;
