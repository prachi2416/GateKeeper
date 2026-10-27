import express from "express";
import { randomUUID } from "node:crypto";
import redis from "../services/redisService.js";

const router = express.Router();

const NOTIFICATIONS_KEY = "gatekeeper:notifications";

function parseNotification(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

// Get notifications
router.get("/", async (req, res) => {
  try {
    const values = await redis.lrange(NOTIFICATIONS_KEY, 0, 99);

    const notifications = values.map(parseNotification).filter(Boolean);

    res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Notifications fetch error:", error);

    res.status(500).json({
      success: false,
      notifications: [],
      message: "Failed to fetch notifications",
    });
  }
});

// Mark one notification read, mark all read, or clear all
router.put("/", async (req, res) => {
  try {
    const { action, id, read } = req.body;

    if (action === "clear_all") {
      await redis.del(NOTIFICATIONS_KEY);

      return res.json({
        success: true,
        message: "Notifications cleared",
      });
    }

    const values = await redis.lrange(NOTIFICATIONS_KEY, 0, -1);
    const notifications = values.map(parseNotification).filter(Boolean);

    let updated = false;

    const nextNotifications = notifications.map((notification) => {
      if (
        action === "mark_all_read" ||
        (id && String(notification.id) === String(id))
      ) {
        updated = true;
        return {
          ...notification,
          read: true,
        };
      }

      return notification;
    });

    if (action !== "mark_all_read" && !id) {
      return res.status(400).json({
        success: false,
        message: "Provide a notification ID or a supported action",
      });
    }

    if (id && !updated) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (updated) {
      const pipeline = redis.pipeline();
      pipeline.del(NOTIFICATIONS_KEY);

      if (nextNotifications.length > 0) {
        pipeline.rpush(
          NOTIFICATIONS_KEY,
          ...nextNotifications.map((notification) =>
            JSON.stringify(notification),
          ),
        );
      }

      await pipeline.exec();
    }

    res.json({
      success: true,
      message: "Notifications updated",
    });
  } catch (error) {
    console.error("Notifications update error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update notifications",
    });
  }
});

// Create a notification (useful for gateway events and testing)
router.post("/", async (req, res) => {
  try {
    const { title, message, type = "gateway", severity = "info" } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required",
      });
    }

    const allowedTypes = ["rate_limit", "gateway", "redis", "tier"];
    const allowedSeverities = ["warning", "error", "info", "success"];

    if (!allowedTypes.includes(type) || !allowedSeverities.includes(severity)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification type or severity",
      });
    }

    const notification = {
      id: randomUUID(),
      title,
      message,
      type,
      severity,
      read: false,
      created_at: new Date().toISOString(),
    };

    await redis.lpush(NOTIFICATIONS_KEY, JSON.stringify(notification));
    await redis.ltrim(NOTIFICATIONS_KEY, 0, 99);

    res.status(201).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Notification creation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create notification",
    });
  }
});

export default router;
