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
  farmer_id: z.string().min(1, "Farmer is required"),
  service_type: z.enum(["loan", "insurance", "savings", "mobile_money"]),
  provider: z.string().min(1, "Provider is required"),
  amount: z.string().min(1, "Amount is required"),
  interest_rate: z.string().optional(),
  duration_months: z.string().optional(),
  application_date: z.date({
    required_error: "Application date is required",
  }),
  notes: z.string().optional(),
});

const providers = {
  loan: [
    "LAPO Microfinance Bank",
    "AB Microfinance Bank", 
    "Accion Microfinance Bank",
    "CBN Anchor Borrowers Program",
    "NIRSAL Microfinance Bank",
    "BOA/BOI AgriCredit"
  ],
  insurance: [
    "Nigerian Agricultural Insurance Corporation",
    "Leadway Assurance",
    "AIICO Insurance",
    "Mutual Benefits Assurance"
  ],
  savings: [
    "LAPO Microfinance Bank",
    "AB Microfinance Bank",
    "Accion Microfinance Bank",
    "Cooperative Societies"
  ],
  mobile_money: [
    "MTN Mobile Money",
    "Airtel Money", 
    "9Mobile Money",
    "Paystack"
  ]
};

interface CreateFinancialServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateFinancialServiceDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: CreateFinancialServiceDialogProps) {
  const { toast } = useToast();
  const { organizationId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      farmer_id: "",
      service_type: "loan",
      provider: "",
      amount: "",
      interest_rate: "",
      duration_months: "",
      application_date: new Date(),
      notes: "",
    },
  });

  const selectedServiceType = form.watch("service_type");

  // Fetch farmers for dropdown
  const { data: farmers } = useQuery({
    queryKey: ["farmers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmers")
        .select("id, first_name, last_name, farmer_id")
        .order("first_name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const serviceData = {
        farmer_id: values.farmer_id,
        service_type: values.service_type,
        provider: values.provider,
        application_date: values.application_date.toISOString().split('T')[0],
        organization_id: organizationId,
        amount: parseFloat(values.amount),
        interest_rate: values.interest_rate ? parseFloat(values.interest_rate) : null,
        duration_months: values.duration_months ? parseInt(values.duration_months) : null,
        notes: values.notes || null,
      };

      const { error } = await supabase
        .from("financial_services")
        .insert([serviceData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Financial service record created successfully",
      });

      form.reset();
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create financial service record",
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
          <DialogTitle>Create Financial Service Record</DialogTitle>
          <DialogDescription>
            Record a new financial service application or account
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                            {farmer.first_name} {farmer.last_name} ({farmer.farmer_id})
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
                name="service_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select service type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="loan">Loan</SelectItem>
                        <SelectItem value="insurance">Insurance</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {providers[selectedServiceType]?.map((provider) => (
                        <SelectItem key={provider} value={provider}>
                          {provider}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₦)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="100000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedServiceType === "loan" && (
                <>
                  <FormField
                    control={form.control}
                    name="interest_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest Rate (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="12.5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration_months"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (Months)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about the service..."
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
                {isSubmitting ? "Creating..." : "Create Record"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}