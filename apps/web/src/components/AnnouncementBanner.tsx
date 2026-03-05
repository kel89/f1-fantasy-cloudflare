import { useState, useEffect } from "react";
import { Alert } from "@mui/material";
import { api } from "../api/client";
import type { Announcement } from "@f1/shared";

const LS_KEY = "announcement_dismissed";

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    api.announcement.get().then(({ announcement: a }) => {
      if (!a) return;
      setAnnouncement(a);
      const dismissed = localStorage.getItem(LS_KEY);
      if (dismissed !== `${a.id}:${a.version}`) {
        setVisible(true);
      }
    }).catch(() => {
      // silently ignore — user may not be authed yet
    });
  }, []);

  if (!visible || !announcement) return null;

  return (
    <Alert
      severity="info"
      onClose={() => {
        localStorage.setItem(LS_KEY, `${announcement.id}:${announcement.version}`);
        setVisible(false);
      }}
      sx={{ borderRadius: 0 }}
    >
      {announcement.message}
    </Alert>
  );
}
