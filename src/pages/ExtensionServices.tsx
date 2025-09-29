import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, BookOpen, Users, Eye, Plus, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { CreateExtensionServiceDialog } from "@/components/extension/CreateExtensionServiceDialog";

export default function ExtensionServices() {
  const { userRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: services, isLoading, refetch } = useQuery({
    queryKey: ["extension-services", searchTerm, selectedCategory, selectedLanguage],
    queryFn: async () => {
      let query = supabase
        .from("extension_services")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (selectedCategory !== "all") {
        query = query.eq("category", selectedCategory);
      }

      if (selectedLanguage !== "all") {
        query = query.eq("language", selectedLanguage);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const categories = ["Crop Management", "Livestock Care", "Pest Control", "Soil Health", "Market Access", "Financial Literacy"];
  const languages = [
    { code: "en", name: "English" },
    { code: "ha", name: "Hausa" },
    { code: "yo", name: "Yoruba" },
    { code: "ig", name: "Igbo" }
  ];

  const incrementViewCount = async (serviceId: string) => {
    const { data: currentService } = await supabase
      .from('extension_services')
      .select('views_count')
      .eq('id', serviceId)
      .single();
    
    const { error } = await supabase
      .from('extension_services')
      .update({ views_count: (currentService?.views_count || 0) + 1 })
      .eq('id', serviceId);
    
    if (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const handleServiceClick = (service: any) => {
    incrementViewCount(service.id);
    
    if (service.video_url) {
      window.open(service.video_url, '_blank');
    } else if (service.audio_url) {
      window.open(service.audio_url, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Loading extension services...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Extension Services</h1>
          <p className="text-muted-foreground">
            Access agricultural knowledge and training content in local languages
          </p>
        </div>
        {(userRole === "admin" || userRole === "extension_officer") && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Available resources</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Video Content</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {services?.filter(s => s.video_url).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Video resources</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {services?.reduce((sum, s) => sum + (s.views_count || 0), 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Content views</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Languages</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(services?.map(s => s.language)).size || 0}
            </div>
            <p className="text-xs text-muted-foreground">Language options</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Extension Services Library</CardTitle>
          <div className="flex flex-wrap gap-4">
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Content</TabsTrigger>
              <TabsTrigger value="video">Videos</TabsTrigger>
              <TabsTrigger value="audio">Audio</TabsTrigger>
              <TabsTrigger value="text">Articles</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {services?.map((service) => (
                  <Card 
                    key={service.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleServiceClick(service)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg line-clamp-2">{service.title}</CardTitle>
                        <div className="flex items-center gap-1">
                          {service.video_url && <Video className="h-4 w-4 text-blue-600" />}
                          {service.audio_url && <BookOpen className="h-4 w-4 text-green-600" />}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{service.category}</Badge>
                        <Badge variant="secondary">
                          {languages.find(l => l.code === service.language)?.name || service.language}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {service.description}
                      </p>

                      {service.target_audience && service.target_audience.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium">Target Audience:</p>
                          <div className="flex flex-wrap gap-1">
                            {service.target_audience.slice(0, 3).map((audience: string) => (
                              <Badge key={audience} variant="outline" className="text-xs">
                                {audience}
                              </Badge>
                            ))}
                            {service.target_audience.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{service.target_audience.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {service.seasonal_relevance && service.seasonal_relevance.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium">Season:</p>
                          <div className="flex flex-wrap gap-1">
                            {service.seasonal_relevance.map((season: string) => (
                              <Badge key={season} variant="secondary" className="text-xs">
                                <Calendar className="h-3 w-3 mr-1" />
                                {season}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          <span>{service.views_count || 0} views</span>
                        </div>
                        <Button size="sm" variant="outline">
                          {service.video_url ? 'Watch' : service.audio_url ? 'Listen' : 'Read'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="video" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {services?.filter(s => s.video_url).map((service) => (
                  <Card 
                    key={service.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleServiceClick(service)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg line-clamp-2 flex items-center gap-2">
                        <Video className="h-5 w-5 text-blue-600" />
                        {service.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{service.category}</Badge>
                        <Badge variant="secondary">
                          {languages.find(l => l.code === service.language)?.name || service.language}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {service.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="audio" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {services?.filter(s => s.audio_url).map((service) => (
                  <Card 
                    key={service.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleServiceClick(service)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg line-clamp-2 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-green-600" />
                        {service.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{service.category}</Badge>
                        <Badge variant="secondary">
                          {languages.find(l => l.code === service.language)?.name || service.language}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {service.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="text" className="mt-6">
              <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                {services?.filter(s => !s.video_url && !s.audio_url).map((service) => (
                  <Card key={service.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{service.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{service.category}</Badge>
                        <Badge variant="secondary">
                          {languages.find(l => l.code === service.language)?.name || service.language}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {service.description}
                      </p>
                      {service.content && (
                        <div className="text-sm whitespace-pre-wrap">
                          {service.content.substring(0, 200)}...
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {(!services || services.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No extension services found. Try adjusting your search criteria.
            </div>
          )}
        </CardContent>
      </Card>

      <CreateExtensionServiceDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          refetch();
          setIsCreateDialogOpen(false);
        }}
      />
    </div>
  );
}