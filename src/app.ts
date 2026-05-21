import cors from "cors";
import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { authRoute } from "./modules/auth/auth.route.js";
import { issueRoute } from "./modules/issue/issue.route.js";
import globalErrorHandler from "./middleware/globalErrorHandler.js";

const app: Application = express();

app.use(express.json());
app.use(cors({ origin: "http://localhost:3000/" }));

app.use("/api/auth", authRoute);
app.use("/api/issues", issueRoute);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "DevPulse Server is running",
  });
});
app.use(globalErrorHandler);
export default app;
