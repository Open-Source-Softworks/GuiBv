import type { Settings } from "@shared/schema";

let scramjetInitialized = false;
let scramjetFrame: HTMLIFrameElement | null = null;

export async function initScramjet(settings: Settings): Promise<void> {
  if (scramjetInitialized) return;

  try {
    const transport = settings.proxyTransport === "epoxy" ? "/epoxy/index.mjs" : "/libcurl/index.mjs";
    const wispUrl = settings.wispServer || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/wisp/`;

    const { BareMuxConnection } = await import("@mercuryworkshop/bare-mux");
    const connection = new BareMuxConnection("/baremux/worker.js");
    
    await connection.setTransport(transport, [{ wisp: wispUrl }]);
    
    scramjetInitialized = true;
    console.log("Scramjet initialized with transport:", transport, "wisp:", wispUrl);
  } catch (error) {
    console.error("Failed to initialize Scramjet:", error);
    throw error;
  }
}

export function getScramjetUrl(url: string): string {
  const codec = window.location.pathname.includes("xor") ? "xor" : "plain";
  const encodedUrl = encodeScramjetUrl(url, codec);
  return `/scramjet/${encodedUrl}`;
}

function encodeScramjetUrl(url: string, codec: string = "plain"): string {
  if (codec === "xor") {
    return xorEncode(url);
  }
  return encodeURIComponent(url);
}

function xorEncode(str: string): string {
  const key = 2;
  return btoa(
    str
      .split("")
      .map((char) => String.fromCharCode(char.charCodeAt(0) ^ key))
      .join("")
  );
}

export function isScramjetReady(): boolean {
  return scramjetInitialized;
}

export function resetScramjet(): void {
  scramjetInitialized = false;
  scramjetFrame = null;
}
