import { z } from "zod";

// Game schema
export const gameSchema = z.object({
  id: z.string(),
  title: z.string(),
  thumbnail: z.string(),
  url: z.string(),
  category: z.string().optional(),
  source: z.string().optional(),
});

export type Game = z.infer<typeof gameSchema>;

// Bookmark schema
export const bookmarkSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  favicon: z.string().optional(),
});

export const insertBookmarkSchema = bookmarkSchema.omit({ id: true });
export type Bookmark = z.infer<typeof bookmarkSchema>;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;

// Notification schema
export const notificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(["update", "announcement", "feature"]),
  description: z.string(),
  details: z.string().optional(),
  date: z.string(),
  read: z.boolean(),
});

export const insertNotificationSchema = notificationSchema.omit({ id: true, date: true, read: true });
export type Notification = z.infer<typeof notificationSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Browser Tab schema
export const browserTabSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  favicon: z.string().optional(),
  active: z.boolean(),
});

export type BrowserTab = z.infer<typeof browserTabSchema>;

// Settings schema
export const settingsSchema = z.object({
  searchEngine: z.enum(["google", "duckduckgo", "bing", "brave", "mojeek"]),
  gameSource: z.enum(["GN-Math", "Selenite", "Truffled", "Velara", "DuckMath", "PlayerNation"]),
  decoyTitle: z.string(),
  decoyFavicon: z.string(),
  decoyPreset: z.enum(["custom", "google-docs", "google-slides", "google-sites", "ixl", "canvas", "clever"]).optional(),
  proxyEnabled: z.boolean(),
  proxyBackend: z.enum(["bridge", "scramjet"]),
  proxyTransport: z.enum(["libcurl", "epoxy"]),
  wispServer: z.string(),
  cloakEnabled: z.boolean(),
});

export type Settings = z.infer<typeof settingsSchema>;

// Decoy presets with title and favicon
export const decoyPresets = {
  "custom": { title: "", favicon: "" },
  "google-docs": { title: "Google Docs", favicon: "https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico" },
  "google-slides": { title: "Google Slides", favicon: "https://ssl.gstatic.com/docs/presentations/images/favicon5.ico" },
  "google-sites": { title: "Google Sites", favicon: "https://ssl.gstatic.com/atari/images/public/favicon.ico" },
  "ixl": { title: "IXL | Math, Language Arts, Science, Social Studies, and Spanish", favicon: "https://www.ixl.com/favicon.ico" },
  "canvas": { title: "Dashboard", favicon: "https://du11hjcvx0uqb.cloudfront.net/br/dist/images/favicon-e10d657a73.ico" },
  "clever": { title: "Clever | Portal", favicon: "https://assets.clever.com/favicons/favicon.ico" },
};

// Default settings
export const defaultSettings: Settings = {
  searchEngine: "duckduckgo",
  gameSource: "PlayerNation",
  decoyTitle: "Google Docs",
  decoyFavicon: "https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico",
  decoyPreset: "google-docs",
  proxyEnabled: false,
  proxyBackend: "bridge",
  proxyTransport: "libcurl",
  wispServer: "",
  cloakEnabled: false,
};

// Default bookmarks
export const defaultBookmarks: Bookmark[] = [
  { id: "1", title: "CrazyGames", url: "https://www.crazygames.com", favicon: "" },
  { id: "2", title: "Youtube", url: "https://www.youtube.com", favicon: "" },
  { id: "3", title: "SoundCloud", url: "https://www.soundcloud.com", favicon: "" },
  { id: "4", title: "TikTok", url: "https://www.tiktok.com", favicon: "" },
];

// Ad schema
export const adSchema = z.object({
  id: z.string(),
  title: z.string(),
  imageUrl: z.string(),
  linkUrl: z.string(),
  advertiser: z.string(),
  active: z.boolean(),
  expiresAt: z.string(),
});

export const insertAdSchema = adSchema.omit({ id: true });
export type Ad = z.infer<typeof adSchema>;
export type InsertAd = z.infer<typeof insertAdSchema>;

// Default notifications
export const defaultNotifications: Notification[] = [
  {
    id: "1",
    title: "v1.0.0 Release!",
    type: "update",
    description: "Welcome to GuiBV - your custom browser gaming platform!",
    details: "Features include: Game library, built-in browser, bookmarks, and more!",
    date: new Date().toISOString(),
    read: false,
  },
];

// Chat message schema
export const chatMessageSchema = z.object({
  id: z.string(),
  username: z.string(),
  message: z.string(),
  timestamp: z.string(),
});

export const insertChatMessageSchema = chatMessageSchema.omit({ id: true, timestamp: true });
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

// Recommendation schema
export const recommendationSchema = z.object({
  id: z.string(),
  suggestion: z.string(),
  submittedBy: z.string().optional(),
  timestamp: z.string(),
  status: z.enum(["pending", "reviewed", "implemented", "rejected"]),
});

export const insertRecommendationSchema = recommendationSchema.omit({ id: true, timestamp: true, status: true });
export type Recommendation = z.infer<typeof recommendationSchema>;
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
