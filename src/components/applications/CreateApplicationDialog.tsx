import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const formSchema = z.object({
  application_date: z.date({
    required_error: "Application date is required",
  }),
  crop_id: z.string().optional(),
  farmer_id: z.string().optional(),
  product_name: z.string().min(1, "Product name is required"),
  product_type: z.enum(["fertilizer", "pesticide", "herbicide", "fungicide", "insecticide"]),
  quantity: z.string().min(1, "Quantity is required"),
  unit: z.string().min(1, "Unit is required"),
  application_method: z.string().optional(),
  target_pest_disease: z.string().optional(),
  weather_conditions: z.string().optional(),
  notes: z.string().optional(),
  next_application_date: z.date().optional(),
  cost: z.string().optional(),
});

export type ProductType = 'fertilizer' | 'pesticide' | 'herbicide' | 'fungicide' | 'insecticide';

export interface Application {
  id?: string;
  product_name: string;
  product_type: ProductType;
  application_date: string;
  application_method: string;
  quantity: number;
  unit: string;
  crop_id: string;
  farmer_id: string;
  organization_id?: string;
  notes?: string;
  cost: number | null;
  next_application_date: string | null;
  weather_conditions: string;
  target_pest_disease?: string;
  created_at?: string;
  updated_at?: string;
}

interface CreateApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application?: Application;
  onSuccess?: () => void;
}

export function CreateApplicationDialog({ open, onOpenChange, application, onSuccess }: CreateApplicationDialogProps) {
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      application_date: application?.application_date ? new Date(application.application_date) : new Date(),
      product_name: application?.product_name || "",
      product_type: (application?.product_type as ProductType) || "fertilizer",
      quantity: application?.quantity?.toString() || "",
      unit: application?.unit || "kg",
      application_method: application?.application_method || "",
      crop_id: application?.crop_id || "",
      farmer_id: application?.farmer_id || "",
      notes: application?.notes || "",
      cost: application?.cost?.toString() || "",
      next_application_date: application?.next_application_date ? new Date(application.next_application_date) : undefined,
      weather_conditions: application?.weather_conditions || "",
      target_pest_disease: application?.target_pest_disease || ""
    },
  });

  // Fetch farmers for dropdown
  const { data: farmers } = useQuery({
    queryKey: ["farmers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmers")
        .select("id, first_name, last_name")
        .order("first_name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch crops for dropdown
  const { data: crops } = useQuery({
    queryKey: ["crops"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crops")
        .select("id, crop_name, farmer_id")
        .order("crop_name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Check user role first
      if (userRole !== "admin" && userRole !== "extension_officer" && userRole !== "farmer") {
        toast({
          title: "Access denied",
          description: "You don't have permission to create applications",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);
      
      // Get the current user's organization ID
      const { data: userRoleData, error: roleError } = await supabase
        .from('user_roles')
        .select('organization_id')
        .eq('user_id', user?.id)
        .single();

      if (roleError || !userRoleData) {
        throw new Error('Could not determine your organization');
      }
      
      // Format the data for Supabase
      const applicationData: Omit<Application, 'id' | 'created_at' | 'crops' | 'farmers'> = {
        product_name: values.product_name,
        product_type: values.product_type,
        application_date: values.application_date.toISOString().split('T')[0],
        application_method: values.application_method || '',
        quantity: parseFloat(values.quantity) || 0,
        unit: values.unit,
        crop_id: values.crop_id || '',
        farmer_id: values.farmer_id || user?.id || '', // Use the selected farmer or current user
        notes: values.notes || null,
        cost: values.cost ? parseFloat(values.cost) : null,
        next_application_date: values.next_application_date ? values.next_application_date.toISOString().split('T')[0] : null,
        weather_conditions: values.weather_conditions || '',
        target_pest_disease: values.target_pest_disease || null,
        organization_id: userRoleData.organization_id, // Use the organization_id from user_roles
        updated_at: new Date().toISOString(),
      };

      let error;
      
      if (application?.id) {
        // Update existing application
        const { error: updateError } = await supabase
          .from('applications')
          .update(applicationData)
          .eq('id', application.id);
        error = updateError;
      } else {
        // Create new application
        const { error: insertError } = await supabase
          .from('applications')
          .insert([applicationData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: application ? "Application updated successfully" : "Application created successfully",
      });

      onOpenChange(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error saving application:', error);
      toast({
        title: "Error",
        description: `Failed to ${application ? 'update' : 'create'} application: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{application ? 'Edit' : 'Add New'} Application</DialogTitle>
          <DialogDescription>
            Record a new fertilizer or pesticide application
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="application_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Application Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="product_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fertilizer">Fertilizer</SelectItem>
                        <SelectItem value="pesticide">Pesticide</SelectItem>
                        <SelectItem value="herbicide">Herbicide</SelectItem>
                        <SelectItem value="fungicide">Fungicide</SelectItem>
                        <SelectItem value="insecticide">Insecticide</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="product_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., NPK 15-15-15, Glyphosate" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="farmer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Farmer</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select farmer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {farmers?.map((farmer) => (
                          <SelectItem key={farmer.id} value={farmer.id}>
                            {farmer.first_name} {farmer.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="crop_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Crop (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select crop" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {crops?.map((crop) => (
                          <SelectItem key={crop.id} value={crop.id}>
                            {crop.crop_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="10.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="lbs">lbs</SelectItem>
                        <SelectItem value="liters">liters</SelectItem>
                        <SelectItem value="gallons">gallons</SelectItem>
                        <SelectItem value="bags">bags</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="100.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="application_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Method</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Foliar spray, Soil application" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target_pest_disease"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Pest/Disease</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Aphids, Blight" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="weather_conditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weather Conditions</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Sunny, 25°C, light wind" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="next_application_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Next Application Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about the application..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : application ? 'Update Application' : 'Save Application'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}