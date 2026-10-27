import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    instances: [],
    message: "No gateway instances registered yet.",
  });
});

export default router;
