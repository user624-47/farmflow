import React, { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, Sprout, Bell, Check, AlertTriangle, Info, X, 
  Droplet, Thermometer, CloudRain, Calendar, AlertCircle,
  Bug, ShieldAlert, Scissors, PawPrint, HeartPulse, 
  Utensils, Heart, TrendingUp, Wrench
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

type NotificationType = 
  | 'info' | 'warning' | 'success' | 'error' 
  | 'weather' | 'irrigation' | 'fertilization' 
  | 'pest' | 'disease' | 'harvest' | 'planting' 
  | 'livestock' | 'health' | 'feeding' | 'breeding'
  | 'task' | 'alert' | 'market' | 'equipment';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  data?: any;
  action?: () => void;
}

// AI Service for generating farm insights
const AIService = {
  // Weather Analysis
  analyzeWeather: async (location: string) => {
    // In a real app, this would call a weather API
    const alerts = [];
    const forecast = {
      temperature: 34,
      precipitation: 70,
      windSpeed: 25,
      condition: 'thunderstorm',
      nextRain: 12 // hours until next rain
    };

    if (forecast.temperature > 32) {
      alerts.push({
        type: 'weather' as NotificationType,
        title: 'Heat Wave Warning',
        message: `High temperature (${forecast.temperature}°C) expected. Ensure proper irrigation and livestock shade.`,
        severity: 'warning'
      });
    }

    if (forecast.precipitation > 60) {
      alerts.push({
        type: 'weather' as NotificationType,
        title: 'Heavy Rain Forecast',
        message: `${forecast.precipitation}% chance of rain in the next 24 hours. Harvest any ripe crops.`,
        severity: 'info'
      });
    }

    return alerts;
  },

  // Crop Analysis
  analyzeCrops: async (crops: any[]) => {
    const recommendations = [];
    const today = new Date();

    for (const crop of crops) {
      // Check growth stage and suggest actions
      if (crop.growthStage === 'flowering' && crop.daysSinceLastFertilizer > 21) {
        recommendations.push({
          type: 'fertilization' as NotificationType,
          title: 'Fertilization Needed',
          message: `${crop.name} in ${crop.fieldName} is flowering and needs fertilizer.`,
          severity: 'warning',
          data: { cropId: crop.id }
        });
      }

      // Check for harvest time
      const daysToHarvest = Math.ceil((new Date(crop.estimatedHarvestDate).getTime() - today.getTime()) / (1000 * 3600 * 24));
      if (daysToHarvest <= 3) {
        recommendations.push({
          type: 'harvest' as NotificationType,
          title: 'Harvest Time Approaching',
          message: `${crop.name} in ${crop.fieldName} will be ready for harvest in ${daysToHarvest} days.`,
          severity: 'info'
        });
      }

      // Check for common pests based on crop type and season
      if (crop.pestRisk === 'high') {
        recommendations.push({
          type: 'pest' as NotificationType,
          title: 'Pest Alert',
          message: `High risk of ${crop.commonPest} detected in ${crop.name}. Consider preventive measures.`,
          severity: 'warning'
        });
      }
    }

    return recommendations;
  },

  // Livestock Analysis
  analyzeLivestock: async (animals: any[]) => {
    const alerts = [];
    const today = new Date();

    for (const animal of animals) {
      // Health checks
      if (animal.healthStatus === 'poor') {
        alerts.push({
          type: 'health' as NotificationType,
          title: 'Health Alert',
          message: `${animal.name} (${animal.id}) is showing signs of ${animal.healthIssue}.`,
          severity: 'error',
          data: { animalId: animal.id }
        });
      }

      // Breeding schedule
      if (animal.nextBreedingDate) {
        const daysToBreeding = Math.ceil((new Date(animal.nextBreedingDate).getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (daysToBreeding <= 5) {
          alerts.push({
            type: 'breeding' as NotificationType,
            title: 'Breeding Schedule',
            message: `${animal.name} is due for breeding in ${daysToBreeding} days.`,
            severity: 'info'
          });
        }
      }

      // Feeding schedule
      if (animal.lastFed) {
        const hoursSinceLastFeed = (today.getTime() - new Date(animal.lastFed).getTime()) / (1000 * 3600);
        if (hoursSinceLastFeed > 12) {
          alerts.push({
            type: 'feeding' as NotificationType,
            title: 'Feeding Reminder',
            message: `${animal.name} hasn't been fed in ${Math.floor(hoursSinceLastFeed)} hours.`,
            severity: 'warning'
          });
        }
      }
    }

    return alerts;
  },

  // Market and Pricing Insights
  getMarketInsights: async (crops: any[]) => {
    const insights = [];
    
    // In a real app, this would fetch market data
    const marketData = {
      'Maize': { price: 250, trend: 'up', demand: 'high' },
      'Tomato': { price: 120, trend: 'down', demand: 'medium' },
      'Beef': { price: 450, trend: 'up', demand: 'high' }
    };

    for (const crop of crops) {
      const data = marketData[crop.name as keyof typeof marketData];
      if (data) {
        insights.push({
          type: 'market' as NotificationType,
          title: `Market Update: ${crop.name}`,
          message: `Current price: $${data.price}/kg (${data.trend} ${data.trend === 'up' ? '↑' : '↓'}). Demand: ${data.demand}.`,
          severity: 'info'
        });
      }
    }

    return insights;
  }
};

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { loading, user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch farm data and generate notifications
  useEffect(() => {
    if (!user) return;
    
    const fetchFarmData = async () => {
      try {
        setIsLoading(true);
        
        // Mock data - in a real app, this would come from your database/APIs
        const mockFarmData = {
          location: 'Nairobi, Kenya',
          crops: [
            {
              id: 'crop-1',
              name: 'Maize',
              fieldName: 'North Field',
              growthStage: 'flowering',
              daysSinceLastFertilizer: 25,
              estimatedHarvestDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
              commonPest: 'Fall Armyworm',
              pestRisk: 'high'
            },
            {
              id: 'crop-2',
              name: 'Tomato',
              fieldName: 'Greenhouse A',
              growthStage: 'fruiting',
              daysSinceLastFertilizer: 14,
              estimatedHarvestDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
              commonPest: 'Whiteflies',
              pestRisk: 'medium'
            }
          ],
          livestock: [
            {
              id: 'cow-1',
              name: 'Daisy',
              type: 'Dairy Cow',
              healthStatus: 'good',
              lastFed: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10 hours ago
              nextBreedingDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
            },
            {
              id: 'chicken-1',
              name: 'Cluckers',
              type: 'Layer Chickens',
              healthStatus: 'poor',
              healthIssue: 'respiratory infection',
              lastFed: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
            }
          ]
        };

        // Generate AI-powered notifications from different sources
        const [weatherAlerts, cropAlerts, livestockAlerts, marketInsights] = await Promise.all([
          AIService.analyzeWeather(mockFarmData.location),
          AIService.analyzeCrops(mockFarmData.crops),
          AIService.analyzeLivestock(mockFarmData.livestock),
          AIService.getMarketInsights(mockFarmData.crops)
        ]);

        // Combine all notifications
        const allNotifications = [
          ...weatherAlerts,
          ...cropAlerts,
          ...livestockAlerts,
          ...marketInsights
        ];

        // Format notifications with timestamps
        const formattedNotifications: Notification[] = allNotifications.map((alert, index) => ({
          id: `alert-${index}-${Date.now()}`,
          type: alert.type,
          title: alert.title,
          message: alert.message,
          time: 'Recently',
          read: false,
          severity: alert.severity || 'info',
          data: alert.data
        }));

        // Add system status notifications
        formattedNotifications.unshift({
          id: 'sys-1',
          type: 'success',
          title: 'FarmFlow AI Active',
          message: 'Your farm is being monitored 24/7 for optimal performance.',
          time: 'Just now',
          read: false
        });

        setNotifications(formattedNotifications);
      } catch (error) {
        console.error('Error fetching farm data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFarmData();
    
    // Set up real-time updates (in a real app, you'd use WebSockets or Supabase Realtime)
    const interval = setInterval(fetchFarmData, 30 * 60 * 1000); // Refresh every 30 minutes
    
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({
      ...notification,
      read: true
    })));
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      // Weather related
      case 'weather':
        return <CloudRain className="h-4 w-4 text-cyan-500" />;
      
      // Crop related
      case 'irrigation':
        return <Droplet className="h-4 w-4 text-blue-500" />;
      case 'fertilization':
        return <Sprout className="h-4 w-4 text-emerald-500" />;
      case 'pest':
        return <Bug className="h-4 w-4 text-rose-500" />;
      case 'disease':
        return <ShieldAlert className="h-4 w-4 text-amber-500" />;
      case 'harvest':
        return <Scissors className="h-4 w-4 text-orange-500" />;
      case 'planting':
        return <Sprout className="h-4 w-4 text-green-500" />;
      
      // Livestock related
      case 'livestock':
        return <PawPrint className="h-4 w-4 text-amber-700" />;
      case 'health':
        return <HeartPulse className="h-4 w-4 text-red-500" />;
      case 'feeding':
        return <Utensils className="h-4 w-4 text-yellow-500" />;
      case 'breeding':
        return <Heart className="h-4 w-4 text-pink-500" />;
      
      // System and others
      case 'market':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'equipment':
        return <Wrench className="h-4 w-4 text-gray-500" />;
      case 'task':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'alert':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

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
            
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -right-1 -top-1 h-5 w-5 justify-center rounded-full p-0">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 p-0" align="end">
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <h3 className="font-semibold">Notifications</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAllAsRead();
                      }}
                    >
                      Mark all as read
                    </Button>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <DropdownMenuItem 
                          key={notification.id} 
                          className={`px-4 py-3 ${!notification.read ? 'bg-muted/50' : ''}`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-medium">{notification.title}</p>
                                <span className="text-xs text-muted-foreground">{notification.time}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{notification.message}</p>
                            </div>
                            {!notification.read && (
                              <div className="h-2 w-2 rounded-full bg-primary" />
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                  <div className="border-t p-2 text-center">
                    <Button variant="ghost" size="sm" className="text-sm">
                      View all notifications
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <span className="text-base font-medium text-foreground">
                Welcome back{user?.user_metadata?.name ? `, ${user.user_metadata.name.split(' ')[0]}` : '!'}
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