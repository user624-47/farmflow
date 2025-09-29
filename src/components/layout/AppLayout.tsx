import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Sprout } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-14 flex items-center justify-between border-b bg-background px-4">
            <div className="flex items-center space-x-6">
              <SidebarTrigger className="h-8 w-8" />
              <div className="flex items-center space-x-3">
                <div className="bg-primary text-primary-foreground rounded-lg p-2">
                  <Sprout className="h-6 w-6" />
                </div>
                <h1 className="text-xl font-bold">FarmFlow</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <span className="text-base font-medium text-foreground">
                Welcome back!
              </span>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}