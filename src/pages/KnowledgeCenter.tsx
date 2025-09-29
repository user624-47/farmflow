import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Lightbulb, Shield, BarChart2, Calendar, Droplet, Thermometer, Wind, Users, Settings, CloudRain, Sun, Cloud } from "lucide-react";
import { Link } from "react-router-dom";

export const KnowledgeCenter = () => {
  const features = [
    {
      title: "Getting Started",
      icon: <BookOpen className="h-5 w-5 text-blue-500" />,
      description: "Learn the basics of FarmFlow and how to set up your farm profile.",
      link: "/knowledge/getting-started"
    },
    {
      title: "Crop Management",
      icon: <CloudRain className="h-5 w-5 text-green-500" />,
      description: "Track and manage your crops, growth stages, and health metrics.",
      link: "/knowledge/crop-management"
    },
    {
      title: "Weather Insights",
      icon: <Sun className="h-5 w-5 text-yellow-500" />,
      description: "Understand how weather impacts your farm and how to use weather data.",
      link: "/knowledge/weather-insights"
    },
    {
      title: "Yield Prediction",
      icon: <BarChart2 className="h-5 w-5 text-purple-500" />,
      description: "Learn how to interpret and use yield predictions for better planning.",
      link: "/knowledge/yield-prediction"
    },
    {
      title: "Risk Assessment",
      icon: <Shield className="h-5 w-5 text-red-500" />,
      description: "Identify and mitigate risks to your crops and farm operations.",
      link: "/knowledge/risk-assessment"
    },
    {
      title: "Best Practices",
      icon: <Lightbulb className="h-5 w-5 text-amber-500" />,
      description: "Discover expert-recommended farming practices for optimal results.",
      link: "/knowledge/best-practices"
    }
  ];

  const guides = [
    {
      title: "Setting Up Your First Farm",
      category: "Tutorial",
      time: "5 min read"
    },
    {
      title: "Understanding Weather Alerts",
      category: "Guide",
      time: "8 min read"
    },
    {
      title: "Maximizing Crop Yields",
      category: "Article",
      time: "10 min read"
    },
    {
      title: "Seasonal Planning Guide",
      category: "Guide",
      time: "12 min read"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">FarmFlow Knowledge Center</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Your comprehensive guide to mastering FarmFlow and optimizing your farming operations.
        </p>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Featured Topics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Link to={feature.link} key={index} className="hover:opacity-90 transition-opacity">
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center space-x-4">
                  <div className="p-2 bg-muted rounded-lg">
                    {feature.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Popular Guides</h2>
        <div className="space-y-4">
          {guides.map((guide, index) => (
            <Card key={index} className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-lg">{guide.title}</h3>
                    <p className="text-sm text-muted-foreground">{guide.category} • {guide.time}</p>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-muted-foreground"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Need more help?</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Our support team is here to help you get the most out of FarmFlow.
        </p>
        <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          Contact Support
        </button>
      </div>
    </div>
  );
};

export default KnowledgeCenter;
