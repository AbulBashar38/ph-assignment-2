import cors from "cors";
import express, {
  type Application,
  type Request,
  type Response,
} from "express";

const app: Application = express();

app.use(express.json());
app.use(cors({ origin: "http://localhost:3000/" }));

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "DevPulse Server is running",
  });
});

export default app;
