import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  CloudRain, 
  Thermometer, 
  Bug, 
  Shield, 
  Clock, 
  MapPin,
  Bell,
  Zap,
  Wind,
  Droplets,
  TrendingUp
} from "lucide-react";

interface WeatherAlertsProps {
  weatherData: any;
  cropType: string;
  location: string;
}

export const WeatherAlerts = ({ weatherData, cropType, location }: WeatherAlertsProps) => {
  const [alerts, setAlerts] = useState<any>(null);

  useEffect(() => {
    if (weatherData && cropType) {
      // Generate comprehensive alerts based on weather patterns and crop requirements
      const mockAlerts = {
        active: [
          {
            id: 1,
            type: "weather",
            severity: "high",
            title: "Heavy Rainfall Warning",
            description: "150mm+ rainfall expected in next 48 hours. Risk of waterlogging in low-lying fields.",
            timeframe: "Next 2 days",
            actions: ["Improve drainage", "Delay irrigation", "Monitor field conditions"],
            icon: CloudRain,
            color: "red"
          },
          {
            id: 2,
            type: "pest",
            severity: "medium",
            title: "Stem Borer Activity Alert",
            description: "Weather conditions favorable for stem borer reproduction. Peak activity expected.",
            timeframe: "Next 7-10 days",
            actions: ["Scout fields regularly", "Apply preventive measures", "Monitor egg laying sites"],
            icon: Bug,
            color: "orange"
          },
          {
            id: 3,
            type: "disease",
            severity: "medium",
            title: "Blast Disease Risk",
            description: "High humidity (85%+) and temperature (25-30°C) create ideal conditions for blast disease.",
            timeframe: "Ongoing risk",
            actions: ["Apply fungicide", "Improve air circulation", "Monitor leaf symptoms"],
            icon: Shield,
            color: "yellow"
          }
        ],
        upcoming: [
          {
            id: 4,
            type: "weather",
            severity: "low",
            title: "Temperature Drop",
            description: "Night temperatures may drop to 18°C next week, affecting growth rate.",
            timeframe: "Next week",
            actions: ["Monitor crop response", "Adjust feeding schedule"],
            icon: Thermometer,
            color: "blue"
          },
          {
            id: 5,
            type: "seasonal",
            severity: "medium",
            title: "Dry Spell Forecast",
            description: "Extended dry period predicted for next month. Plan water management.",
            timeframe: "In 2-3 weeks",
            actions: ["Check irrigation systems", "Plan water conservation", "Monitor soil moisture"],
            icon: Droplets,
            color: "orange"
          }
        ],
        riskFactors: [
          { name: "Flood Risk", level: 75, trend: "increasing", color: "#ef4444" },
          { name: "Drought Stress", level: 25, trend: "stable", color: "#f59e0b" },
          { name: "Heat Stress", level: 35, trend: "decreasing", color: "#f97316" },
          { name: "Disease Pressure", level: 60, trend: "increasing", color: "#8b5cf6" },
          { name: "Pest Activity", level: 45, trend: "stable", color: "#06b6d4" }
        ],
        preventiveActions: [
          {
            action: "Install drainage systems",
            priority: "high",
            timeframe: "Immediate",
            impact: "Prevents waterlogging damage"
          },
          {
            action: "Apply protective fungicide spray",
            priority: "medium",
            timeframe: "Within 3 days",
            impact: "Reduces disease infection risk by 70%"
          },
          {
            action: "Set up pest monitoring traps",
            priority: "medium",
            timeframe: "This week",
            impact: "Early detection of pest outbreaks"
          },
          {
            action: "Prepare emergency irrigation",
            priority: "low",
            timeframe: "Next 2 weeks",
            impact: "Backup water supply during dry spells"
          }
        ]
      };

      setAlerts(mockAlerts);
    }
  }, [weatherData, cropType, location]);

  if (!alerts) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Weather Alerts & Risks</h3>
            <p className="text-muted-foreground">Configure weather data and crop type to view alerts</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-orange-200 bg-orange-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (level: number) => {
    if (level > 60) return '#ef4444';
    if (level > 40) return '#f59e0b';
    return '#22c55e';
  };

  return (
    <div className="space-y-6">
      {/* Active Alerts */}
      <Card className="border-2 border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-red-500" />
            Active Alerts ({alerts.active.length})
          </CardTitle>
          <CardDescription>Immediate attention required for your crops</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.active.map((alert: any) => (
              <Alert key={alert.id} className={getSeverityColor(alert.severity)}>
                <div className="flex items-start gap-4">
                  <alert.icon className="h-5 w-5 mt-0.5" style={{ color: alert.color === 'red' ? '#ef4444' : alert.color === 'orange' ? '#f59e0b' : alert.color === 'yellow' ? '#eab308' : '#3b82f6' }} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <AlertTitle className="text-base">{alert.title}</AlertTitle>
                      <Badge className={getSeverityBadge(alert.severity)}>
                        {alert.severity} priority
                      </Badge>
                    </div>
                    <AlertDescription className="mb-3">
                      {alert.description}
                    </AlertDescription>
                    <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {alert.timeframe}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {location}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Recommended Actions:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {alert.actions.map((action: string, index: number) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-current rounded-full" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Risks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Upcoming Risks ({alerts.upcoming.length})
          </CardTitle>
          <CardDescription>Potential issues to monitor in the coming weeks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {alerts.upcoming.map((risk: any) => (
              <div key={risk.id} className={`p-4 border rounded-lg ${getSeverityColor(risk.severity)}`}>
                <div className="flex items-start gap-4">
                  <risk.icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{risk.title}</h4>
                      <Badge variant="outline" className={getSeverityBadge(risk.severity)}>
                        {risk.timeframe}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{risk.description}</p>
                    <div className="text-sm">
                      <span className="font-medium">Actions: </span>
                      <span className="text-muted-foreground">{risk.actions.join(', ')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Factor Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-500" />
            Risk Factor Dashboard
          </CardTitle>
          <CardDescription>Current threat levels for various risk factors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {alerts.riskFactors.map((factor: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">{factor.name}</span>
                  <Badge 
                    variant="outline" 
                    style={{ 
                      backgroundColor: `${factor.color}20`, 
                      color: factor.color, 
                      borderColor: `${factor.color}40` 
                    }}
                  >
                    {factor.level}%
                  </Badge>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Risk Level</span>
                    <span className="capitalize text-muted-foreground">
                      {factor.trend}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${factor.level}%`,
                        backgroundColor: getRiskColor(factor.level)
                      }} 
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {factor.trend === 'increasing' && <TrendingUp className="h-3 w-3" />}
                  {factor.trend === 'decreasing' && <TrendingUp className="h-3 w-3 rotate-180" />}
                  {factor.trend === 'stable' && <div className="w-3 h-0.5 bg-current" />}
                  <span className="capitalize">{factor.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preventive Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            Preventive Action Plan
          </CardTitle>
          <CardDescription>Recommended actions to mitigate identified risks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.preventiveActions.map((action: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant={action.priority === 'high' ? 'destructive' : action.priority === 'medium' ? 'secondary' : 'outline'}>
                      {action.priority}
                    </Badge>
                    <span className="font-medium">{action.action}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">
                    <strong>Timeframe:</strong> {action.timeframe}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <strong>Expected Impact:</strong> {action.impact}
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Plan Action
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};