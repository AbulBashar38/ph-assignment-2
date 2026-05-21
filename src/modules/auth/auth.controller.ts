import type { Request, Response } from "express";
import { authService } from "./auth.service.js";

const loginUser = async (req: Request, res: Response) => {
  console.log("called");

  try {
    const token = await authService.loginUserIntoDB(req.body);

    res.status(200).json({
      success: true,
      message: "User login successfully!",
      data: { token },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
};

export const authController = {
  loginUser,
};
