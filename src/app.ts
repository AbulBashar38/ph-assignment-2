import cors from "cors";
import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { authRoute } from "./modules/auth/auth.route.js";

const app: Application = express();

app.use(express.json());
app.use(cors({ origin: "http://localhost:3000/" }));

app.use("/api/auth", authRoute);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "DevPulse Server is running",
  });
});

export default app;
