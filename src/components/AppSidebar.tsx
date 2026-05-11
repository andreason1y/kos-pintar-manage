import { DoorOpen, Users, Wallet, UserCircle, Home } from "lucide-react";
import logoIcon from "@/assets/logo-icon.png";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useProfile } from "@/hooks/use-queries";
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
  const { data: profileData } = useProfile(user?.id);

  const displayName = isDemo ? "Demo User" : (profileData?.nama || user?.user_metadata?.nama || user?.email?.split("@")[0] || "User");
  const initials = displayName.slice(0, 2).toUpperCase();
  const avatarColor = getAvatarColor(displayName);

  return (
    <Sidebar collapsible="icon" className="border-r border-border/60">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2.5">
          <img src={logoIcon} alt="KosPintar" className="w-7 h-7 rounded-md object-contain shrink-0" />
          <span className="font-bold text-sm text-foreground tracking-tight group-data-[collapsible=icon]:hidden">
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
                      className={active ? "bg-foreground text-background font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-7 w-7 shrink-0" style={{ backgroundColor: avatarColor.bg }}>
            <AvatarFallback className="text-[10px] font-semibold" style={{ backgroundColor: avatarColor.bg, color: avatarColor.fg }}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium text-foreground truncate group-data-[collapsible=icon]:hidden">
            {displayName}
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
