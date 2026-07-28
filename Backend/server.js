import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import dotenv from "dotenv";
import { connectRedis } from "./services/redisService.js";
import healthRoutes from "./routes/health.js";

app.use("/api/health", healthRoutes);
app.use("/api/debug", debugRoutes);
dotenv.config();

const app = express();

app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    service: "GateKeeper Backend",
    version: "1.0.0",
    status: "Running",
  });
});

const PORT = process.env.PORT || 5000;
await connectRedis();
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
