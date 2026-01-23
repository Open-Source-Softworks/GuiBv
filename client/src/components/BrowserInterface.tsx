import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Search,
  Plus,
  X,
  Globe,
  ExternalLink,
  Shield,
  Maximize,
  Minimize,
} from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { BrowserTab, Settings } from "@shared/schema";

const searchEngineUrls: Record<string, string> = {
  google: "https://www.google.com/search?q=",
  duckduckgo: "https://duckduckgo.com/?q=",
  bing: "https://www.bing.com/search?q=",
  brave: "https://search.brave.com/search?q=",
  mojeek: "https://www.mojeek.com/search?q=",
};

interface BrowserInterfaceProps {
  initialUrl?: string;
  gameMode?: boolean;
  gameTitle?: string;
}

export function BrowserInterface({ initialUrl = "", gameMode = false, gameTitle = "" }: BrowserInterfaceProps) {
  const [tabs, setTabs] = useState<BrowserTab[]>([
    {
      id: "1",
      title: "New Tab",
      url: initialUrl || "",
      favicon: "",
      active: true,
    },
  ]);
  const [addressBarValue, setAddressBarValue] = useState(initialUrl || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  const activeTab = tabs.find((tab) => tab.active);
  const searchEngine = settings?.searchEngine || "duckduckgo";
  const proxyEnabled = settings?.proxyEnabled || false;
  const proxyBackend = settings?.proxyBackend || "bridge";
  const proxyTransport = settings?.proxyTransport || "libcurl";
  const wispServer = settings?.wispServer || "";

  const isValidUrl = (string: string) => {
    try {
      new URL(string.startsWith("http") ? string : `https://${string}`);
      return string.includes(".");
    } catch {
      return false;
    }
  };

  const formatUrl = (url: string) => {
    if (!url) return "";
    let targetUrl = url;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      targetUrl = url;
    } else if (isValidUrl(url)) {
      targetUrl = `https://${url}`;
    } else {
      const searchUrl = searchEngineUrls[searchEngine] || searchEngineUrls.duckduckgo;
      targetUrl = `${searchUrl}${encodeURIComponent(url)}`;
    }
    return targetUrl;
  };

  const getProxyUrl = (url: string) => {
    if (!url) return "";
    
    // If already a bridge URL, return as-is
    if (url.startsWith('/!!/')) {
      return url;
    }
    
    // Use Scramjet proxy if enabled
    if (proxyBackend === "scramjet" && proxyEnabled) {
      const wispUrl = wispServer || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/wisp/`;
      return `/scramjet-frame.html?url=${encodeURIComponent(url)}&transport=${proxyTransport}&wisp=${encodeURIComponent(wispUrl)}`;
    }
    
    // Use Waves-style Bridge proxy as default (recommended)
    return `/!!/${url}`;
  };

  const navigate = (url: string) => {
    const formattedUrl = formatUrl(url);
    if (!formattedUrl) return;

    setIsLoading(true);
    setAddressBarValue(formattedUrl);
    
    let title = "New Tab";
    try {
      title = new URL(formattedUrl).hostname;
    } catch {
      title = formattedUrl.slice(0, 30);
    }
    
    setTabs((prev) =>
      prev.map((tab) =>
        tab.active
          ? { ...tab, url: formattedUrl, title }
          : tab
      )
    );

    setTimeout(() => setIsLoading(false), 1000);
  };

  // Listen for messages from proxied iframe for link navigation
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;
      
      // Handle navigation requests from proxy
      if (event.data.type === 'navigate' && event.data.url) {
        navigate(event.data.url);
      }
      
      // Handle legacy loaded message
      if (event.data.type === 'loaded' && event.data.url) {
        setAddressBarValue(event.data.url);
        setIsLoading(false);
      }
      
      // Handle Bridge proxy loaded message (Waves-style)
      if (event.data.type === 'bridge-loaded' && event.data.url) {
        setAddressBarValue(event.data.url);
        setIsLoading(false);
        let title = "New Tab";
        try {
          title = new URL(event.data.url).hostname;
        } catch {
          title = event.data.url.slice(0, 30);
        }
        setTabs((prev) =>
          prev.map((tab) =>
            tab.active ? { ...tab, url: event.data.url, title } : tab
          )
        );
      }
      
      if (event.data.type === 'navigated' && event.data.url) {
        setAddressBarValue(event.data.url);
        let title = "New Tab";
        try {
          title = new URL(event.data.url).hostname;
        } catch {
          title = event.data.url.slice(0, 30);
        }
        setTabs((prev) =>
          prev.map((tab) =>
            tab.active ? { ...tab, url: event.data.url, title } : tab
          )
        );
      }
      
      if (event.data.type === 'error') {
        setIsLoading(false);
        console.error("Proxy error:", event.data.message, event.data.detail);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      navigate(addressBarValue);
    }
  };

  const handleRefresh = () => {
    if (activeTab?.url) {
      setIsLoading(true);
      if (iframeRef.current) {
        iframeRef.current.src = getProxyUrl(activeTab.url);
      }
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  const handleHome = () => {
    setAddressBarValue("");
    setTabs((prev) =>
      prev.map((tab) =>
        tab.active ? { ...tab, url: "", title: "New Tab" } : tab
      )
    );
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const addTab = () => {
    const newTab: BrowserTab = {
      id: Date.now().toString(),
      title: "New Tab",
      url: "",
      favicon: "",
      active: true,
    };
    setTabs((prev) =>
      prev.map((tab) => ({ ...tab, active: false })).concat(newTab)
    );
    setAddressBarValue("");
  };

  const closeTab = (tabId: string) => {
    if (tabs.length === 1) {
      handleHome();
      return;
    }

    const tabIndex = tabs.findIndex((tab) => tab.id === tabId);
    const isActiveTab = tabs[tabIndex].active;

    setTabs((prev) => {
      const filtered = prev.filter((tab) => tab.id !== tabId);
      if (isActiveTab && filtered.length > 0) {
        const newActiveIndex = Math.min(tabIndex, filtered.length - 1);
        filtered[newActiveIndex].active = true;
        setAddressBarValue(filtered[newActiveIndex].url);
      }
      return filtered;
    });
  };

  const switchTab = (tabId: string) => {
    setTabs((prev) =>
      prev.map((tab) => {
        const isActive = tab.id === tabId;
        if (isActive) {
          setAddressBarValue(tab.url);
        }
        return { ...tab, active: isActive };
      })
    );
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-background">
      {gameMode ? (
        <div className="flex items-center gap-2 p-2 bg-sidebar border-b border-border">
          <div className="flex items-center gap-2 flex-1">
            <Globe className="h-4 w-4 text-primary" />
            <span className="font-heading font-medium text-foreground">{gameTitle || "Playing Game"}</span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleFullscreen}
            data-testid="button-fullscreen"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleRefresh}
            data-testid="button-refresh"
          >
            <RotateCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1 p-2 bg-sidebar border-b border-border">
            <ScrollArea className="flex-1">
              <div className="flex items-center gap-1">
                {tabs.map((tab) => (
                  <div
                    key={tab.id}
                    onClick={() => switchTab(tab.id)}
                    className={`group flex items-center gap-2 px-3 py-1.5 rounded-md text-sm max-w-[180px] min-w-[100px] transition-colors cursor-pointer ${
                      tab.active
                        ? "bg-background text-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                    data-testid={`browser-tab-${tab.id}`}
                  >
                    {tab.url ? (
                      <Globe className="h-3 w-3 flex-shrink-0" />
                    ) : (
                      <Plus className="h-3 w-3 flex-shrink-0" />
                    )}
                    <span className="truncate flex-1 text-left">
                      {tab.title || "New Tab"}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                          closeTab(tab.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted-foreground/20 transition-opacity"
                      data-testid={`browser-tab-close-${tab.id}`}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </div>
                ))}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 flex-shrink-0"
                  onClick={addTab}
                  data-testid="button-new-tab"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          <div className="flex items-center gap-2 p-2 bg-sidebar border-b border-border">
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                data-testid="button-forward"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={handleRefresh}
                data-testid="button-refresh"
              >
                <RotateCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={handleHome}
                data-testid="button-home"
              >
                <Home className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={addressBarValue}
                onChange={(e) => setAddressBarValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search or enter URL..."
                className="pl-10 pr-10 h-9 bg-input"
                data-testid="input-address-bar"
              />
              {activeTab?.url && (
                <a
                  href={activeTab.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>

            <Badge variant="secondary" className="gap-1 flex-shrink-0" data-testid="badge-proxy">
              <Shield className="h-3 w-3" />
              {proxyBackend === "bridge" ? "Bridge" : proxyBackend === "scramjet" ? "Scramjet" : proxyBackend === "ultraviolet" ? "UV" : "Proxy"}
            </Badge>
          </div>
        </>
      )}

      <div className="flex-1 relative bg-card">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        )}

        {!activeTab?.url ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center max-w-lg px-4">
              <h2 className="font-heading text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-yellow-400 bg-clip-text text-transparent">
                Welcome to GuiBV Browser
              </h2>
              <p className="text-muted-foreground mb-8">
                Enter a URL or search term in the address bar above to start browsing
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { name: "DuckDuckGo", url: "https://duckduckgo.com" },
                  { name: "YouTube", url: "https://youtube.com" },
                  { name: "TikTok", url: "https://tiktok.com" },
                  { name: "CrazyGames", url: "https://crazygames.com" },
                ].map((site) => (
                  <button
                    key={site.name}
                    onClick={() => navigate(site.url)}
                    className="p-4 rounded-md bg-card border border-card-border hover:border-primary/50 transition-colors"
                    data-testid={`quick-link-${site.name.toLowerCase()}`}
                  >
                    <Globe className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <span className="text-sm">{site.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={getProxyUrl(activeTab.url)}
            className="w-full h-full border-0"
            title="Browser Content"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox"
            data-testid="browser-iframe"
          />
        )}
      </div>
    </div>
  );
}

export function BrowserSkeleton() {
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-2 p-2 bg-sidebar border-b border-border">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-8" />
      </div>
      <div className="flex items-center gap-2 p-2 bg-sidebar border-b border-border">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="flex-1 h-9" />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <Skeleton className="w-64 h-32" />
      </div>
    </div>
  );
}
