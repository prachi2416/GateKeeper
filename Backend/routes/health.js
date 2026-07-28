import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    status: "healthy",
    message: "Backend is running",
  });
});

export default router;
