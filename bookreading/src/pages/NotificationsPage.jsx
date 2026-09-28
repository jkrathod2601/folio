import { Heart, MessageCircle, UserPlus, BookOpen, Check } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const mockNotifications = [
  { id: 1, type: "like", user: { name: "Neha Sharma" }, content: "liked your page", page: "Yaadein", time: "2 hours ago", isRead: false },
  { id: 2, type: "comment", user: { name: "Rahul Verma" }, content: "commented on your page", page: "Subah Ki Chai", comment: "Bahut khoobsurat likha hai!", time: "5 hours ago", isRead: false },
  { id: 3, type: "follow", user: { name: "Priya Patel" }, content: "started following you", time: "1 day ago", isRead: true },
  { id: 4, type: "page", user: { name: "Amit Singh" }, content: "published a new page in", book: "Daily Gratitude", time: "1 day ago", isRead: true },
  { id: 5, type: "like", user: { name: "Sneha Joshi" }, content: "liked your page", page: "Dosti", time: "2 days ago", isRead: true },
  { id: 6, type: "comment", user: { name: "Jay Rathod" }, content: "replied to your comment on", page: "Raat Ki Baatein", comment: "Thanks for sharing!", time: "3 days ago", isRead: true },
];

const icons = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  page: BookOpen,
};

function NotificationsPage() {
  return (
    <div className="max-w-[820px]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-wide text-zinc-950">Notifications</h1>
          <p className="mt-1 font-mono text-xs text-zinc-500">2 unread</p>
        </div>
        <Button variant="ghost" size="sm" className="font-mono normal-case tracking-normal text-zinc-500 hover:text-black">
          <Check className="mr-1.5 h-4 w-4" />
          Mark all read
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {mockNotifications.map((notification) => {
          const Icon = icons[notification.type] || BookOpen;
          return (
            <Card key={notification.id} className={notification.isRead ? "bg-white" : "bg-zinc-50 border-zinc-300"}>
              <div className="flex gap-3 p-4">
                <Avatar className="h-9 w-9 shrink-0 grayscale ring-1 ring-zinc-200">
                  <AvatarFallback className="bg-zinc-100 text-zinc-700">
                    <Icon className="h-3.5 w-3.5" />
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-body text-sm font-bold text-zinc-950">{notification.user.name}</span>
                    {!notification.isRead && <span className="h-2 w-2 rounded-full bg-black" />}
                  </div>
                  <p className="mt-1 font-body text-sm text-zinc-600">
                    {notification.content}{" "}
                    {(notification.page || notification.book) && (
                      <span className="font-semibold text-zinc-950">{notification.page || notification.book}</span>
                    )}
                  </p>
                  {notification.comment && (
                    <p className="mt-2 rounded-lg border border-zinc-200 bg-white p-3 font-body text-sm italic text-zinc-600">
                      &ldquo;{notification.comment}&rdquo;
                    </p>
                  )}
                  <p className="mt-2 font-mono text-[11px] text-zinc-400">{notification.time}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export { NotificationsPage };
