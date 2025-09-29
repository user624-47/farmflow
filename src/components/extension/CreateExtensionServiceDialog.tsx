import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  content: z.string().optional(),
  video_url: z.string().url().optional().or(z.literal("")),
  audio_url: z.string().url().optional().or(z.literal("")),
  language: z.string().min(1, "Language is required"),
  category: z.string().min(1, "Category is required"),
});

const categories = [
  "Crop Management",
  "Livestock Care", 
  "Pest Control",
  "Soil Health",
  "Market Access",
  "Financial Literacy",
  "Climate Adaptation",
  "Organic Farming",
  "Post-Harvest Handling"
];

const languages = [
  { code: "en", name: "English" },
  { code: "ha", name: "Hausa" },
  { code: "yo", name: "Yoruba" },
  { code: "ig", name: "Igbo" }
];

const targetAudiences = [
  "Smallholder Farmers",
  "Commercial Farmers",
  "Youth Farmers",
  "Women Farmers",
  "Livestock Keepers",
  "Cooperatives",
  "Extension Officers"
];

const seasons = [
  "Dry Season",
  "Rainy Season",
  "Year Round",
  "Pre-Planting",
  "Growing Season",
  "Harvest Season",
  "Post-Harvest"
];

interface CreateExtensionServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateExtensionServiceDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: CreateExtensionServiceDialogProps) {
  const { toast } = useToast();
  const { organizationId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
      video_url: "",
      audio_url: "",
      language: "en",
      category: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const serviceData = {
        title: values.title,
        description: values.description,
        category: values.category,
        language: values.language,
        content: values.content || null,
        video_url: values.video_url || null,
        audio_url: values.audio_url || null,
        organization_id: organizationId,
        target_audience: selectedAudiences,
        seasonal_relevance: selectedSeasons,
      };

      const { error } = await supabase
        .from("extension_services")
        .insert([serviceData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Extension service created successfully",
      });

      form.reset();
      setSelectedAudiences([]);
      setSelectedSeasons([]);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create extension service",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAudienceChange = (audience: string, checked: boolean) => {
    if (checked) {
      setSelectedAudiences([...selectedAudiences, audience]);
    } else {
      setSelectedAudiences(selectedAudiences.filter(a => a !== audience));
    }
  };

  const handleSeasonChange = (season: string, checked: boolean) => {
    if (checked) {
      setSelectedSeasons([...selectedSeasons, season]);
    } else {
      setSelectedSeasons(selectedSeasons.filter(s => s !== season));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Extension Service</DialogTitle>
          <DialogDescription>
            Add a new educational resource for farmers and agricultural professionals
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Service title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the service"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed content or instructions"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="video_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video URL (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://youtube.com/..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="audio_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audio URL (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://soundcloud.com/..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormLabel>Target Audience</FormLabel>
              <div className="grid grid-cols-2 gap-2">
                {targetAudiences.map((audience) => (
                  <div key={audience} className="flex items-center space-x-2">
                    <Checkbox
                      id={audience}
                      checked={selectedAudiences.includes(audience)}
                      onCheckedChange={(checked) => 
                        handleAudienceChange(audience, checked as boolean)
                      }
                    />
                    <label htmlFor={audience} className="text-sm">
                      {audience}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <FormLabel>Seasonal Relevance</FormLabel>
              <div className="grid grid-cols-2 gap-2">
                {seasons.map((season) => (
                  <div key={season} className="flex items-center space-x-2">
                    <Checkbox
                      id={season}
                      checked={selectedSeasons.includes(season)}
                      onCheckedChange={(checked) => 
                        handleSeasonChange(season, checked as boolean)
                      }
                    />
                    <label htmlFor={season} className="text-sm">
                      {season}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Service"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}