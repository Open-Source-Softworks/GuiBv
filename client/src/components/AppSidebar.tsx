import { Link, useLocation } from "wouter";
import { Home, Gamepad2, Globe, Bookmark, Settings, Bell, Sun, Moon, MessageCircle } from "lucide-react";
import logoImage from "@assets/image_1768961019530.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";
import { useState } from "react";
import { NotificationsPanel } from "./NotificationsPanel";
import { SettingsModal } from "./SettingsModal";

const navItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Apps", url: "/games", icon: Gamepad2 },
  { title: "Browser", url: "/browser", icon: Globe },
  { title: "Bookmarks", url: "/bookmarks", icon: Bookmark },
  { title: "Community", url: "/community", icon: MessageCircle },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <img src={logoImage} alt="GuiBV" className="h-8 w-8 rounded" />
                <span className="text-xl font-bold font-heading bg-gradient-to-r from-primary to-yellow-400 bg-clip-text text-transparent">
                  GuiBV
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setNotificationsOpen(true)}
                data-testid="button-notifications"
                className="relative"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-primary rounded-full" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleTheme}
                data-testid="button-theme-toggle"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive = location === item.url || 
                    (item.url !== "/" && location.startsWith(item.url));
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.url} data-testid={`nav-${item.title.toLowerCase()}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setSettingsOpen(true)} data-testid="nav-settings">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4">
          <p 
            className="text-[8px] text-muted-foreground/30 mt-2 select-none cursor-default hover:text-primary/50 transition-colors"
            title="You found the secret!"
            data-testid="easter-egg"
          >
            Gui &lt;3
          </p>
        </SidebarFooter>
      </Sidebar>

      <NotificationsPanel 
        open={notificationsOpen} 
        onOpenChange={setNotificationsOpen} 
      />
      <SettingsModal 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
      />
    </>
  );
}
