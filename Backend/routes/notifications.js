import express from "express";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const notifications = [];

    res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Notifications error:", error);

    res.status(500).json({
      success: false,
      notifications: [],
      message: "Failed to fetch notifications",
    });
  }
});

export default router;
