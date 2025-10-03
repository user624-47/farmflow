import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen,
  Lightbulb,
  Shield,
  BarChart2,
  Droplet,
  Thermometer,
  Wind,
  Sun,
  Cloud,
  BookMarked,
  MessageSquare,
  LayoutDashboard,
  Crop,
  Bug,
  Sprout,
  CloudSun,
  ShieldCheck,
  ChevronDown,
  Search,
  Droplets
} from "lucide-react";
import { Link } from "react-router-dom";

// Types
interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  categoryId: string;
  tags: string[];
  lastUpdated: string;
  author: string;
  relatedArticles?: string[];
}

interface Category {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  color: string;
  articles: Article[];
};

export const KnowledgeCenter = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  // Knowledge base categories and articles
  const categories: Category[] = [
    {
      id: "getting-started",
      title: "Getting Started",
      description: "Master the basics of FarmFlow and set up your farm for success.",
      icon: <BookOpen className="h-5 w-5" />,
      color: "text-blue-500",
      articles: [
        {
          id: "gs-1",
          title: "Welcome to FarmFlow",
          summary: "Introduction to FarmFlow and getting started guide",
          categoryId: "getting-started",
          content: `# Welcome to FarmFlow
          
          FarmFlow is an intelligent agricultural management platform designed to help farmers optimize their operations through data-driven insights and smart tools. This guide will help you get started on your journey to smarter farming.
          
          ## 🚀 Getting Started Guide
          
          ### 1. Complete Your Farm Profile
          1. Navigate to Settings > Farm Profile
  2. Add your farm's details:
     - Location
     - Size
     - Soil type
  3. Configure preferences:
     - Units of measurement
     - Date format
     - Language

  ### 2. Add Your Fields
  1. Go to Fields section
  2. Click "Add Field"
  3. Outline field boundaries on the map
  4. Provide field details:
     - Name
     - Area
     - Crop type
     - Planting date

  ### 3. Set Up Monitoring
  1. Weather Monitoring:
     - Connect weather stations
     - Set up alerts for extreme conditions
  2. Soil Sensors:
     - Install moisture sensors
     - Configure data collection frequency
  3. Automated Alerts:
     - Set thresholds for critical conditions
     - Configure notification channels

  ### 4. Explore Key Features
  1. **Dashboard**
     - Farm overview
     - Weather conditions
     - Task reminders
  2. **Crop Planner**
     - Planting schedule
     - Growth tracking
     - Harvest planning
  3. **Weather Insights**
     - Forecasts
     - Historical data
     - Weather alerts
  4. **Analytics**
     - Yield predictions
     - Resource usage
     - Performance metrics
          
          ## 📱 Mobile Access
          Access FarmFlow on the go with our mobile app, available for both iOS and Android devices. Get real-time alerts and manage your farm from anywhere.
          
          ## 📞 Need Help?
          Our support team is available 24/7 to assist you with any questions or issues.
          `,
          tags: ["introduction", "setup", "guide", "tutorial"],
          lastUpdated: "2025-09-29",
          author: "FarmFlow Team"
        },
        {
          id: "gs-2",
          title: "Navigating the Dashboard",
          summary: "Learn how to navigate and customize your FarmFlow dashboard",
          categoryId: "getting-started",
          content: `# Navigating the FarmFlow Dashboard
          
          The FarmFlow dashboard is your command center for managing all aspects of your farm. This guide will help you understand and customize your dashboard.
          
          ## 🖥️ Dashboard Overview
          
          ### 1. Quick Stats Panel
          1. **Weather Summary**
             - Current temperature
             - Humidity
             - Wind speed
          2. **Tasks Overview**
             - Pending tasks
             - Overdue items
             - Completed today
          3. **Recent Activities**
             - Latest field operations
             - System notifications
             - Weather alerts

          ### 2. Field Status
          1. **Field Grid View**
             - Visual map of all fields
             - Color-coded status indicators
          2. **Field Details**
             - Click any field for details
             - View crop information
             - Access field history
          3. **Quick Actions**
             - Add new field
             - Edit existing field
             - Generate reports

          ### 3. Weather Forecast
          1. **7-Day Forecast**
             - Daily high/low temperatures
             - Precipitation chance
             - Wind conditions
          2. **Weather Alerts**
             - Severe weather warnings
             - Frost alerts
             - Heat advisories
          3. **Historical Data**
             - Past weather patterns
             - Growing degree days
             - Rainfall accumulation

          ### 4. Task Manager
          1. **Upcoming Tasks**
             - Sorted by due date
             - Priority indicators
             - Assignment details
          2. **Task Details**
             - Description
             - Due date/time
             - Assigned personnel
          3. **Task Actions**
             - Mark as complete
             - Reschedule
             - Delegate
          
          ## 🛠️ Customization Options
          
          ### Add/Remove Widgets
          1. Click the gear icon in the top-right corner
          2. Select "Customize Dashboard"
          3. Drag and drop widgets to rearrange
          4. Toggle widgets on/off as needed
          
          ### Set Up Alerts
          1. Go to Settings > Notifications
          2. Choose alert types (weather, tasks, etc.)
          3. Set your preferred notification method
          
          ## 💡 Pro Tips
          - Pin your most important fields for quick access
          - Use the search function to quickly find specific data
          - Export reports directly from the dashboard
          `,
          tags: ["dashboard", "navigation", "tutorial", "ui"],
          lastUpdated: "2025-09-28",
          author: "FarmFlow Support"
        },
        // More getting started articles...
      ]
    },
    {
      id: "crop-management",
      title: "Crop Management",
      description: "Expert guidance on crop planning, monitoring, and optimization techniques.",
      icon: <Sprout className="h-5 w-5" />,
      color: "text-green-500",
      articles: [
        {
          id: "cm-1",
          title: "Comprehensive Crop Rotation Guide",
          summary: "Learn the principles and benefits of crop rotation for sustainable farming",
          categoryId: "crop-management",
          content: `# Comprehensive Crop Rotation Guide
          
          Crop rotation is a fundamental practice for maintaining soil health and maximizing yields. This guide provides a detailed approach to implementing an effective crop rotation system.
          
          ## 🌱 Benefits of Crop Rotation
          
          ### 1. Soil Health Improvements
          1. **Nutrient Management**
             - Prevents depletion of specific nutrients
             - Balances soil fertility
             - Reduces need for chemical fertilizers
          2. **Soil Structure**
             - Enhances water retention
             - Improves aeration
             - Reduces compaction
          3. **Biological Benefits**
             - Increases microbial diversity
             - Encourages beneficial organisms
             - Improves organic matter content

          ### 2. Pest & Disease Management
          1. **Pest Control**
             - Breaks pest life cycles
             - Reduces pest pressure
             - Minimizes pesticide use
          2. **Disease Prevention**
             - Reduces soil-borne diseases
             - Limits pathogen buildup
             - Improves overall plant health

          ## 🔄 5-Year Rotation Plan
          
          ### Year 1: Legumes
          1. **Recommended Crops**
             - Beans
             - Peas
             - Lentils
             - Clover
          2. **Key Benefits**
             - Fixes atmospheric nitrogen
             - Improves soil fertility
             - Reduces need for synthetic nitrogen
          - **Follow with**: Leafy greens or brassicas
          
          ### Year 2: Leafy Greens
          - **Crops**: Lettuce, spinach, kale
          - **Benefits**: Heavy nitrogen users
          - **Follow with**: Fruiting vegetables
          
          ### Year 3: Fruiting Vegetables
          - **Crops**: Tomatoes, peppers, eggplants
          - **Benefits**: Moderate feeders
          - **Follow with**: Root crops
          
          ### Year 4: Root Crops
          - **Crops**: Carrots, potatoes, onions
          - **Benefits**: Break up soil compaction
          - **Follow with**: Cover crops
          
          ### Year 5: Cover Crops
          - **Options**: Clover, vetch, rye
          - **Benefits**: Soil enrichment and protection
          
          ## 📊 Implementation Tips
          
          ### Field Mapping
          1. Create a field map in FarmFlow
          2. Document current crops and conditions
          3. Plan rotations for each field
          
          ### Record Keeping
          - Track planting and harvest dates
          - Note pest and disease issues
          - Record yields and soil tests
          
          ## 🌦️ Seasonal Considerations
          
          ### Spring
          - Prepare soil based on previous crops
          - Start with cool-season legumes
          
          ### Summer
          - Monitor for pest pressure
          - Implement intercropping where possible
          
          ### Fall
          - Plant cover crops after harvest
          - Test soil for next year's planning
          `,
          tags: ["crop rotation", "soil health", "sustainability", "planning"],
          lastUpdated: "2025-09-25",
          author: "Dr. Sarah Agronomist"
        },
        {
          id: "cm-2",
          title: "Pest and Disease Management",
          summary: "Identifying and managing common pests and diseases",
          categoryId: "crop-management",
          content: `# Integrated Pest Management (IPM) Guide
          
          Learn how to implement an effective IPM strategy to protect your crops while minimizing environmental impact.
          
          ## 🐛 Common Pests and Solutions
          
          ### Aphids
          - **Identification**: Small, soft-bodied insects on new growth
          - **Organic Control**: Ladybugs, neem oil, insecticidal soap
          - **Cultural Control**: Remove affected leaves, encourage natural predators
          
          ### Tomato Hornworm
          - **Identification**: Large green caterpillars with white stripes
          - **Organic Control**: Hand picking, Bt (Bacillus thuringiensis)
          - **Prevention**: Crop rotation, floating row covers
          
          ## 🍄 Disease Prevention
          
          ### Common Diseases
          - **Powdery Mildew**: White powdery spots on leaves
          - **Blight**: Brown spots on leaves and stems
          - **Root Rot**: Wilting plants with dark, mushy roots
          
          ### Prevention Strategies
          - Proper plant spacing for air circulation
          - Water at the base of plants
          - Use disease-resistant varieties
          - Sanitize tools between uses
          
          ## 📱 Using FarmFlow for IPM
          
          ### Pest Monitoring
          1. Log pest sightings in the app
          2. Set up scouting schedules
          3. Track pest populations over time
          
          ### Treatment Records
          - Document all treatments applied
          - Note effectiveness of different methods
          - Set reminders for follow-up applications
          `,
          tags: ["pest control", "disease management", "IPM", "organic farming"],
          lastUpdated: "2025-09-22",
          author: "FarmFlow Agronomy Team"
        },
        // More crop management articles...
      ]
    },
    {
      id: "weather-insights",
      title: "Weather & Climate",
      description: "Leverage weather data and climate trends for better farm decision-making.",
      icon: <CloudSun className="h-5 w-5" />,
      color: "text-yellow-500",
      articles: [
        {
          id: "wi-1",
          title: "Mastering Weather Data for Farming",
          summary: "Learn how to effectively use weather data to improve your farming decisions",
          categoryId: "weather-insights",
          content: `# Mastering Weather Data for Farming
          
          Weather is the most unpredictable yet critical factor in farming. This comprehensive guide will help you understand and utilize weather data effectively.
          
          ## 🌡️ Key Weather Metrics and Their Impact
          
          ### Temperature
          - **Optimal Ranges**: Know the ideal temperatures for your crops
          - **Growing Degree Days (GDD)**: Track heat accumulation for crop development
          - **Frost Alerts**: Protect sensitive plants from cold damage
          
          ### Precipitation
          - **Rainfall Measurement**: Track amounts and distribution
          - **Drought Indicators**: Recognize early warning signs
          - **Irrigation Planning**: Optimize water usage based on forecasts
          
          ### Wind and Humidity
          - **Wind Speed**: Impact on pollination and soil erosion
          - **Humidity Levels**: Disease risk assessment
          - **Evapotranspiration**: Calculate crop water requirements
          
          ## 🌦️ Using FarmFlow's Weather Tools
          
          ### Real-time Monitoring
          - View current conditions for your location
          - Set up custom weather alerts
          - Access hyper-local forecasts
          
          ### Historical Data
          - Analyze past weather patterns
          - Compare with current conditions
          - Identify long-term trends
          
          ## 📱 Weather Integration
          
          ### Mobile Alerts
          - Push notifications for severe weather
          - Frost and heat warnings
          - Ideal planting/harvesting windows
          
          ### API Connections
          - Connect your personal weather station
          - Integrate with local weather services
          - Access specialized agricultural forecasts
          
          ## 📊 Weather-Based Decision Making
          
          ### Planting Schedule
          - Soil temperature monitoring
          - Precipitation probability
          - Frost-free date calculations
          
          ### Pest and Disease Forecasting
          - Disease risk models
          - Pest emergence predictions
          - Spray timing optimization
          
          ## 🌍 Climate Change Considerations
          - Shifting growing zones
          - Changing precipitation patterns
          - Long-term adaptation strategies
          `,
          tags: ["weather data", "forecasting", "climate", "decision making"],
          lastUpdated: "2025-09-27",
          author: "FarmFlow Meteorology Team"
        },
        {
          id: "wi-2",
          title: "Drought Management Strategies",
          summary: "Essential strategies for managing your farm during drought conditions",
          categoryId: "weather-insights",
          content: `# Drought Management for Sustainable Farming
          
          Learn how to prepare for and manage drought conditions to protect your crops and soil health.
          
          ## 💧 Water Conservation Techniques
          
          ### Soil Moisture Management
          - Implement mulching to reduce evaporation
          - Use cover crops to improve water retention
          - Practice reduced tillage to maintain soil structure
          
          ### Efficient Irrigation
          - Drip irrigation systems
          - Soil moisture sensors
          - Smart scheduling based on ET rates
          
          ## 🌱 Drought-Resistant Crops
          
          ### Best Varieties
          - Sorghum
          - Millet
          - Cowpeas
          - Certain varieties of corn and wheat
          
          ## 📊 Monitoring and Planning
          
          ### Early Warning Signs
          - Monitor drought indices
          - Track soil moisture levels
          - Watch for plant stress indicators
          
          ### Contingency Planning
          - Develop a water budget
          - Identify alternative water sources
          - Plan for reduced yields
          `,
          tags: ["drought", "water management", "sustainability", "conservation"],
          lastUpdated: "2025-09-20",
          author: "Water Resources Team"
        },
        // More weather insight articles...
      ]
    },
    {
      id: "yield-prediction",
      title: "Yield Prediction",
      description: "AI-powered yield predictions and how to use them for better planning.",
      icon: <BarChart2 className="h-5 w-5" />,
      color: "text-purple-500",
      articles: [
        {
          id: "yp-1",
          title: "Understanding Yield Predictions",
          summary: "Learn how FarmFlow's AI models predict crop yields",
          categoryId: "yield-prediction",
          content: `# Understanding Yield Predictions
          
          Our AI models analyze multiple factors to provide accurate yield predictions for your crops.
          
          ## How It Works
          - Historical yield data analysis
          - Weather pattern correlation
          - Soil quality assessment
          - Crop health monitoring
          
          ## Using Predictions
          - Plan harvest logistics
          - Optimize resource allocation
          - Improve financial forecasting
          - Make data-driven decisions
          `,
          tags: ["AI", "predictions", "planning"],
          lastUpdated: "2025-09-05",
          author: "Data Science Team"
        },
        // More yield prediction articles...
      ]
    },
    {
      id: "risk-assessment",
      title: "Risk Assessment",
      description: "Identify and mitigate potential risks to your farming operations.",
      icon: <ShieldCheck className="h-5 w-5" />,
      color: "text-red-500",
      articles: [
        {
          id: "ra-1",
          title: "Common Agricultural Risks",
          categoryId: "risk-assessment",
          content: `# Common Agricultural Risks
          
          Understanding and managing risks is crucial for sustainable farming.
          
          ## Types of Risks
          - **Weather-related**: Droughts, floods, storms
          - **Biological**: Pests, diseases, weeds
          - **Market**: Price fluctuations, demand changes
          - **Financial**: Cash flow issues, input costs
          
          ## Risk Management Strategies
          - Diversification of crops
          - Insurance options
          - Contingency planning
          - Regular monitoring
          `,
          summary: "Learn how to identify and mitigate potential risks to your farming operations.",
          tags: ["yield", "prediction", "AI", "data analysis", "sustainability"],
          lastUpdated: "2025-08-30",
          author: "Risk Management Team"
        },
        // More risk assessment articles...
      ]
    },
    {
      id: "best-practices",
      title: "Best Practices",
      description: "Expert-recommended farming practices for optimal results.",
      icon: <Lightbulb className="h-5 w-5" />,
      color: "text-amber-500",
      articles: [
        {
          id: "bp-1",
          title: "Sustainable Farming Techniques",
          summary: "Best practices for sustainable and environmentally friendly farming",
          categoryId: "best-practices",
          content: `# Sustainable Farming Techniques
          
          Adopting sustainable practices ensures long-term productivity and environmental health.
          
          ## Key Practices
          - **Conservation Tillage**: Reduce soil erosion
          - **Cover Cropping**: Improve soil health
          - **Integrated Pest Management**: Reduce chemical use
          - **Water Conservation**: Efficient irrigation methods
          
          ## Benefits
          - Improved soil fertility
          - Reduced environmental impact
          - Lower input costs
          - Long-term sustainability
          `,
          tags: ["sustainability", "techniques", "environment"],
          lastUpdated: "2025-08-25",
          author: "Sustainability Team"
        },
        // More best practice articles...
      ]
    }
  ];

  // Flatten all articles for search
  const allArticles = categories.flatMap(category => 
    category.articles.map(article => ({
      ...article,
      categoryId: category.id,
      categoryTitle: category.title,
      categoryColor: category.color
    }))
  );

  // Filter articles based on search query
  const filteredArticles = allArticles.filter(article => 
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get articles for the active tab
  const getActiveArticles = () => {
    if (activeTab === "all") return filteredArticles;
    const category = categories.find(cat => cat.id === activeTab);
    return category ? 
      category.articles.filter(article => 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      ) : [];
  };

  // Set active tab from URL
  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path && path !== 'knowledge') {
      setActiveTab(path);
    }
  }, [location]);

    // Toggle article expansion
  const toggleArticle = (articleId: string) => {
    setExpandedArticle(expandedArticle === articleId ? null : articleId);
  };

  // ArticleCard component
  const ArticleCard = ({ article, isExpanded, onToggleExpand }: { 
    article: Article; 
    isExpanded: boolean; 
    onToggleExpand: () => void 
  }) => (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader 
        className="cursor-pointer" 
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{article.title}</h3>
          <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`} />
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {article.summary}
        </p>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <Separator className="mb-4" />
          <div className="prose max-w-none">
            {article.content.split('\n\n').map((paragraph, i) => (
              <p key={i} className="mb-4 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span 
                key={tag} 
                className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Last updated: {article.lastUpdated} • By {article.author}
          </div>
        </CardContent>
      )}
    </Card>
  );

  // Filter articles based on search query
  const filteredCategories = categories.map(category => ({
    ...category,
    articles: category.articles.filter(article => 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">FarmFlow Knowledge Center</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Your comprehensive guide to mastering FarmFlow and optimizing your farming operations.
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search knowledge base..."
          className="pl-10 py-6 text-base"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Main Content */}
      <Tabs 
        defaultValue="all"
        className="w-full mb-8"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        {/* Tab Navigation */}
        <div className="w-full pb-2 overflow-x-auto">
          <TabsList className="grid w-full grid-cols-7 h-auto p-1 bg-muted/50">
            <TabsTrigger 
              value="all" 
              className="flex flex-col items-center justify-center gap-1 py-3"
            >
              <BookMarked className="h-5 w-5" />
              <span>All</span>
            </TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger 
                key={category.id} 
                value={category.id}
                className="flex flex-col items-center justify-center gap-1 py-3"
              >
                <span className={category.color}>{category.icon}</span>
                <span>{category.title}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* All Articles View */}
        <TabsContent value="all" className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">📚 Knowledge Base</h2>
            <p className="text-muted-foreground">
              Comprehensive guides and resources for modern farming practices.
            </p>
          </div>
          
          {categories.map((category, index) => (
            <section key={category.id} className="space-y-4">
              <h3 className="text-xl font-semibold">{index + 1}. {category.title}</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredCategories
                .find(c => c.id === category.id)?.articles
                .map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    isExpanded={expandedArticle === article.id}
                    onToggleExpand={() => toggleArticle(article.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </TabsContent>

        {/* Category-specific Views */}
        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">{category.title}</h2>
              <p className="text-muted-foreground">{category.description}</p>
            </div>
            
            <div className="grid gap-6">
              {filteredCategories.find(c => c.id === category.id)?.articles.length > 0 ? (
                filteredCategories
                  .find(c => c.id === category.id)?.articles
                  .map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    isExpanded={expandedArticle === article.id}
                    onToggleExpand={() => toggleArticle(article.id)}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No articles found in this category.</p>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Support Section */}
      <div className="bg-muted/50 rounded-lg p-8 text-center mt-12">
        <h2 className="text-2xl font-semibold mb-4">Need more help?</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Our support team is here to help you get the most out of FarmFlow.
        </p>
        <Button>
          <MessageSquare className="mr-2 h-4 w-4" />
          Contact Support
        </Button>
      </div>
    </div>
  );
};

export default KnowledgeCenter;
