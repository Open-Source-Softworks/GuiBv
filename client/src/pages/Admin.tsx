import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Bell, Shield, Trash2, Plus, LogOut, Megaphone, Check, X, Lightbulb, MessageCircle } from "lucide-react";
import type { Notification, Ad, Recommendation } from "@shared/schema";

const ADMIN_USERNAME = "GuiAdmin";
const ADMIN_PASSWORD = "1k16AunfH5";

function getAuthHeader() {
  const credentials = btoa(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`);
  return `Basic ${credentials}`;
}

async function adminApiRequest(method: string, url: string, data?: unknown) {
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": getAuthHeader(),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res;
}

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setLoginError("");
    } else {
      setLoginError("Invalid credentials");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-heading">Admin Access</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  data-testid="input-admin-username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  data-testid="input-admin-password"
                />
              </div>
              {loginError && (
                <p className="text-sm text-destructive">{loginError}</p>
              )}
              <Button type="submit" className="w-full" data-testid="button-admin-login">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AdminDashboard onLogout={handleLogout} />;
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage notifications and ads</p>
        </div>
        <Button variant="outline" onClick={onLogout} data-testid="button-admin-logout">
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>

      <Tabs defaultValue="notifications">
        <TabsList>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="ads" className="gap-2">
            <Megaphone className="h-4 w-4" />
            Ads
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Recommendations
          </TabsTrigger>
        </TabsList>
        <TabsContent value="notifications" className="mt-6">
          <NotificationsManager />
        </TabsContent>
        <TabsContent value="ads" className="mt-6">
          <AdsManager />
        </TabsContent>
        <TabsContent value="recommendations" className="mt-6">
          <RecommendationsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NotificationsManager() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"update" | "announcement" | "feature">("announcement");
  const [details, setDetails] = useState("");

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; type: string; details?: string }) => {
      return adminApiRequest("POST", "/api/notifications", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      setTitle("");
      setDescription("");
      setDetails("");
      toast({ title: "Notification created!" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminApiRequest("DELETE", `/api/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "Notification deleted" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    createMutation.mutate({ title, description, type, details: details || undefined });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Notification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notif-title">Title</Label>
              <Input
                id="notif-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title"
                data-testid="input-notif-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notif-type">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger data-testid="select-notif-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="feature">Feature</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notif-desc">Description</Label>
              <Textarea
                id="notif-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description"
                data-testid="input-notif-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notif-details">Details (optional)</Label>
              <Textarea
                id="notif-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Additional details..."
                data-testid="input-notif-details"
              />
            </div>
            <Button type="submit" disabled={createMutation.isPending} data-testid="button-create-notif">
              {createMutation.isPending ? "Creating..." : "Create Notification"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Existing Notifications ({notifications.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[500px] overflow-auto">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No notifications yet</p>
          ) : (
            notifications.map((notif) => (
              <div key={notif.id} className="flex items-start justify-between gap-3 p-3 rounded-md bg-muted/50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">{notif.title}</span>
                    <Badge variant="secondary" className="text-xs">{notif.type}</Badge>
                    {notif.read ? (
                      <Check className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{notif.description}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(notif.id)}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-delete-notif-${notif.id}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AdsManager() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [advertiser, setAdvertiser] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const { data: ads = [] } = useQuery<Ad[]>({
    queryKey: ["/api/ads"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; advertiser: string; imageUrl: string; linkUrl: string; expiresAt: string; active: boolean }) => {
      return adminApiRequest("POST", "/api/ads", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ads/active"] });
      setTitle("");
      setAdvertiser("");
      setImageUrl("");
      setLinkUrl("");
      setExpiresAt("");
      toast({ title: "Ad created!" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminApiRequest("DELETE", `/api/ads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ads/active"] });
      toast({ title: "Ad deleted" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      return adminApiRequest("PATCH", `/api/ads/${id}`, { active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ads/active"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !advertiser || !imageUrl || !linkUrl) return;
    const expires = expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    createMutation.mutate({
      title,
      advertiser,
      imageUrl,
      linkUrl,
      expiresAt: expires,
      active: true,
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Ad
          </CardTitle>
          <CardDescription>Paid advertising for the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ad-title">Ad Title</Label>
              <Input
                id="ad-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ad title"
                data-testid="input-ad-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ad-advertiser">Advertiser Name</Label>
              <Input
                id="ad-advertiser"
                value={advertiser}
                onChange={(e) => setAdvertiser(e.target.value)}
                placeholder="Company or person paying for ad"
                data-testid="input-ad-advertiser"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ad-image">Image URL</Label>
              <Input
                id="ad-image"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                data-testid="input-ad-image"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ad-link">Link URL</Label>
              <Input
                id="ad-link"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                data-testid="input-ad-link"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ad-expires">Expires At (optional, defaults to 30 days)</Label>
              <Input
                id="ad-expires"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                data-testid="input-ad-expires"
              />
            </div>
            <Button type="submit" disabled={createMutation.isPending} data-testid="button-create-ad">
              {createMutation.isPending ? "Creating..." : "Create Ad"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Existing Ads ({ads.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[500px] overflow-auto">
          {ads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No ads yet</p>
          ) : (
            ads.map((ad) => (
              <div key={ad.id} className="flex items-start justify-between gap-3 p-3 rounded-md bg-muted/50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">{ad.title}</span>
                    <Badge variant={ad.active ? "default" : "secondary"} className="text-xs">
                      {ad.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">by {ad.advertiser}</p>
                  {ad.expiresAt && (
                    <p className="text-xs text-muted-foreground">
                      Expires: {new Date(ad.expiresAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => toggleMutation.mutate({ id: ad.id, active: !ad.active })}
                    data-testid={`button-toggle-ad-${ad.id}`}
                  >
                    {ad.active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(ad.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-ad-${ad.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RecommendationsManager() {
  const { toast } = useToast();

  const { data: recommendations = [] } = useQuery<Recommendation[]>({
    queryKey: ["/api/recommendations"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Recommendation["status"] }) => {
      return adminApiRequest("PATCH", `/api/recommendations/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      toast({ title: "Status updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminApiRequest("DELETE", `/api/recommendations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      toast({ title: "Recommendation deleted" });
    },
  });

  const getStatusColor = (status: Recommendation["status"]) => {
    switch (status) {
      case "pending": return "secondary";
      case "reviewed": return "outline";
      case "implemented": return "default";
      case "rejected": return "destructive";
      default: return "secondary";
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          User Recommendations ({recommendations.length})
        </CardTitle>
        <CardDescription>View and manage feature suggestions from users</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[600px] overflow-auto">
        {recommendations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recommendations yet</p>
          </div>
        ) : (
          recommendations.map((rec) => (
            <div key={rec.id} className="p-4 rounded-lg bg-muted/50 border" data-testid={`recommendation-${rec.id}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getStatusColor(rec.status)} className="text-xs">
                      {rec.status}
                    </Badge>
                    {rec.submittedBy && (
                      <span className="text-xs text-muted-foreground">
                        from {rec.submittedBy}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(rec.timestamp)}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(rec.id)}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-delete-rec-${rec.id}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              
              <p className="text-sm mb-3 whitespace-pre-wrap">{rec.suggestion}</p>
              
              <div className="flex flex-wrap gap-2">
                {(["pending", "reviewed", "implemented", "rejected"] as const).map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={rec.status === status ? "default" : "outline"}
                    onClick={() => updateStatusMutation.mutate({ id: rec.id, status })}
                    disabled={updateStatusMutation.isPending || rec.status === status}
                    className="text-xs capitalize"
                    data-testid={`button-set-status-${status}-${rec.id}`}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
