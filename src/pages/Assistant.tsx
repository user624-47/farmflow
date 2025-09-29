import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Send, Bot, User, Lightbulb, TrendingUp, CloudRain, Bug, Wheat, BarChart3, Loader2, Brain, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    weather?: any;
    analysisType?: string;
  };
}

const Assistant = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI farming assistant powered by advanced crop analytics and weather data. I can help you with:\n\n🌾 **Yield Predictions** - Get accurate harvest forecasts\n🌤️ **Weather Impact Analysis** - Understand how weather affects your crops\n🐛 **Disease Risk Assessment** - Early warning for crop threats\n📊 **Data-Driven Insights** - Personalized farming recommendations\n\nWhat would you like to analyze today?",
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisType, setAnalysisType] = useState("yield_prediction");
  const [farmLocation, setFarmLocation] = useState("");
  const [cropType, setCropType] = useState("");

  const analysisTypes = [
    { id: "yield_prediction", name: "Yield Prediction", icon: Target, description: "Forecast crop yields based on current conditions" },
    { id: "weather_impact", name: "Weather Analysis", icon: CloudRain, description: "Analyze weather effects on crop performance" },
    { id: "disease_risk", name: "Disease Risk", icon: Bug, description: "Assess disease and pest risk factors" }
  ];

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage: Message = {
      role: "user" as const,
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      // Call our AI crop analysis edge function
      const { data, error } = await supabase.functions.invoke('ai-crop-analysis', {
        body: {
          farmLocation: farmLocation || "Lagos, Nigeria",
          cropType: cropType || "Rice",
          analysisType: analysisType,
          userQuery: message
        }
      });

      if (error) {
        throw error;
      }

      const aiResponse: Message = {
        role: "assistant" as const,
        content: data.analysis,
        timestamp: new Date(),
        metadata: {
          weather: data.weather,
          analysisType: data.cropData?.analysisType
        }
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error calling AI assistant:', error);
      
      const errorResponse: Message = {
        role: "assistant" as const,
        content: "I apologize, but I'm having trouble accessing the AI analysis system right now. Please make sure you have:\n\n1. Added your OpenWeather API key in the project settings\n2. Added your OpenAI API key in the project settings\n3. A stable internet connection\n\nIn the meantime, I can provide general farming advice based on your question. Please try again or contact support if the issue persists.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorResponse]);
      
      toast({
        title: "Analysis Error",
        description: "Unable to connect to AI analysis service. Please check your API keys.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAnalysis = async (type: string) => {
    if (!farmLocation || !cropType) {
      toast({
        title: "Missing Information",
        description: "Please specify your farm location and crop type first.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    const quickMessage: Message = {
      role: "user" as const,
      content: `Please provide a ${type.replace('_', ' ')} analysis for ${cropType} in ${farmLocation}`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, quickMessage]);

    try {
      const { data, error } = await supabase.functions.invoke('ai-crop-analysis', {
        body: {
          farmLocation,
          cropType,
          analysisType: type
        }
      });

      if (error) {
        throw error;
      }

      const aiResponse: Message = {
        role: "assistant" as const,
        content: data.analysis,
        timestamp: new Date(),
        metadata: {
          weather: data.weather,
          analysisType: type
        }
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error in quick analysis:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to perform analysis. Please check your API configuration.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
            AI Assistant
          </h1>
          <p className="text-lg text-muted-foreground">
            Advanced crop analytics powered by AI and real-time weather data
          </p>
        </div>
        <Badge variant="secondary" className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border-green-500/30">
          <Brain className="w-3 h-3 mr-1" />
          AI Powered
        </Badge>
      </div>

      {/* Configuration Panel */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-primary" />
            <span>Analysis Configuration</span>
          </CardTitle>
          <CardDescription>
            Set your location and crop details for personalized AI insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Farm Location</label>
              <Input
                value={farmLocation}
                onChange={(e) => setFarmLocation(e.target.value)}
                placeholder="e.g., Lagos, Nigeria"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Crop Type</label>
              <Input
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                placeholder="e.g., Rice, Maize, Cassava"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Analysis Type</label>
              <Select value={analysisType} onValueChange={setAnalysisType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {analysisTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center space-x-2">
                        <type.icon className="h-4 w-4" />
                        <span>{type.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Enhanced Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <span>Quick Analysis</span>
            </CardTitle>
            <CardDescription>
              One-click intelligent insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysisTypes.map((type) => (
              <Button
                key={type.id}
                variant="outline"
                className="w-full justify-start h-auto p-3 hover:bg-accent/50 hover:border-primary/30"
                onClick={() => handleQuickAnalysis(type.id)}
                disabled={isLoading}
              >
                <div className="flex items-start space-x-3">
                  <type.icon className="h-5 w-5 text-primary mt-0.5" />
                  <div className="text-left">
                    <p className="font-medium text-sm">{type.name}</p>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Enhanced Chat Interface */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <span>AI Chat Assistant</span>
            </CardTitle>
            <CardDescription>
              Ask detailed questions about farming, weather, and crop management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col h-[500px]">
              {/* Enhanced Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl p-4 shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground'
                          : 'bg-gradient-to-r from-accent to-accent/80 border border-border/50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {msg.role === 'assistant' ? (
                          <div className="bg-primary/10 p-1.5 rounded-full">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        ) : (
                          <div className="bg-white/20 p-1.5 rounded-full">
                            <User className="h-4 w-4" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="prose prose-sm max-w-none">
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          </div>
                          {msg.metadata?.weather && (
                            <div className="mt-2 p-2 bg-white/10 rounded-lg">
                              <p className="text-xs opacity-80">
                                Weather data included for {msg.metadata.weather.current?.name}
                              </p>
                            </div>
                          )}
                          <p className="text-xs opacity-70 mt-2 flex items-center space-x-1">
                            <span>{msg.timestamp.toLocaleTimeString()}</span>
                            {msg.metadata?.analysisType && (
                              <>
                                <span>•</span>
                                <span className="capitalize">{msg.metadata.analysisType.replace('_', ' ')}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gradient-to-r from-accent to-accent/80 border border-border/50 rounded-xl p-4 max-w-[85%]">
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary/10 p-1.5 rounded-full">
                          <Loader2 className="h-4 w-4 text-primary animate-spin" />
                        </div>
                        <div>
                          <p className="text-sm">Analyzing crop data and weather patterns...</p>
                          <p className="text-xs text-muted-foreground">This may take a few moments</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Input */}
              <div className="border-t pt-4">
                <div className="flex space-x-3">
                  <div className="flex-1">
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Ask me anything about crop yields, weather impact, disease risks, or farming best practices..."
                      className="resize-none min-h-[60px] border-primary/20 focus:border-primary/40"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-muted-foreground">
                        Press Enter to send, Shift+Enter for new line
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {message.length}/1000
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !message.trim()}
                    className="h-auto px-4 py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Assistant;