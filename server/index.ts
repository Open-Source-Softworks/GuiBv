import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";
import WebSocket, { WebSocketServer } from "ws";

const app = express();

// Configure Wisp server
logging.set_level(logging.NONE);
Object.assign(wisp.options, {
  allow_udp_streams: false,
  dns_servers: ["1.1.1.3", "1.0.0.3"],
});

const httpServer = createServer((req, res) => {
  // Only add COOP/COEP for Scramjet paths (needs SharedArrayBuffer)
  // Don't apply to Bridge proxy or regular pages as it breaks Discord/complex sites
  if (req.url?.startsWith('/scramjet') || req.url?.startsWith('/baremux') || req.url?.startsWith('/libcurl') || req.url?.startsWith('/epoxy')) {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  }
  app(req, res);
});

// Create WebSocket server for bridge proxy (noServer mode)
const bridgeWss = new WebSocketServer({ noServer: true });

// Check for private IP addresses (SSRF protection)
function isPrivateIP(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return true;
  const ipv4Match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 0) return true;
  }
  return false;
}

bridgeWss.on('connection', (clientWs, req) => {
  // Extract target URL from the request
  const encodedUrl = req.url?.substring("/!!/ws/".length) || "";
  let targetUrl: string;
  try {
    targetUrl = decodeURIComponent(encodedUrl);
    if (!targetUrl.startsWith('ws://') && !targetUrl.startsWith('wss://')) {
      clientWs.close(1002, 'Invalid WebSocket URL');
      return;
    }
    // Block private IPs for SSRF protection
    const wsUrl = new URL(targetUrl);
    if (isPrivateIP(wsUrl.hostname)) {
      clientWs.close(1002, 'Access to internal resources not allowed');
      return;
    }
  } catch {
    clientWs.close(1002, 'Invalid URL encoding');
    return;
  }

  // Connect to the target WebSocket
  const targetWs = new WebSocket(targetUrl);

  targetWs.on('open', () => {
    // Relay messages from client to target
    clientWs.on('message', (data, isBinary) => {
      if (targetWs.readyState === WebSocket.OPEN) {
        targetWs.send(data, { binary: isBinary });
      }
    });

    // Relay messages from target to client
    targetWs.on('message', (data, isBinary) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(data, { binary: isBinary });
      }
    });
  });

  clientWs.on('close', () => targetWs.close());
  targetWs.on('close', () => clientWs.close());
  clientWs.on('error', () => targetWs.close());
  targetWs.on('error', () => clientWs.close());
});

// Handle WebSocket upgrade requests for Wisp and Bridge proxy
httpServer.on("upgrade", (req, socket, head) => {
  if (req.url?.endsWith("/wisp/")) {
    wisp.routeRequest(req, socket, head);
  } else if (req.url?.startsWith("/!!/ws/")) {
    // Bridge WebSocket proxy - use proper handleUpgrade
    bridgeWss.handleUpgrade(req, socket, head, (ws) => {
      bridgeWss.emit('connection', ws, req);
    });
  } else {
    socket.end();
  }
});

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Capture raw body for all content types (needed for bridge proxy)
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(
  express.urlencoded({
    extended: false,
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

// Capture raw body for other content types (for bridge proxy)
app.use(
  express.raw({
    type: ['application/octet-stream', 'multipart/form-data', '*/*'],
    limit: '50mb',
    verify: (req, _res, buf) => {
      if (!req.rawBody) {
        req.rawBody = buf;
      }
    },
  }),
);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

// Bridge Proxy Middleware - MUST be registered BEFORE Vite setup
// This handles /!!/ paths for the Waves-style proxy
import { handleBridgeProxy } from "./routes";

app.use((req, res, next) => {
  // Use originalUrl to handle URL-encoded paths (%21%21 = !!)
  const fullUrl = req.originalUrl || req.url || '';
  const hasPrefix = fullUrl.indexOf('/!!/') !== -1 || fullUrl.indexOf('/%21%21/') !== -1;
  if (!hasPrefix) {
    return next();
  }
  handleBridgeProxy(req, res);
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
