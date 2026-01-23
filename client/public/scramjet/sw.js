importScripts("/scramjet/scramjet.codecs.js");
importScripts("/scramjet/scramjet.config.js");

const config = self.__scramjet$config;
const codec = self.__scramjet$codecs;

let bareMuxPort = null;

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "getPort" && event.data.port) {
    event.data.port.postMessage(bareMuxPort, [bareMuxPort]);
  }
  if (event.data && event.data.type === "setPort" && event.data.port) {
    bareMuxPort = event.data.port;
    console.log("[Scramjet SW] BareMux port received");
  }
});

self.addEventListener("install", () => {
  console.log("[Scramjet SW] Installing...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[Scramjet SW] Activated");
  event.waitUntil(self.clients.claim());
});

async function bareFetch(url, options = {}) {
  if (!bareMuxPort) {
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clients) {
      try {
        const channel = new MessageChannel();
        client.postMessage({ type: "getPort", port: channel.port2 }, [channel.port2]);
        const port = await new Promise((resolve, reject) => {
          channel.port1.onmessage = (e) => resolve(e.data);
          setTimeout(() => reject(new Error("Timeout getting port")), 3000);
        });
        if (port instanceof MessagePort) {
          bareMuxPort = port;
          break;
        }
      } catch (e) {
        console.warn("[Scramjet SW] Failed to get port from client:", e);
      }
    }
  }

  if (!bareMuxPort) {
    throw new Error("No BareMux port available");
  }

  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = (event) => {
      if (event.data.type === "fetch") {
        const { status, statusText, headers, body } = event.data.fetch;
        resolve(new Response(body, { status, statusText, headers }));
      } else if (event.data.type === "error") {
        reject(new Error(event.data.error));
      }
    };

    const message = {
      message: {
        type: "fetch",
        fetch: {
          remote: url,
          method: options.method || "GET",
          headers: options.headers || {},
          body: options.body || null
        }
      },
      port: channel.port2
    };

    bareMuxPort.postMessage(message, [channel.port2]);
  });
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const prefix = config.prefix;

  if (!url.pathname.startsWith(prefix)) {
    return;
  }

  const encodedUrl = url.pathname.slice(prefix.length);
  
  if (!encodedUrl) {
    event.respondWith(new Response("No URL provided", { status: 400 }));
    return;
  }

  let targetUrl;
  try {
    targetUrl = decodeURIComponent(encodedUrl);
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = "https://" + targetUrl;
    }
  } catch (e) {
    event.respondWith(new Response("Invalid URL encoding", { status: 400 }));
    return;
  }

  console.log("[Scramjet SW] Proxying:", targetUrl);

  event.respondWith(
    bareFetch(targetUrl, {
      method: event.request.method,
      headers: Object.fromEntries(event.request.headers.entries()),
      body: event.request.method !== "GET" && event.request.method !== "HEAD" 
        ? event.request.body 
        : null
    }).catch((error) => {
      console.error("[Scramjet SW] Fetch error:", error);
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><title>Proxy Error</title></head>
        <body style="background:#1a1a1a;color:#fff;font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;">
          <div style="text-align:center;">
            <h1 style="color:#f5a623;">Scramjet Proxy Error</h1>
            <p>Failed to load: ${targetUrl}</p>
            <p style="color:#888;font-size:14px;">${error.message}</p>
            <p style="color:#666;font-size:12px;margin-top:20px;">
              Make sure a valid Wisp server is configured in Settings.
            </p>
          </div>
        </body>
        </html>
      `, {
        status: 502,
        headers: { "Content-Type": "text/html" }
      });
    })
  );
});
