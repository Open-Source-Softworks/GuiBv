import { Switch, Route } from "wouter";
import { useEffect, useRef } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { StarfieldBackground } from "@/components/StarfieldBackground";
import { apiRequest } from "@/lib/queryClient";
import type { Settings } from "@shared/schema";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Games from "@/pages/Games";
import Browser from "@/pages/Browser";
import Bookmarks from "@/pages/Bookmarks";
import Community from "@/pages/Community";
import Admin from "@/pages/Admin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/games" component={Games} />
      <Route path="/browser" component={Browser} />
      <Route path="/bookmarks" component={Bookmarks} />
      <Route path="/community" component={Community} />
      <Route path="/gui-admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function CloakingProvider({ children }: { children: React.ReactNode }) {
  const originalTitle = useRef<string>(document.title);
  const originalFavicon = useRef<string | null>(null);
  const initialized = useRef(false);

  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  const toggleCloak = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await apiRequest("PATCH", "/api/settings", { cloakEnabled: enabled });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
  });

  useEffect(() => {
    if (!initialized.current) {
      originalTitle.current = document.title;
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) {
        originalFavicon.current = link.href;
      }
      initialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (!settings) return;

    if (settings.cloakEnabled) {
      document.title = settings.decoyTitle || "Google Docs";
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link && settings.decoyFavicon) {
        link.href = settings.decoyFavicon;
      }
    } else {
      document.title = originalTitle.current;
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link && originalFavicon.current) {
        link.href = originalFavicon.current;
      }
    }
  }, [settings?.cloakEnabled, settings?.decoyTitle, settings?.decoyFavicon]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "`") {
        e.preventDefault();
        toggleCloak.mutate(!settings?.cloakEnabled);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [settings?.cloakEnabled]);

  return <>{children}</>;
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <CloakingProvider>
            <StarfieldBackground />
            <SidebarProvider style={style as React.CSSProperties}>
              <div className="flex h-screen w-full relative z-10">
                <AppSidebar />
                <SidebarInset className="flex flex-col flex-1 overflow-hidden">
                  <header className="flex items-center h-12 px-4 border-b border-border bg-sidebar/80 backdrop-blur-sm sticky top-0 z-50">
                    <SidebarTrigger data-testid="button-sidebar-toggle" />
                  </header>
                  <main className="flex-1 overflow-auto">
                    <Router />
                  </main>
                </SidebarInset>
              </div>
            </SidebarProvider>
            <Toaster />
          </CloakingProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
