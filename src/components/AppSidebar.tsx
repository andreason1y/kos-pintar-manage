import { DoorOpen, Users, Wallet, UserCircle, Home } from "lucide-react";
import logoIcon from "@/assets/logo-icon.png";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useDemo } from "@/lib/demo-context";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getAvatarColor } from "@/lib/avatar-colors";

const items = [
  { title: "Beranda", url: "/beranda", icon: Home },
  { title: "Kamar", url: "/kamar", icon: DoorOpen },
  { title: "Penyewa", url: "/penyewa", icon: Users },
  { title: "Keuangan", url: "/keuangan", icon: Wallet },
  { title: "Profil", url: "/profil", icon: UserCircle },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDemo } = useDemo();

  const displayName = isDemo ? "Demo User" : (user?.email?.split("@")[0] ?? "User");
  const initials = displayName.slice(0, 2).toUpperCase();
  const avatarColor = getAvatarColor(displayName);

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <Home className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-extrabold text-lg text-foreground group-data-[collapsible=icon]:hidden">
            KosPintar
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={active}
                      onClick={() => navigate(item.url)}
                      tooltip={item.title}
                      className={active ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground"}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-8 w-8 shrink-0" style={{ backgroundColor: avatarColor.bg }}>
            <AvatarFallback className="text-xs font-bold" style={{ backgroundColor: avatarColor.bg, color: avatarColor.fg }}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-foreground truncate group-data-[collapsible=icon]:hidden">
            {displayName}
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
