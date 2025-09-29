import {
  BarChart3, 
  Users, 
  Package, 
  CreditCard, 
  Wheat, 
  PawPrint, 
  MessageSquare,
  CloudRain,
  Droplets,
  Settings,
  LogOut,
  BookOpen
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: BarChart3,
    roles: ["admin", "extension_officer", "farmer"]
  },
  {
    title: "Farmers",
    url: "/farmers",
    icon: Users,
    roles: ["admin", "extension_officer"]
  },
  {
    title: "Inputs",
    url: "/inputs",
    icon: Package,
    roles: ["admin", "extension_officer"]
  },
  {
    title: "Loans",
    url: "/loans",
    icon: CreditCard,
    roles: ["admin", "extension_officer"]
  },
  {
    title: "Crops",
    url: "/crops",
    icon: Wheat,
    roles: ["admin", "extension_officer", "farmer"]
  },
  {
    title: "Livestock",
    url: "/livestock",
    icon: PawPrint,
    roles: ["admin", "extension_officer", "farmer"]
  },
  {
    title: "AI Assistant",
    url: "/assistant",
    icon: MessageSquare,
    roles: ["admin", "extension_officer", "farmer"]
  },
  {
    title: "Weather Insights",
    url: "/weather-insights",
    icon: CloudRain,
    roles: ["admin", "extension_officer", "farmer"]
  },
  {
    title: "Applications",
    url: "/applications",
    icon: Droplets,
    roles: ["admin", "extension_officer"]
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { userRole, signOut } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground";

  // Filter navigation items based on user role
  const filteredItems = navigationItems.filter(item => 
    !userRole || item.roles.includes(userRole)
  );

  const handleSignOut = async () => {
    try {
      await signOut();
      // Use window.location.href to force a full page reload and clear any state
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error during sign out:', error);
      // Even if there's an error, still try to redirect to auth page
      window.location.href = '/auth';
    }
  };

  return (
    <Sidebar className={state === "collapsed" ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"} 
                      className={({ isActive }) => getNavCls({ isActive })}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {userRole === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/settings" 
                      className={({ isActive }) => getNavCls({ isActive })}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      {state !== "collapsed" && <span>Settings</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink 
                to="/knowledge" 
                className={({ isActive }) => getNavCls({ isActive })}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                {state !== "collapsed" && <span>Knowledge Center</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              {state !== "collapsed" && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}