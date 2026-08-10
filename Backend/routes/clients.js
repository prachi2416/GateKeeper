import express from "express";

const router = express.Router();

router.get("/", async (req, res) => {
  res.json({
    success: true,
    clients: [],
  });
});

export default router;
