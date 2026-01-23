import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Globe, Gamepad2, Shield, Info } from "lucide-react";
import logoImage from "@assets/image_1768961019530.png";
import { useState, useEffect } from "react";
import type { Settings as SettingsType } from "@shared/schema";
import { defaultSettings, decoyPresets } from "@shared/schema";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<SettingsType>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: settings, isLoading } = useQuery<SettingsType>({
    queryKey: ["/api/settings"],
    enabled: open,
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
      setHasChanges(false);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<SettingsType>) => {
      const res = await apiRequest("PATCH", "/api/settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      setHasChanges(false);
      onOpenChange(false);
    },
  });

  const updateSetting = <K extends keyof SettingsType>(
    key: K,
    value: SettingsType[K]
  ) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateMutation.mutate(localSettings);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <Tabs defaultValue="general" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="general" className="flex items-center gap-1" data-testid="tab-general">
                <Settings className="h-3 w-3" />
                <span className="hidden sm:inline">General</span>
              </TabsTrigger>
              <TabsTrigger value="proxy" className="flex items-center gap-1" data-testid="tab-proxy">
                <Globe className="h-3 w-3" />
                <span className="hidden sm:inline">Proxy</span>
              </TabsTrigger>
              <TabsTrigger value="games" className="flex items-center gap-1" data-testid="tab-games">
                <Gamepad2 className="h-3 w-3" />
                <span className="hidden sm:inline">Arcade</span>
              </TabsTrigger>
              <TabsTrigger value="decoy" className="flex items-center gap-1" data-testid="tab-decoy">
                <Shield className="h-3 w-3" />
                <span className="hidden sm:inline">Decoy</span>
              </TabsTrigger>
              <TabsTrigger value="about" className="flex items-center gap-1" data-testid="tab-about">
                <Info className="h-3 w-3" />
                <span className="hidden sm:inline">About</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4">
              <TabsContent value="general" className="space-y-6 m-0">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="search-engine">Default Search Engine</Label>
                    <Select
                      value={localSettings.searchEngine}
                      onValueChange={(value) => updateSetting("searchEngine", value as SettingsType["searchEngine"])}
                    >
                      <SelectTrigger id="search-engine" data-testid="select-search-engine">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="duckduckgo">DuckDuckGo</SelectItem>
                        <SelectItem value="bing">Bing</SelectItem>
                        <SelectItem value="brave">Brave</SelectItem>
                        <SelectItem value="mojeek">Mojeek</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="proxy" className="space-y-6 m-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Proxy</Label>
                      <p className="text-xs text-muted-foreground">
                        Route traffic through the proxy server
                      </p>
                    </div>
                    <Switch
                      checked={localSettings.proxyEnabled}
                      onCheckedChange={(checked) => updateSetting("proxyEnabled", checked)}
                      data-testid="switch-proxy"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proxy-backend">Backend</Label>
                    <p className="text-xs text-muted-foreground">
                      The engine responsible for loading all your websites
                    </p>
                    <Select
                      value={localSettings.proxyBackend}
                      onValueChange={(value) => updateSetting("proxyBackend", value as SettingsType["proxyBackend"])}
                    >
                      <SelectTrigger id="proxy-backend" data-testid="select-proxy-backend">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bridge">Bridge (Waves-style)</SelectItem>
                        <SelectItem value="scramjet">Scramjet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proxy-transport">Frontend</Label>
                    <p className="text-xs text-muted-foreground">
                      How all the information will be sent
                    </p>
                    <Select
                      value={localSettings.proxyTransport}
                      onValueChange={(value) => updateSetting("proxyTransport", value as SettingsType["proxyTransport"])}
                    >
                      <SelectTrigger id="proxy-transport" data-testid="select-proxy-transport">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="libcurl">Libcurl</SelectItem>
                        <SelectItem value="epoxy">Epoxy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wisp-server">Wisp Server</Label>
                    <p className="text-xs text-muted-foreground">
                      Configure the websocket endpoint
                    </p>
                    <Input
                      id="wisp-server"
                      value={localSettings.wispServer}
                      onChange={(e) => updateSetting("wispServer", e.target.value)}
                      placeholder="wss://your-wisp-server.com/w/"
                      data-testid="input-wisp-server"
                    />
                  </div>

                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">
                      The proxy helps bypass network restrictions and improves loading speeds for games and websites.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="games" className="space-y-6 m-0">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="game-source">Game Source</Label>
                    <p className="text-xs text-muted-foreground">
                      Different sources offer different games (like Waves)
                    </p>
                    <Select
                      value={localSettings.gameSource}
                      onValueChange={(value) => updateSetting("gameSource", value as SettingsType["gameSource"])}
                    >
                      <SelectTrigger id="game-source" data-testid="select-game-source">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PlayerNation">Player Nation</SelectItem>
                        <SelectItem value="GN-Math">GN-Math</SelectItem>
                        <SelectItem value="Selenite">Selenite</SelectItem>
                        <SelectItem value="Truffled">Truffled</SelectItem>
                        <SelectItem value="Velara">Velara</SelectItem>
                        <SelectItem value="DuckMath">DuckMath</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">
                      Arcade sources are fetched from external providers. Different sources offer different titles.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="decoy" className="space-y-6 m-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Cloaking</Label>
                      <p className="text-xs text-muted-foreground">
                        Cloak the current website title and favicon as a different website
                      </p>
                    </div>
                    <Switch
                      checked={localSettings.cloakEnabled}
                      onCheckedChange={(checked) => updateSetting("cloakEnabled", checked)}
                      data-testid="switch-cloak"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="decoy-preset">Decoy Preset</Label>
                    <p className="text-xs text-muted-foreground">
                      Quick presets for common disguises
                    </p>
                    <Select
                      value={localSettings.decoyPreset || "custom"}
                      onValueChange={(value) => {
                        const preset = decoyPresets[value as keyof typeof decoyPresets];
                        updateSetting("decoyPreset", value as SettingsType["decoyPreset"]);
                        if (preset && value !== "custom") {
                          updateSetting("decoyTitle", preset.title);
                          updateSetting("decoyFavicon", preset.favicon);
                        }
                      }}
                    >
                      <SelectTrigger id="decoy-preset" data-testid="select-decoy-preset">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google-docs">Google Docs</SelectItem>
                        <SelectItem value="google-slides">Google Slides</SelectItem>
                        <SelectItem value="google-sites">Google Sites</SelectItem>
                        <SelectItem value="ixl">IXL</SelectItem>
                        <SelectItem value="canvas">Canvas</SelectItem>
                        <SelectItem value="clever">Clever</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="decoy-title">Decoy Tab Title</Label>
                    <p className="text-xs text-muted-foreground">
                      Change the browser tab title to hide GuiBV
                    </p>
                    <Input
                      id="decoy-title"
                      value={localSettings.decoyTitle}
                      onChange={(e) => {
                        updateSetting("decoyTitle", e.target.value);
                        updateSetting("decoyPreset", "custom");
                      }}
                      placeholder="Google Docs"
                      data-testid="input-decoy-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="decoy-favicon">Decoy Favicon URL</Label>
                    <p className="text-xs text-muted-foreground">
                      URL to a favicon image to use when cloaked
                    </p>
                    <Input
                      id="decoy-favicon"
                      value={localSettings.decoyFavicon}
                      onChange={(e) => {
                        updateSetting("decoyFavicon", e.target.value);
                        updateSetting("decoyPreset", "custom");
                      }}
                      placeholder="https://www.google.com/favicon.ico"
                      data-testid="input-decoy-favicon"
                    />
                  </div>
                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">
                      Press <kbd className="px-2 py-0.5 bg-background rounded text-xs">Esc</kbd> to quickly activate decoy mode. The tab title and favicon will change to look like a different website.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="about" className="space-y-6 m-0">
                <div className="flex flex-col items-center text-center py-8">
                  <img src={logoImage} alt="GuiBV" className="w-16 h-16 rounded-lg mb-4" data-testid="img-guibv-logo" />
                  <h3 className="font-heading font-bold text-2xl bg-gradient-to-r from-primary to-yellow-400 bg-clip-text text-transparent">
                    GuiBV
                  </h3>
                  <p className="text-muted-foreground mt-1">Version 1.0.0</p>
                  <p className="text-sm text-muted-foreground mt-4 max-w-sm">
                    A custom browser gaming platform. Play games, browse the web, and manage your bookmarks all in one place.
                  </p>
                  <div className="mt-6">
                    <p className="text-xs text-muted-foreground">
                      Thank you for using GuiBV!
                    </p>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        )}

        {hasChanges && (
          <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              data-testid="button-save-settings"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
