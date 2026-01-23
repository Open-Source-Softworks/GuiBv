import {
  type Game,
  type Bookmark,
  type Notification,
  type Settings,
  type Ad,
  type ChatMessage,
  type Recommendation,
  type InsertBookmark,
  type InsertAd,
  type InsertNotification,
  type InsertChatMessage,
  type InsertRecommendation,
  defaultSettings,
  defaultBookmarks,
  defaultNotifications,
} from "@shared/schema";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";

const DATA_DIR = "./data";
const NOTIFICATIONS_FILE = path.join(DATA_DIR, "notifications.json");
const CHAT_FILE = path.join(DATA_DIR, "chat.json");
const RECOMMENDATIONS_FILE = path.join(DATA_DIR, "recommendations.json");
const ADS_FILE = path.join(DATA_DIR, "ads.json");
const BOOKMARKS_FILE = path.join(DATA_DIR, "bookmarks.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadNotificationsFromFile(): Notification[] {
  ensureDataDir();
  try {
    if (fs.existsSync(NOTIFICATIONS_FILE)) {
      const data = fs.readFileSync(NOTIFICATIONS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading notifications:", error);
  }
  return [];
}

function saveNotificationsToFile(notifications: Notification[]) {
  ensureDataDir();
  try {
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2));
  } catch (error) {
    console.error("Error saving notifications:", error);
  }
}

function loadChatFromFile(): ChatMessage[] {
  ensureDataDir();
  try {
    if (fs.existsSync(CHAT_FILE)) {
      const data = fs.readFileSync(CHAT_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading chat:", error);
  }
  return [];
}

function saveChatToFile(messages: ChatMessage[]) {
  ensureDataDir();
  try {
    fs.writeFileSync(CHAT_FILE, JSON.stringify(messages, null, 2));
  } catch (error) {
    console.error("Error saving chat:", error);
  }
}

function loadRecommendationsFromFile(): Recommendation[] {
  ensureDataDir();
  try {
    if (fs.existsSync(RECOMMENDATIONS_FILE)) {
      const data = fs.readFileSync(RECOMMENDATIONS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading recommendations:", error);
  }
  return [];
}

function saveRecommendationsToFile(recommendations: Recommendation[]) {
  ensureDataDir();
  try {
    fs.writeFileSync(RECOMMENDATIONS_FILE, JSON.stringify(recommendations, null, 2));
  } catch (error) {
    console.error("Error saving recommendations:", error);
  }
}

function loadAdsFromFile(): Ad[] {
  ensureDataDir();
  try {
    if (fs.existsSync(ADS_FILE)) {
      const data = fs.readFileSync(ADS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading ads:", error);
  }
  return [];
}

function saveAdsToFile(ads: Ad[]) {
  ensureDataDir();
  try {
    fs.writeFileSync(ADS_FILE, JSON.stringify(ads, null, 2));
  } catch (error) {
    console.error("Error saving ads:", error);
  }
}

function loadBookmarksFromFile(): Bookmark[] {
  ensureDataDir();
  try {
    if (fs.existsSync(BOOKMARKS_FILE)) {
      const data = fs.readFileSync(BOOKMARKS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading bookmarks:", error);
  }
  return [];
}

function saveBookmarksToFile(bookmarks: Bookmark[]) {
  ensureDataDir();
  try {
    fs.writeFileSync(BOOKMARKS_FILE, JSON.stringify(bookmarks, null, 2));
  } catch (error) {
    console.error("Error saving bookmarks:", error);
  }
}

function loadSettingsFromFile(): Settings | null {
  ensureDataDir();
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }
  return null;
}

function saveSettingsToFile(settings: Settings) {
  ensureDataDir();
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error("Error saving settings:", error);
  }
}

export interface IStorage {
  // Games
  getGames(source?: string): Promise<Game[]>;
  getGamesByCategory(category: string, source?: string): Promise<Game[]>;
  searchGames(query: string, source?: string): Promise<Game[]>;

  // Bookmarks
  getBookmarks(): Promise<Bookmark[]>;
  getBookmark(id: string): Promise<Bookmark | undefined>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  updateBookmark(id: string, bookmark: Partial<InsertBookmark>): Promise<Bookmark | undefined>;
  deleteBookmark(id: string): Promise<boolean>;

  // Notifications
  getNotifications(): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<Notification | undefined>;
  markAllNotificationsRead(): Promise<void>;
  deleteNotification(id: string): Promise<boolean>;

  // Settings
  getSettings(): Promise<Settings>;
  updateSettings(settings: Partial<Settings>): Promise<Settings>;

  // Ads
  getAds(): Promise<Ad[]>;
  getActiveAds(): Promise<Ad[]>;
  getAd(id: string): Promise<Ad | undefined>;
  createAd(ad: InsertAd): Promise<Ad>;
  updateAd(id: string, ad: Partial<InsertAd>): Promise<Ad | undefined>;
  deleteAd(id: string): Promise<boolean>;

  // Chat
  getChatMessages(): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  deleteChatMessage(id: string): Promise<boolean>;
  clearChat(): Promise<void>;

  // Recommendations
  getRecommendations(): Promise<Recommendation[]>;
  createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation>;
  updateRecommendationStatus(id: string, status: Recommendation["status"]): Promise<Recommendation | undefined>;
  deleteRecommendation(id: string): Promise<boolean>;
}

// Game source configurations matching Waves implementation
export const GAME_SOURCE_CONFIG = {
  gnmath: {
    zones: "https://cdn.jsdelivr.net/gh/gn-math/assets@main/zones.json",
    covers: "https://cdn.jsdelivr.net/gh/gn-math/covers@main",
    html: "https://cdn.jsdelivr.net/gh/gn-math/html@main"
  },
  selenite: {
    games: "https://selenite.cc/resources/games.json",
    assets: "https://selenite.cc/resources/semag"
  },
  truffled: {
    games: "https://truffled.lol/js/json/g.json",
    assets: "https://truffled.lol"
  },
  velara: {
    games: "https://velara.cc/json/gg.json",
    assets: "https://velara.cc"
  },
  duckmath: {
    games: "https://duckmath.github.io/backup_classes.json"
  },
  playernation: {
    games: "https://player-nation.anjumanallana.in/resources/games.json",
    assets: "https://player-nation.anjumanallana.in/resources/semag"
  }
};

// Cache for fetched games per source
const gameCache: Map<string, { games: Game[]; timestamp: number }> = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchGamesFromSource(source: string): Promise<Game[]> {
  const cached = gameCache.get(source);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.games;
  }

  try {
    let games: Game[] = [];
    
    switch (source.toLowerCase().replace(/[-\s]/g, "")) {
      case "gnmath": {
        const response = await fetch(GAME_SOURCE_CONFIG.gnmath.zones);
        if (!response.ok) throw new Error(`Failed to fetch GN-Math zones: ${response.statusText}`);
        const zones = await response.json();
        
        games = zones
          .filter((zone: any) => zone.id >= 0) // Skip Discord link (id: -1)
          .map((zone: any) => {
            const coverUrl = zone.cover
              .replace("{COVER_URL}", GAME_SOURCE_CONFIG.gnmath.covers);
            const gameUrl = zone.url
              .replace("{HTML_URL}", GAME_SOURCE_CONFIG.gnmath.html);
            
            return {
              id: String(zone.id),
              title: zone.name,
              thumbnail: coverUrl,
              url: gameUrl,
              category: zone.special?.includes("flash") ? "Flash" : 
                       zone.special?.includes("port") ? "Port" : "HTML5",
              source: "gnmath",
              author: zone.author || ""
            };
          })
          .sort((a: Game, b: Game) => a.title.localeCompare(b.title));
        break;
      }
      
      case "selenite": {
        const response = await fetch(GAME_SOURCE_CONFIG.selenite.games);
        if (!response.ok) throw new Error(`Failed to fetch Selenite games: ${response.statusText}`);
        const data = await response.json();
        
        games = data.map((game: any, index: number) => ({
          id: String(index),
          title: game.name,
          thumbnail: `${GAME_SOURCE_CONFIG.selenite.assets}/${game.directory}/${game.image}`,
          url: `${GAME_SOURCE_CONFIG.selenite.assets}/${game.directory}/`,
          category: game.tags?.includes("top") ? "Popular" : "HTML5",
          source: "selenite",
          author: "Selenite"
        })).sort((a: Game, b: Game) => a.title.localeCompare(b.title));
        break;
      }
      
      case "truffled": {
        const response = await fetch(GAME_SOURCE_CONFIG.truffled.games);
        if (!response.ok) throw new Error(`Failed to fetch Truffled games: ${response.statusText}`);
        const data = await response.json();
        const gamesList = data.games || [];
        
        games = gamesList.map((game: any, index: number) => {
          let finalUrl = game.url.startsWith("http") ? game.url : 
            GAME_SOURCE_CONFIG.truffled.assets + (game.url.startsWith("/") ? "" : "/") + game.url;
          let finalCover = game.thumbnail.startsWith("http") ? game.thumbnail :
            GAME_SOURCE_CONFIG.truffled.assets + (game.thumbnail.startsWith("/") ? "" : "/") + game.thumbnail;
          
          return {
            id: String(index),
            title: game.name,
            thumbnail: finalCover,
            url: finalUrl,
            category: "HTML5",
            source: "truffled",
            author: "Truffled"
          };
        }).sort((a: Game, b: Game) => a.title.localeCompare(b.title));
        break;
      }
      
      case "velara": {
        const response = await fetch(GAME_SOURCE_CONFIG.velara.games);
        if (!response.ok) throw new Error(`Failed to fetch Velara games: ${response.statusText}`);
        const data = await response.json();
        
        games = data
          .filter((g: any) => g.name !== "!!DMCA" && g.name !== "!!Game Request")
          .map((game: any, index: number) => {
            let finalUrl = game.link;
            if (finalUrl && !finalUrl.startsWith("http")) {
              finalUrl = GAME_SOURCE_CONFIG.velara.assets + (finalUrl.startsWith("/") ? "" : "/") + finalUrl;
            } else if (game.grdmca) {
              finalUrl = game.grdmca;
            }
            
            return {
              id: String(index),
              title: game.name,
              thumbnail: `${GAME_SOURCE_CONFIG.velara.assets}/assets/game-imgs/${game.imgpath}`,
              url: finalUrl,
              category: "HTML5",
              source: "velara",
              author: "Velara"
            };
          }).sort((a: Game, b: Game) => a.title.localeCompare(b.title));
        break;
      }
      
      case "duckmath": {
        const response = await fetch(GAME_SOURCE_CONFIG.duckmath.games);
        if (!response.ok) throw new Error(`Failed to fetch DuckMath games: ${response.statusText}`);
        const data = await response.json();
        
        // DuckMath format is an array of games with name, url, image properties
        games = (Array.isArray(data) ? data : []).map((game: any, index: number) => ({
          id: String(index),
          title: game.name || game.title || `Game ${index}`,
          thumbnail: game.image || game.thumbnail || "",
          url: game.url || game.link || "",
          category: "HTML5",
          source: "duckmath",
          author: "DuckMath"
        })).sort((a: Game, b: Game) => a.title.localeCompare(b.title));
        break;
      }
      
      case "playernation": {
        const response = await fetch(GAME_SOURCE_CONFIG.playernation.games);
        if (!response.ok) throw new Error(`Failed to fetch PlayerNation games: ${response.statusText}`);
        const data = await response.json();
        
        games = data.map((game: any, index: number) => ({
          id: game.directory || String(index),
          title: game.name,
          thumbnail: `${GAME_SOURCE_CONFIG.playernation.assets}/${game.directory}/${game.image}`,
          url: `${GAME_SOURCE_CONFIG.playernation.assets}/${game.directory}/`,
          category: game.tags?.includes("steam") ? "Steam" : game.tags?.includes("top") ? "Featured" : "HTML5",
          source: "playernation",
          author: "Player Nation"
        })).sort((a: Game, b: Game) => a.title.localeCompare(b.title));
        break;
      }
      
      default:
        // Default to GN-Math
        return fetchGamesFromSource("gnmath");
    }
    
    // Cache the results
    gameCache.set(source, { games, timestamp: Date.now() });
    return games;
  } catch (error) {
    console.error(`Error fetching games from ${source}:`, error);
    // Return cached data if available, even if expired
    const cached = gameCache.get(source);
    if (cached) {
      return cached.games;
    }
    return [];
  }
}

export class MemStorage implements IStorage {
  private bookmarks: Map<string, Bookmark>;
  private notifications: Map<string, Notification>;
  private settings: Settings;
  private ads: Map<string, Ad>;
  private chatMessages: Map<string, ChatMessage>;
  private recommendations: Map<string, Recommendation>;

  constructor() {
    this.bookmarks = new Map();
    this.notifications = new Map();
    this.settings = { ...defaultSettings };
    this.ads = new Map();
    this.chatMessages = new Map();
    this.recommendations = new Map();

    // Load bookmarks from file or use defaults
    const savedBookmarks = loadBookmarksFromFile();
    if (savedBookmarks.length > 0) {
      savedBookmarks.forEach((bookmark) => {
        this.bookmarks.set(bookmark.id, bookmark);
      });
    } else {
      defaultBookmarks.forEach((bookmark) => {
        this.bookmarks.set(bookmark.id, bookmark);
      });
      this.saveBookmarks();
    }

    // Load notifications from file (persistent storage)
    const savedNotifications = loadNotificationsFromFile();
    if (savedNotifications.length > 0) {
      savedNotifications.forEach((notification) => {
        this.notifications.set(notification.id, notification);
      });
    } else {
      // Initialize with default notifications only if no saved ones exist
      defaultNotifications.forEach((notification) => {
        this.notifications.set(notification.id, notification);
      });
      this.saveNotifications();
    }

    // Load settings from file
    const savedSettings = loadSettingsFromFile();
    if (savedSettings) {
      this.settings = savedSettings;
    }

    // Load ads from file
    const savedAds = loadAdsFromFile();
    savedAds.forEach((ad) => {
      this.ads.set(ad.id, ad);
    });

    // Load chat messages from file
    const savedChat = loadChatFromFile();
    savedChat.forEach((msg) => {
      this.chatMessages.set(msg.id, msg);
    });

    // Load recommendations from file
    const savedRecs = loadRecommendationsFromFile();
    savedRecs.forEach((rec) => {
      this.recommendations.set(rec.id, rec);
    });
  }

  private saveNotifications() {
    const notificationsList = Array.from(this.notifications.values());
    saveNotificationsToFile(notificationsList);
  }

  private saveAds() {
    const adsList = Array.from(this.ads.values());
    saveAdsToFile(adsList);
  }

  private saveBookmarks() {
    const bookmarksList = Array.from(this.bookmarks.values());
    saveBookmarksToFile(bookmarksList);
  }

  private saveSettings() {
    saveSettingsToFile(this.settings);
  }

  // Games - dynamically fetched from external sources matching Waves implementation
  async getGames(source: string = "gnmath"): Promise<Game[]> {
    return fetchGamesFromSource(source);
  }

  async getGamesByCategory(category: string, source: string = "gnmath"): Promise<Game[]> {
    const games = await fetchGamesFromSource(source);
    if (category === "All") {
      return games;
    }
    return games.filter((game) => game.category === category);
  }

  async searchGames(query: string, source: string = "gnmath"): Promise<Game[]> {
    const games = await fetchGamesFromSource(source);
    const lowerQuery = query.toLowerCase();
    return games.filter((game) =>
      game.title.toLowerCase().includes(lowerQuery)
    );
  }

  // Bookmarks
  async getBookmarks(): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values());
  }

  async getBookmark(id: string): Promise<Bookmark | undefined> {
    return this.bookmarks.get(id);
  }

  async createBookmark(insertBookmark: InsertBookmark): Promise<Bookmark> {
    const id = randomUUID();
    const bookmark: Bookmark = { ...insertBookmark, id };
    this.bookmarks.set(id, bookmark);
    this.saveBookmarks();
    return bookmark;
  }

  async updateBookmark(
    id: string,
    updates: Partial<InsertBookmark>
  ): Promise<Bookmark | undefined> {
    const existing = this.bookmarks.get(id);
    if (!existing) {
      return undefined;
    }
    const updated: Bookmark = { ...existing, ...updates };
    this.bookmarks.set(id, updated);
    this.saveBookmarks();
    return updated;
  }

  async deleteBookmark(id: string): Promise<boolean> {
    const result = this.bookmarks.delete(id);
    if (result) {
      this.saveBookmarks();
    }
    return result;
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    return Array.from(this.notifications.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = {
      ...insertNotification,
      id,
      date: new Date().toISOString(),
      read: false,
    };
    this.notifications.set(id, notification);
    this.saveNotifications();
    return notification;
  }

  async markNotificationRead(id: string): Promise<Notification | undefined> {
    const existing = this.notifications.get(id);
    if (!existing) {
      return undefined;
    }
    const updated: Notification = { ...existing, read: true };
    this.notifications.set(id, updated);
    this.saveNotifications();
    return updated;
  }

  async markAllNotificationsRead(): Promise<void> {
    Array.from(this.notifications.entries()).forEach(([id, notification]) => {
      this.notifications.set(id, { ...notification, read: true });
    });
    this.saveNotifications();
  }

  async deleteNotification(id: string): Promise<boolean> {
    const result = this.notifications.delete(id);
    if (result) {
      this.saveNotifications();
    }
    return result;
  }

  // Settings
  async getSettings(): Promise<Settings> {
    return this.settings;
  }

  async updateSettings(updates: Partial<Settings>): Promise<Settings> {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
    return this.settings;
  }

  // Ads
  async getAds(): Promise<Ad[]> {
    return Array.from(this.ads.values());
  }

  async getActiveAds(): Promise<Ad[]> {
    const now = new Date();
    return Array.from(this.ads.values()).filter(
      (ad) => ad.active && new Date(ad.expiresAt) > now
    );
  }

  async getAd(id: string): Promise<Ad | undefined> {
    return this.ads.get(id);
  }

  async createAd(insertAd: InsertAd): Promise<Ad> {
    const id = randomUUID();
    const ad: Ad = { ...insertAd, id };
    this.ads.set(id, ad);
    this.saveAds();
    return ad;
  }

  async updateAd(id: string, updates: Partial<InsertAd>): Promise<Ad | undefined> {
    const existing = this.ads.get(id);
    if (!existing) {
      return undefined;
    }
    const updated: Ad = { ...existing, ...updates };
    this.ads.set(id, updated);
    this.saveAds();
    return updated;
  }

  async deleteAd(id: string): Promise<boolean> {
    const result = this.ads.delete(id);
    if (result) {
      this.saveAds();
    }
    return result;
  }

  // Chat
  private saveChat() {
    const chatList = Array.from(this.chatMessages.values());
    saveChatToFile(chatList);
  }

  async getChatMessages(): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertMessage,
      id,
      timestamp: new Date().toISOString(),
    };
    this.chatMessages.set(id, message);
    this.saveChat();
    return message;
  }

  async deleteChatMessage(id: string): Promise<boolean> {
    const result = this.chatMessages.delete(id);
    if (result) {
      this.saveChat();
    }
    return result;
  }

  async clearChat(): Promise<void> {
    this.chatMessages.clear();
    this.saveChat();
  }

  // Recommendations
  private saveRecommendations() {
    const recsList = Array.from(this.recommendations.values());
    saveRecommendationsToFile(recsList);
  }

  async getRecommendations(): Promise<Recommendation[]> {
    return Array.from(this.recommendations.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async createRecommendation(insertRec: InsertRecommendation): Promise<Recommendation> {
    const id = randomUUID();
    const recommendation: Recommendation = {
      ...insertRec,
      id,
      timestamp: new Date().toISOString(),
      status: "pending",
    };
    this.recommendations.set(id, recommendation);
    this.saveRecommendations();
    return recommendation;
  }

  async updateRecommendationStatus(id: string, status: Recommendation["status"]): Promise<Recommendation | undefined> {
    const existing = this.recommendations.get(id);
    if (!existing) {
      return undefined;
    }
    const updated: Recommendation = { ...existing, status };
    this.recommendations.set(id, updated);
    this.saveRecommendations();
    return updated;
  }

  async deleteRecommendation(id: string): Promise<boolean> {
    const result = this.recommendations.delete(id);
    if (result) {
      this.saveRecommendations();
    }
    return result;
  }
}

export const storage = new MemStorage();
