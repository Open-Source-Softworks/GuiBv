import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookmarkSchema, settingsSchema, insertAdSchema, insertNotificationSchema, insertChatMessageSchema, insertRecommendationSchema } from "@shared/schema";

function isPrivateIP(hostname: string): boolean {
  // Block localhost variations
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return true;
  }
  
  // Check for private IP ranges
  const ipv4Match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4Match) {
    const [, a, b, c, d] = ipv4Match.map(Number);
    // 10.0.0.0/8
    if (a === 10) return true;
    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16
    if (a === 192 && b === 168) return true;
    // 127.0.0.0/8 (loopback)
    if (a === 127) return true;
    // 169.254.0.0/16 (link-local)
    if (a === 169 && b === 254) return true;
    // 0.0.0.0
    if (a === 0) return true;
  }
  
  return false;
}

function rewriteUrls(html: string, baseUrl: string, proxyBase: string): string {
  const base = new URL(baseUrl);
  
  return html
    .replace(/(href|src|action)=["']([^"']+)["']/gi, (match, attr, url) => {
      if (url.startsWith('data:') || url.startsWith('javascript:') || url.startsWith('#')) {
        return match;
      }
      try {
        const absoluteUrl = new URL(url, baseUrl).href;
        return `${attr}="${proxyBase}${encodeURIComponent(absoluteUrl)}"`;
      } catch {
        return match;
      }
    })
    .replace(/url\(["']?([^"')]+)["']?\)/gi, (match, url) => {
      if (url.startsWith('data:')) return match;
      try {
        const absoluteUrl = new URL(url, baseUrl).href;
        return `url("${proxyBase}${encodeURIComponent(absoluteUrl)}")`;
      } catch {
        return match;
      }
    });
}

const ADMIN_USERNAME = "GuiAdmin";
const ADMIN_PASSWORD = "1k16AunfH5";

function adminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Authorization required" });
  }
  
  const [type, credentials] = authHeader.split(" ");
  if (type !== "Basic" || !credentials) {
    return res.status(401).json({ error: "Invalid authorization format" });
  }
  
  const decoded = Buffer.from(credentials, "base64").toString("utf-8");
  const [username, password] = decoded.split(":");
  
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Invalid credentials" });
  }
  
  next();
}

// Game source configurations like Waves
const GAME_SOURCES = {
  "GN-Math": {
    zones: "https://cdn.jsdelivr.net/gh/gn-math/assets@main/zones.json",
    covers: "https://cdn.jsdelivr.net/gh/gn-math/covers@main",
    html: "https://cdn.jsdelivr.net/gh/gn-math/html@main"
  },
  "Selenite": {
    games: "https://selenite.cc/resources/games.json",
    assets: "https://selenite.cc/resources/semag"
  },
  "Truffled": {
    games: "https://truffled.lol/js/json/g.json",
    assets: "https://truffled.lol"
  },
  "Velara": {
    games: "https://velara.cc/json/gg.json",
    assets: "https://velara.cc"
  },
  "DuckMath": {
    games: "https://cdn.jsdelivr.net/gh/duckmath/duckmath.github.io@main/backup_classes.json"
  },
  "PlayerNation": {
    games: "https://selenite.cc/resources/games.json",
    assets: "https://selenite.cc/resources/semag"
  }
};

// Bridge proxy prefix
const BRIDGE_PREFIX = "/!!/";

// CSS URL rewriting
function rewriteCssUrls(css: string, baseUrl: string, bridgePrefix: string): string {
  return css.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (match, quote, urlPath) => {
    urlPath = urlPath.trim().replace(/^['"]|['"]$/g, '');
    if (urlPath.startsWith('data:') || urlPath.startsWith('blob:')) return match;
    if (urlPath.startsWith('http')) {
      return `url(${quote}${bridgePrefix}${urlPath}${quote})`;
    }
    try {
      const absoluteUrl = new URL(urlPath, baseUrl).href;
      return `url(${quote}${bridgePrefix}${absoluteUrl}${quote})`;
    } catch {
      return match;
    }
  });
}

// Generate Waves-style injection script
// Exported bridge proxy handler for use in index.ts (must run before Vite)
export async function handleBridgeProxy(req: Request, res: Response): Promise<void> {
  try {
    const fullRequestUrl = req.originalUrl || req.url || '';
    
    // Handle OPTIONS for CORS
    if (req.method === 'OPTIONS') {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.status(204).end();
      return;
    }

    // Find prefix position (handle both encoded and non-encoded)
    let prefixIndex = fullRequestUrl.indexOf('/!!/');
    if (prefixIndex === -1) {
      prefixIndex = fullRequestUrl.indexOf('/%21%21/');
      if (prefixIndex === -1) {
        res.status(400).json({ error: "No URL prefix found" });
        return;
      }
      // URL-encoded prefix is 8 chars
      prefixIndex += 8;
    } else {
      prefixIndex += 4;
    }

    // Extract target URL
    let targetUrl = fullRequestUrl.substring(prefixIndex);
    
    // Decode URL-encoded characters
    if (targetUrl.includes('%')) {
      try { targetUrl = decodeURIComponent(targetUrl); } catch {}
    }
    
    // Clean up any remaining prefixes
    while (targetUrl.startsWith('/!!/')) {
      targetUrl = targetUrl.substring(4);
    }
    while (targetUrl.startsWith('/%21%21/')) {
      targetUrl = targetUrl.substring(8);
    }

    if (!targetUrl.startsWith('http')) {
      targetUrl = 'https://' + targetUrl;
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        res.status(400).json({ error: "Only HTTP/HTTPS URLs supported" });
        return;
      }
    } catch {
      res.status(400).json({ error: "Invalid URL" });
      return;
    }

    // Block private IPs
    if (isPrivateIP(parsedUrl.hostname)) {
      res.status(403).json({ error: "Access to internal resources not allowed" });
      return;
    }

    // Build request headers
    const requestHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Upgrade-Insecure-Requests': '1',
      'Referer': parsedUrl.origin + '/',
    };

    // Forward range header
    if (req.headers['range']) {
      requestHeaders['Range'] = req.headers['range'] as string;
    }

    // Forward content-type for POST/PUT requests
    if (req.headers['content-type']) {
      requestHeaders['Content-Type'] = req.headers['content-type'] as string;
    }

    // Prepare request body for non-GET methods
    let requestBody: string | Buffer | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      if ((req as any).rawBody) {
        requestBody = (req as any).rawBody;
      } else if (typeof req.body === 'string') {
        requestBody = req.body;
      } else if (Buffer.isBuffer(req.body)) {
        requestBody = req.body;
      } else if (req.body && typeof req.body === 'object') {
        requestBody = JSON.stringify(req.body);
        if (!requestHeaders['Content-Type']) {
          requestHeaders['Content-Type'] = 'application/json';
        }
      }
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: requestHeaders,
      body: requestBody,
      redirect: 'follow',
    });

    const rawContentType = response.headers.get('content-type') || 'text/html';
    
    // Detect HTML by extension if CDN returns wrong content-type (like jsdelivr returning text/plain for .html)
    const urlPath = parsedUrl.pathname.toLowerCase();
    const isHtmlByExtension = urlPath.endsWith('.html') || urlPath.endsWith('.htm');
    const isHtmlContent = rawContentType.includes('text/html') || isHtmlByExtension;
    const contentType = isHtmlByExtension ? 'text/html; charset=utf-8' : rawContentType;

    // Set CORS headers - avoid restrictive COEP for Discord and complex sites
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

    // Handle HTML (detected by content-type OR file extension)
    if (isHtmlContent) {
      let html = await response.text();
      
      // Inject bridge script at start of head
      const bridgeScript = generateBridgeScript(targetUrl);
      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>${bridgeScript}`);
      } else if (html.includes('<head ')) {
        html = html.replace(/<head\s[^>]*>/i, (match) => `${match}${bridgeScript}`);
      } else if (html.includes('<html>')) {
        html = html.replace('<html>', `<html><head>${bridgeScript}</head>`);
      } else {
        html = bridgeScript + html;
      }

      // Strip integrity attributes (breaks when URLs are rewritten through proxy)
      html = html.replace(/\s+integrity=["'][^"']*["']/gi, '');
      
      // Strip crossorigin attributes that enforce CORS checks
      html = html.replace(/\s+crossorigin(?:=["'][^"']*["'])?/gi, '');
      
      // Strip nonce attributes (Content Security Policy)
      html = html.replace(/\s+nonce=["'][^"']*["']/gi, '');

      // Rewrite URLs in HTML
      html = html.replace(/(href|src|action)=["']([^"']+)["']/gi, (match, attr, url) => {
        if (url.startsWith('data:') || url.startsWith('javascript:') || url.startsWith('#') || url.startsWith('blob:')) {
          return match;
        }
        try {
          const absoluteUrl = new URL(url, targetUrl).href;
          return `${attr}="${BRIDGE_PREFIX}${absoluteUrl}"`;
        } catch {
          return match;
        }
      });

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } else if (contentType.includes('text/css')) {
      let css = await response.text();
      css = rewriteCssUrls(css, targetUrl, BRIDGE_PREFIX);
      res.setHeader('Content-Type', contentType);
      res.send(css);
    } else if (contentType.includes('javascript') || contentType.includes('application/json')) {
      const text = await response.text();
      res.setHeader('Content-Type', contentType);
      res.send(text);
    } else {
      // Binary content
      const buffer = Buffer.from(await response.arrayBuffer());
      res.setHeader('Content-Type', contentType);
      res.send(buffer);
    }
  } catch (error) {
    console.error('Bridge proxy error:', error);
    res.status(500).json({ error: "Failed to fetch URL" });
  }
}

function generateBridgeScript(targetUrl: string): string {
  return `<script>(function(){
window.__BRIDGE_PREFIX__="${BRIDGE_PREFIX}";
window.__BRIDGE_TARGET__="${targetUrl}";
window.__BRIDGE_BASE__=window.__BRIDGE_BASE__||((window.location.origin||"")+window.__BRIDGE_PREFIX__);
const downloadExts=[".zip",".rar",".7z",".tar",".gz",".exe",".msi",".apk",".dmg",".pdf",".doc",".docx",".xls",".xlsx",".mp3",".mp4",".mkv",".mov"];
const resolveAbs=(u)=>{if(!u)return null;try{return new URL(u,window.__BRIDGE_TARGET__).href}catch(e){try{return new URL(u).href}catch(err){return null}}};
const rewrite=(url)=>{if(!url||typeof url!=="string")return url;if(url.startsWith("data:")||url.startsWith("blob:")||url.startsWith("javascript:"))return url;if(url.startsWith(window.__BRIDGE_PREFIX__)||url.startsWith(window.location.origin+window.__BRIDGE_PREFIX__))return url;if(url.startsWith("http"))return window.__BRIDGE_PREFIX__+url;if(url.startsWith("//")){return window.__BRIDGE_PREFIX__+"https:"+url}if(url.startsWith("/")){try{return window.__BRIDGE_PREFIX__+new URL(url,window.__BRIDGE_TARGET__).href}catch(e){return url}}try{return window.__BRIDGE_PREFIX__+new URL(url,window.__BRIDGE_TARGET__).href}catch(e){return url}};
document.addEventListener("click",function(e){if(e.defaultPrevented)return;const a=e.target.closest("a");if(!a)return;const href=a.getAttribute("data-bridge-orig-href")||a.getAttribute("href");if(!href||href.startsWith("javascript:")||href.startsWith("#"))return;const real=resolveAbs(href);if(!real)return;e.preventDefault();const bridged=rewrite(real);if(a.target==="_blank"||e.ctrlKey||e.metaKey){window.open(bridged,"_blank");}else{window.location.href=bridged;}});
const originalFetch=window.fetch;window.fetch=function(input,init){if(typeof input==="string")input=rewrite(input);else if(input instanceof Request)input=new Request(rewrite(input.url),input);return originalFetch(input,init)};
const originalOpen=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(method,url,...args){return originalOpen.call(this,method,rewrite(url),...args)};
const originalWS=window.WebSocket;window.WebSocket=function(url,protocols){if(!url)return new originalWS(url,protocols);let target=url;if(!target.startsWith("ws")){try{target=new URL(url,window.__BRIDGE_TARGET__).href}catch(e){}target=target.replace("http","ws")}const proxyUrl=(window.location.protocol==="https:"?"wss://":"ws://")+window.location.host+window.__BRIDGE_PREFIX__+"ws/"+encodeURIComponent(target);return new originalWS(proxyUrl,protocols)};window.WebSocket.prototype=originalWS.prototype;
const originalWorker=window.Worker;if(originalWorker){window.Worker=function(scriptURL,options){return new originalWorker(rewrite(scriptURL),options)};window.Worker.prototype=originalWorker.prototype;}
const origAssign=window.location.assign.bind(window.location);const origReplace=window.location.replace.bind(window.location);
window.location.assign=function(url){origAssign(rewrite(url))};
window.location.replace=function(url){origReplace(rewrite(url))};
try{const locDesc=Object.getOwnPropertyDescriptor(window,'location');if(locDesc&&locDesc.set){const origSet=locDesc.set.bind(window);Object.defineProperty(window,'location',{...locDesc,set:function(v){if(typeof v==='string'){origSet(rewrite(v))}else{origSet(v)}}})}}catch(e){}
const origHistPush=history.pushState.bind(history);const origHistReplace=history.replaceState.bind(history);
history.pushState=function(s,t,u){return origHistPush(s,t,u?rewrite(u):u)};
history.replaceState=function(s,t,u){return origHistReplace(s,t,u?rewrite(u):u)};
window.dataLayer=[];window.gtag=function(){};window.ga=function(){};window.fbq=function(){};
window.parent.postMessage({type:'bridge-loaded',url:window.__BRIDGE_TARGET__},'*');
console.log('[Bridge] Page loaded:',window.__BRIDGE_TARGET__)
})()</script>`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // External sources API (like Waves)
  app.get("/api/library/sources", async (req, res) => {
    res.json(GAME_SOURCES);
  });

  // Fetch titles from external source
  app.get("/api/library/external/:source", async (req, res) => {
    try {
      const source = req.params.source as keyof typeof GAME_SOURCES;
      const config = GAME_SOURCES[source];
      
      if (!config) {
        return res.status(400).json({ error: "Invalid game source" });
      }

      if (source === "GN-Math") {
        const response = await fetch(config.zones);
        const zones = await response.json();
        const games = zones.map((zone: any) => ({
          id: zone.id || zone.name,
          title: zone.name,
          thumbnail: `${BRIDGE_PREFIX}${config.covers}/${zone.id || zone.name}.webp`,
          url: `${config.html}/${zone.id || zone.name}/`,
          category: zone.category || "Game",
          source: "GN-Math"
        }));
        return res.json(games);
      }

      if (source === "Selenite") {
        const response = await fetch(config.games);
        const data = await response.json();
        const games = data.map((game: any) => ({
          id: game.directory,
          title: game.name,
          thumbnail: `${BRIDGE_PREFIX}${config.assets}/${game.directory}/${game.image}`,
          url: `${config.assets}/${game.directory}/`,
          category: game.tags?.includes('top') ? "Featured" : "Game",
          source: "Selenite"
        }));
        return res.json(games);
      }

      if (source === "Truffled") {
        const response = await fetch(config.games);
        const data = await response.json();
        const gamesArr = data.games || [];
        const games = gamesArr.map((game: any) => {
          let finalUrl = game.url.startsWith('http') ? game.url : config.assets + (game.url.startsWith('/') ? '' : '/') + game.url;
          let finalCover = game.thumbnail.startsWith('http') ? game.thumbnail : config.assets + (game.thumbnail.startsWith('/') ? '' : '/') + game.thumbnail;
          return {
            id: game.name,
            title: game.name,
            thumbnail: `${BRIDGE_PREFIX}${finalCover}`,
            url: finalUrl,
            category: "Game",
            source: "Truffled"
          };
        });
        return res.json(games);
      }

      if (source === "Velara") {
        const response = await fetch(config.games);
        const data = await response.json();
        const games = data
          .filter((g: any) => g.name !== '!!DMCA' && g.name !== '!!Game Request')
          .map((game: any) => {
            let finalUrl = game.link;
            if (finalUrl && !finalUrl.startsWith('http')) finalUrl = config.assets + (finalUrl.startsWith('/') ? '' : '/') + finalUrl;
            else if (game.grdmca) finalUrl = game.grdmca;
            return {
              id: game.name,
              title: game.name,
              thumbnail: `${BRIDGE_PREFIX}${config.assets}/assets/game-imgs/${game.imgpath}`,
              url: finalUrl,
              category: "Game",
              source: "Velara"
            };
          });
        return res.json(games);
      }

      if (source === "DuckMath") {
        const response = await fetch(config.games);
        const data = await response.json();
        const games = Object.entries(data).flatMap(([category, items]: [string, any]) => {
          if (!Array.isArray(items)) return [];
          return items.map((game: any) => ({
            id: game.name || game.title,
            title: game.name || game.title,
            thumbnail: game.image || game.img || "",
            url: game.url || game.link || "",
            category: category,
            source: "DuckMath"
          }));
        });
        return res.json(games);
      }

      if (source === "PlayerNation") {
        const response = await fetch(config.games);
        const data = await response.json();
        const games = data.map((game: any, index: number) => ({
          id: game.directory || String(index),
          title: game.name,
          thumbnail: `${config.assets}/${game.directory}/${game.image}`,
          url: `${config.assets}/${game.directory}/`,
          category: game.tags?.includes('steam') ? "Steam" : game.tags?.includes('top') ? "Featured" : "HTML5",
          source: "PlayerNation",
          author: "Player Nation"
        }));
        return res.json(games);
      }

      res.json([]);
    } catch (error) {
      console.error("Error fetching external titles:", error);
      res.status(500).json({ error: "Failed to fetch titles from source" });
    }
  });

  // Library API (local fallback)
  app.get("/api/library", async (req, res) => {
    try {
      const { category, search, source } = req.query;
      const titleSource = typeof source === "string" ? source : "gnmath";

      let items;
      if (search && typeof search === "string") {
        items = await storage.searchGames(search, titleSource);
      } else if (category && typeof category === "string") {
        items = await storage.getGamesByCategory(category, titleSource);
      } else {
        items = await storage.getGames(titleSource);
      }

      res.json(items);
    } catch (error) {
      console.error("Error fetching library:", error);
      res.status(500).json({ error: "Failed to fetch library" });
    }
  });

  // Bookmarks API
  app.get("/api/bookmarks", async (req, res) => {
    try {
      const bookmarks = await storage.getBookmarks();
      res.json(bookmarks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookmarks" });
    }
  });

  app.get("/api/bookmarks/:id", async (req, res) => {
    try {
      const bookmark = await storage.getBookmark(req.params.id);
      if (!bookmark) {
        return res.status(404).json({ error: "Bookmark not found" });
      }
      res.json(bookmark);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookmark" });
    }
  });

  app.post("/api/bookmarks", async (req, res) => {
    try {
      const result = insertBookmarkSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.message });
      }

      const bookmark = await storage.createBookmark(result.data);
      res.status(201).json(bookmark);
    } catch (error) {
      res.status(500).json({ error: "Failed to create bookmark" });
    }
  });

  app.patch("/api/bookmarks/:id", async (req, res) => {
    try {
      const bookmark = await storage.updateBookmark(req.params.id, req.body);
      if (!bookmark) {
        return res.status(404).json({ error: "Bookmark not found" });
      }
      res.json(bookmark);
    } catch (error) {
      res.status(500).json({ error: "Failed to update bookmark" });
    }
  });

  app.delete("/api/bookmarks/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteBookmark(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Bookmark not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete bookmark" });
    }
  });

  // Notifications API
  app.get("/api/notifications", async (req, res) => {
    try {
      const notifications = await storage.getNotifications();
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications", adminAuth, async (req, res) => {
    try {
      const result = insertNotificationSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.message });
      }
      const notification = await storage.createNotification(result.data);
      res.status(201).json(notification);
    } catch (error) {
      res.status(500).json({ error: "Failed to create notification" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const notification = await storage.markNotificationRead(req.params.id);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/mark-all-read", async (req, res) => {
    try {
      await storage.markAllNotificationsRead();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  app.delete("/api/notifications/:id", adminAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteNotification(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  // Settings API
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", async (req, res) => {
    try {
      const result = settingsSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.message });
      }
      const settings = await storage.updateSettings(result.data);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Ads API
  app.get("/api/ads", async (req, res) => {
    try {
      const ads = await storage.getAds();
      res.json(ads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ads" });
    }
  });

  app.get("/api/ads/active", async (req, res) => {
    try {
      const ads = await storage.getActiveAds();
      res.json(ads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active ads" });
    }
  });

  app.get("/api/ads/:id", async (req, res) => {
    try {
      const ad = await storage.getAd(req.params.id);
      if (!ad) {
        return res.status(404).json({ error: "Ad not found" });
      }
      res.json(ad);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ad" });
    }
  });

  app.post("/api/ads", adminAuth, async (req, res) => {
    try {
      const result = insertAdSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.message });
      }
      const ad = await storage.createAd(result.data);
      res.status(201).json(ad);
    } catch (error) {
      res.status(500).json({ error: "Failed to create ad" });
    }
  });

  app.patch("/api/ads/:id", adminAuth, async (req, res) => {
    try {
      const ad = await storage.updateAd(req.params.id, req.body);
      if (!ad) {
        return res.status(404).json({ error: "Ad not found" });
      }
      res.json(ad);
    } catch (error) {
      res.status(500).json({ error: "Failed to update ad" });
    }
  });

  app.delete("/api/ads/:id", adminAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteAd(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Ad not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete ad" });
    }
  });

  // Chat API
  app.get("/api/chat", async (req, res) => {
    try {
      const messages = await storage.getChatMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to get chat messages" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const parsed = insertChatMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid message data" });
      }
      const message = await storage.createChatMessage(parsed.data);
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  app.delete("/api/chat/:id", adminAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteChatMessage(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Message not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete message" });
    }
  });

  app.delete("/api/chat", adminAuth, async (req, res) => {
    try {
      await storage.clearChat();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to clear chat" });
    }
  });

  // Recommendations API
  app.get("/api/recommendations", async (req, res) => {
    try {
      const recommendations = await storage.getRecommendations();
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: "Failed to get recommendations" });
    }
  });

  app.post("/api/recommendations", async (req, res) => {
    try {
      const parsed = insertRecommendationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid recommendation data" });
      }
      const recommendation = await storage.createRecommendation(parsed.data);
      res.status(201).json(recommendation);
    } catch (error) {
      res.status(500).json({ error: "Failed to create recommendation" });
    }
  });

  app.patch("/api/recommendations/:id", adminAuth, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status required" });
      }
      const recommendation = await storage.updateRecommendationStatus(req.params.id, status);
      if (!recommendation) {
        return res.status(404).json({ error: "Recommendation not found" });
      }
      res.json(recommendation);
    } catch (error) {
      res.status(500).json({ error: "Failed to update recommendation" });
    }
  });

  app.delete("/api/recommendations/:id", adminAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteRecommendation(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Recommendation not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete recommendation" });
    }
  });

  // Proxy endpoint for browser
  app.get("/api/proxy", async (req, res) => {
    try {
      const targetUrl = req.query.url as string;
      if (!targetUrl) {
        return res.status(400).json({ error: "URL parameter required" });
      }

      const decodedUrl = decodeURIComponent(targetUrl);
      
      // Validate URL
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(decodedUrl);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          return res.status(400).json({ error: "Only HTTP/HTTPS URLs are supported" });
        }
      } catch {
        return res.status(400).json({ error: "Invalid URL" });
      }

      // Security: Block private/internal IPs to prevent SSRF
      if (isPrivateIP(parsedUrl.hostname)) {
        return res.status(403).json({ error: "Access to internal resources is not allowed" });
      }

      const response = await fetch(decodedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'identity',
        },
        redirect: 'follow',
      });

      const contentType = response.headers.get('content-type') || 'text/html';
      const proxyBase = '/api/proxy?url=';

      // Handle different content types
      if (contentType.includes('text/html')) {
        let html = await response.text();
        
        // Add base tag and rewrite URLs
        const baseTag = `<base href="${decodedUrl}">`;
        if (html.includes('<head>')) {
          html = html.replace('<head>', `<head>${baseTag}`);
        } else if (html.includes('<html>')) {
          html = html.replace('<html>', `<html><head>${baseTag}</head>`);
        }
        
        // Rewrite URLs to go through proxy
        html = rewriteUrls(html, decodedUrl, proxyBase);
        
        // Inject Waves-style script to intercept all navigation and requests
        const interceptScript = `
<script>
(function() {
  var __PROXY_BASE__ = '/api/proxy?url=';
  var __TARGET_URL__ = '${decodedUrl}';
  var __TARGET_ORIGIN__ = '${new URL(decodedUrl).origin}';
  
  function resolveUrl(url) {
    if (!url) return __TARGET_URL__;
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('javascript:')) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('//')) return 'https:' + url;
    try {
      return new URL(url, __TARGET_URL__).href;
    } catch(e) { return url; }
  }
  
  function proxyUrl(url) {
    if (!url || typeof url !== 'string') return url;
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('javascript:')) return url;
    if (url.startsWith(__PROXY_BASE__)) return url;
    var resolved = resolveUrl(url);
    if (resolved.startsWith('http')) {
      return __PROXY_BASE__ + encodeURIComponent(resolved);
    }
    return url;
  }
  
  function extractRealUrl(proxyUrl) {
    if (proxyUrl && proxyUrl.includes('/api/proxy?url=')) {
      var match = proxyUrl.match(/\\/api\\/proxy\\?url=([^&]+)/);
      if (match) return decodeURIComponent(match[1]);
    }
    return proxyUrl;
  }
  
  // Intercept fetch
  var originalFetch = window.fetch;
  window.fetch = function(input, init) {
    if (typeof input === 'string') {
      input = proxyUrl(input);
    } else if (input instanceof Request) {
      input = new Request(proxyUrl(input.url), input);
    }
    return originalFetch.call(this, input, init);
  };
  
  // Intercept XMLHttpRequest
  var originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    arguments[1] = proxyUrl(url);
    return originalOpen.apply(this, arguments);
  };
  
  // Intercept WebSocket (proxy through wisp if available)
  var originalWebSocket = window.WebSocket;
  window.WebSocket = function(url, protocols) {
    if (url && !url.startsWith('ws://localhost') && !url.startsWith('wss://localhost')) {
      var target = resolveUrl(url.replace(/^http/, 'ws'));
      var proxyWs = (location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + location.host + '/wisp/';
      console.log('[Proxy] WebSocket connecting to', target);
    }
    return new originalWebSocket(url, protocols);
  };
  window.WebSocket.prototype = originalWebSocket.prototype;
  window.WebSocket.CONNECTING = originalWebSocket.CONNECTING;
  window.WebSocket.OPEN = originalWebSocket.OPEN;
  window.WebSocket.CLOSING = originalWebSocket.CLOSING;
  window.WebSocket.CLOSED = originalWebSocket.CLOSED;
  
  // Intercept Worker
  var originalWorker = window.Worker;
  if (originalWorker) {
    window.Worker = function(scriptURL, options) {
      return new originalWorker(proxyUrl(scriptURL), options);
    };
    window.Worker.prototype = originalWorker.prototype;
  }
  
  // Block analytics/tracking
  window.dataLayer = [];
  window.gtag = function() {};
  window.ga = function() {};
  window.fbq = function() {};
  
  // Intercept link clicks
  document.addEventListener('click', function(e) {
    var target = e.target;
    while (target && target.tagName !== 'A') {
      target = target.parentElement;
    }
    if (target && target.href) {
      var realUrl = extractRealUrl(target.href);
      if (realUrl && realUrl.startsWith('http')) {
        e.preventDefault();
        window.parent.postMessage({ type: 'navigate', url: realUrl }, '*');
      }
    }
  }, true);
  
  // Intercept form submissions
  document.addEventListener('submit', function(e) {
    var form = e.target;
    if (form && form.tagName === 'FORM') {
      e.preventDefault();
      
      var action = form.getAttribute('action') || '';
      var method = (form.getAttribute('method') || 'GET').toUpperCase();
      var formData = new FormData(form);
      
      var actionUrl = extractRealUrl(action);
      var absoluteAction = resolveUrl(actionUrl);
      
      if (method === 'GET') {
        var params = new URLSearchParams();
        for (var pair of formData.entries()) {
          params.append(pair[0], pair[1]);
        }
        var queryString = params.toString();
        var finalUrl = absoluteAction;
        if (queryString) {
          finalUrl += (absoluteAction.includes('?') ? '&' : '?') + queryString;
        }
        window.parent.postMessage({ type: 'navigate', url: finalUrl }, '*');
      } else {
        window.parent.postMessage({ type: 'navigate', url: absoluteAction }, '*');
      }
    }
  }, true);
  
  // Notify parent of current URL on load
  window.parent.postMessage({ type: 'loaded', url: __TARGET_URL__ }, '*');
  
  console.log('[Proxy] Page loaded:', __TARGET_URL__);
})();
</script>`;
        
        // Insert script before </body> or at end
        if (html.includes('</body>')) {
          html = html.replace('</body>', interceptScript + '</body>');
        } else {
          html += interceptScript;
        }
        
        // Remove X-Frame-Options and CSP from response
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
      } else if (contentType.includes('text/css')) {
        let css = await response.text();
        css = css.replace(/url\(["']?([^"')]+)["']?\)/gi, (match, url) => {
          if (url.startsWith('data:')) return match;
          try {
            const absoluteUrl = new URL(url, decodedUrl).href;
            return `url("${proxyBase}${encodeURIComponent(absoluteUrl)}")`;
          } catch {
            return match;
          }
        });
        res.setHeader('Content-Type', contentType);
        res.send(css);
      } else if (contentType.includes('javascript') || contentType.includes('application/json')) {
        const text = await response.text();
        res.setHeader('Content-Type', contentType);
        res.send(text);
      } else {
        // For images and other binary content, pipe directly
        const buffer = Buffer.from(await response.arrayBuffer());
        res.setHeader('Content-Type', contentType);
        res.send(buffer);
      }
    } catch (error) {
      console.error('Proxy error:', error);
      res.status(500).json({ error: "Failed to fetch URL" });
    }
  });

  // Note: Bridge Proxy at /!!/ is handled by middleware in index.ts before Vite setup
  // This ensures the proxy runs before Vite middleware intercepts requests

  return httpServer;
}
