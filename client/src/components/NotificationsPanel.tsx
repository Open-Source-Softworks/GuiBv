import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Check, ChevronDown, ChevronUp, Megaphone, Sparkles, Wrench } from "lucide-react";
import { useState } from "react";
import type { Notification } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface NotificationsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getNotificationIcon(type: Notification["type"]) {
  switch (type) {
    case "update":
      return <Wrench className="h-4 w-4" />;
    case "feature":
      return <Sparkles className="h-4 w-4" />;
    case "announcement":
      return <Megaphone className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
}

function getNotificationBadgeVariant(type: Notification["type"]) {
  switch (type) {
    case "update":
      return "default";
    case "feature":
      return "secondary";
    case "announcement":
      return "outline";
    default:
      return "secondary";
  }
}

function NotificationItem({ notification, onMarkRead }: { notification: Notification; onMarkRead: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`p-4 border-b border-border last:border-b-0 ${
        notification.read ? "opacity-60" : ""
      }`}
      data-testid={`notification-${notification.id}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium text-sm">{notification.title}</h4>
              <Badge variant={getNotificationBadgeVariant(notification.type)} className="text-xs">
                {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
              </Badge>
            </div>
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => onMarkRead(notification.id)}
                data-testid={`button-mark-read-${notification.id}`}
              >
                <Check className="h-3 w-3 mr-1" />
                Mark read
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {notification.description}
          </p>
          {notification.details && (
            <>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
                data-testid={`notification-expand-${notification.id}`}
              >
                {expanded ? "Hide details" : "Show details"}
                {expanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
              {expanded && (
                <div className="mt-2 p-3 bg-muted rounded-md text-xs whitespace-pre-wrap">
                  {notification.details}
                </div>
              )}
            </>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {formatDistanceToNow(new Date(notification.date), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotificationsPanel({ open, onOpenChange }: NotificationsPanelProps) {
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: open,
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/notifications/mark-all-read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const handleMarkRead = (id: string) => {
    markReadMutation.mutate(id);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="default" className="ml-1">
                  {unreadCount}
                </Badge>
              )}
            </SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending || unreadCount === 0}
              data-testid="button-mark-all-read"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all as read
            </Button>
          </div>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-80px)]">
          {isLoading ? (
            <NotificationsSkeleton />
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <h4 className="font-medium text-sm mb-1">No notifications</h4>
              <p className="text-xs text-muted-foreground">
                You're all caught up!
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} onMarkRead={handleMarkRead} />
            ))
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
