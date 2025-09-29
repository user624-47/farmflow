import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { FeedingRecord } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, X, Utensils, Calendar, Clock, Scale, Info } from 'lucide-react';
import { useSingleLivestock } from '../hooks/useLivestock';
import { addFeedingRecord, updateFeedingRecord } from '../api/livestockService';

// Define form schema with Zod
const feedingRecordFormSchema = z.object({
  feed_type: z.string().min(1, 'Feed type is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  unit: z.string().min(1, 'Unit is required'),
  feeding_time: z.string().min(1, 'Feeding time is required'),
  notes: z.string().optional(),
  feeding_method: z.string().optional(),
  cost_per_unit: z.string().optional(),
  cost_currency: z.string().optional(),
  supplier: z.string().optional(),
  batch_number: z.string().optional(),
  expiration_date: z.string().optional(),
  nutritional_info: z.string().optional(),
});

type FeedingRecordFormValues = z.infer<typeof feedingRecordFormSchema>;

interface FeedingRecordFormProps {
  isEdit?: boolean;
  initialData?: any;
  onSuccess?: () => void;
}

export const FeedingRecordForm: React.FC<FeedingRecordFormProps> = ({ 
  isEdit = false, 
  initialData, 
  onSuccess 
}) => {
  const { id, recordId } = useParams<{ id: string; recordId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: livestock } = useSingleLivestock(id || '');
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Common feed units
  const feedUnits = [
    { value: 'kg', label: 'Kilograms (kg)' },
    { value: 'g', label: 'Grams (g)' },
    { value: 'lbs', label: 'Pounds (lbs)' },
    { value: 'oz', label: 'Ounces (oz)' },
    { value: 'l', label: 'Liters (L)' },
    { value: 'ml', label: 'Milliliters (ml)' },
    { value: 'scoop', label: 'Scoops' },
    { value: 'bale', label: 'Bales' },
    { value: 'bunch', label: 'Bunches' },
  ];
  
  // Common feed types
  const feedTypes = [
    'Grass Hay', 'Alfalfa', 'Silage', 'Grains', 'Pellets', 'Minerals', 
    'Supplements', 'Forage', 'Concentrates', 'Total Mixed Ration (TMR)',
    'Pasture', 'Haylage', 'Straw', 'Bran', 'Oilseed Meals'
  ];
  
  // Common feeding methods
  const feedingMethods = [
    'Trough', 'Automatic Feeder', 'Pasture', 'Hand Feeding', 
    'Self-Feeder', 'Bale Feeder', 'Creep Feeder', 'Bunk'
  ];
  
  // Initialize form with default values
  const form = useForm<FeedingRecordFormValues>({
    resolver: zodResolver(feedingRecordFormSchema),
    defaultValues: {
      feed_type: '',
      quantity: '',
      unit: 'kg',
      feeding_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      feeding_method: 'Trough',
      cost_currency: 'USD',
    },
  });

  // If in edit mode and we have initial data, populate the form
  useEffect(() => {
    if (isEdit && initialData) {
      // Format dates for the datetime-local input
      const formattedData = {
        ...initialData,
        feeding_time: initialData.feeding_time 
          ? format(new Date(initialData.feeding_time), "yyyy-MM-dd'T'HH:mm")
          : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        expiration_date: initialData.expiration_date
          ? format(new Date(initialData.expiration_date), 'yyyy-MM-dd')
          : '',
        quantity: initialData.quantity?.toString() || '',
        cost_per_unit: initialData.cost_per_unit?.toString() || '',
      };
      
      form.reset(formattedData);
    }
  }, [form, initialData, isEdit]);

  // Handle form submission
  const onSubmit = async (formData: FeedingRecordFormValues) => {
    try {
      setIsSubmitting(true);
      
      if (!id) {
        throw new Error('Livestock ID is missing');
      }

      // Prepare the feeding record data with all required fields
      const feedingRecordData: Omit<FeedingRecord, 'id' | 'created_at' | 'updated_at'> = {
        livestock_id: id,
        feed_type: formData.feed_type,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit || 'kg', // Provide a default value if not set
        feeding_time: new Date(formData.feeding_time).toISOString(),
        // Include optional fields only if they have values
        ...(formData.notes && { notes: formData.notes }),
        ...(formData.expiration_date && { 
          expiration_date: new Date(formData.expiration_date).toISOString() 
        }),
        ...(formData.cost_per_unit && { 
          cost_per_unit: parseFloat(formData.cost_per_unit) 
        }),
        ...(formData.feeding_method && { feeding_method: formData.feeding_method }),
        ...(formData.cost_currency && { cost_currency: formData.cost_currency }),
        ...(formData.supplier && { supplier: formData.supplier }),
        ...(formData.batch_number && { batch_number: formData.batch_number }),
        ...(formData.nutritional_info && { nutritional_info: formData.nutritional_info }),
      };
      
      if (isEdit && recordId) {
        // Update existing feeding record
        await updateFeedingRecord(id, recordId, feedingRecordData);
        
        toast({
          title: 'Success',
          description: 'Feeding record updated successfully',
          variant: 'default',
        });
      } else {
        // Create new feeding record
        await addFeedingRecord(feedingRecordData);
        
        toast({
          title: 'Success',
          description: 'Feeding record created successfully',
          variant: 'default',
        });
      }
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Default navigation on success
        navigate(`/livestock/${id}`);
      }
    } catch (error) {
      console.error('Error saving feeding record:', error);
      toast({
        title: 'Error',
        description: 'Failed to save feeding record. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form cancellation
  const handleCancel = () => {
    if (form.formState.isDirty) {
      if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
        navigate(-1); // Go back to previous page
      }
    } else {
      navigate(-1); // Go back to previous page
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <Utensils className="h-6 w-6 mr-2 text-primary" />
            <CardTitle>{isEdit ? 'Edit Feeding Record' : 'Add Feeding Record'}</CardTitle>
          </div>
          <CardDescription>
            {livestock && (
              <span>For {livestock.name || 'Unnamed Livestock'} ({livestock.animal_type})</span>
            )}
          </CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Feeding Information */}
              <div className="space-y-4">
                <h3 className="font-medium">Feeding Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="feed_type">Feed Type *</Label>
                  <div className="relative">
                    <Utensils className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <select
                      id="feed_type"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...form.register('feed_type')}
                    >
                      <option value="">Select feed type</option>
                      {feedTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                      <option value="other">Other (specify in notes)</option>
                    </select>
                  </div>
                  {form.formState.errors.feed_type && (
                    <p className="text-sm text-red-500">{form.formState.errors.feed_type.message}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <div className="relative">
                      <Scale className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        id="quantity" 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        className="pl-10"
                        {...form.register('quantity')} 
                      />
                    </div>
                    {form.formState.errors.quantity && (
                      <p className="text-sm text-red-500">{form.formState.errors.quantity.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit *</Label>
                    <select
                      id="unit"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...form.register('unit')}
                    >
                      {feedUnits.map((unit) => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="feeding_time">Date & Time *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="feeding_time" 
                      type="datetime-local" 
                      className="pl-10"
                      {...form.register('feeding_time')} 
                    />
                  </div>
                  {form.formState.errors.feeding_time && (
                    <p className="text-sm text-red-500">{form.formState.errors.feeding_time.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="feeding_method">Feeding Method</Label>
                  <select
                    id="feeding_method"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...form.register('feeding_method')}
                  >
                    {feedingMethods.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nutritional_info">Nutritional Information</Label>
                  <Textarea 
                    id="nutritional_info" 
                    placeholder="e.g. Protein: 16%, Fiber: 25%, Energy: 2.5 Mcal/kg" 
                    className="min-h-[80px]" 
                    {...form.register('nutritional_info')} 
                  />
                </div>
              </div>
              
              {/* Feed Details */}
              <div className="space-y-4">
                <h3 className="font-medium">Feed Details</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="batch_number">Batch/Lot Number</Label>
                  <Input 
                    id="batch_number" 
                    placeholder="e.g. BATCH-2023-001" 
                    {...form.register('batch_number')} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expiration_date">Expiration Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="expiration_date" 
                      type="date" 
                      className="pl-10"
                      {...form.register('expiration_date')} 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input 
                    id="supplier" 
                    placeholder="e.g. Farm Supply Co." 
                    {...form.register('supplier')} 
                  />
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Cost Information</h4>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="cost_per_unit">Cost Per Unit</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {form.watch('cost_currency') === 'USD' ? '$' : 
                           form.watch('cost_currency') === 'EUR' ? '€' :
                           form.watch('cost_currency') === 'GBP' ? '£' :
                           form.watch('cost_currency') === 'KES' ? 'KSh' :
                           form.watch('cost_currency') === 'NGN' ? '₦' :
                           form.watch('cost_currency') === 'ZAR' ? 'R' : '$'}
                        </span>
                        <Input 
                          id="cost_per_unit" 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          className="pl-10"
                          {...form.register('cost_per_unit')} 
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cost_currency">Currency</Label>
                      <select
                        id="cost_currency"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...form.register('cost_currency')}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="KES">KES (KSh)</option>
                        <option value="NGN">NGN (₦)</option>
                        <option value="ZAR">ZAR (R)</option>
                      </select>
                    </div>
                  </div>
                  
                  {form.watch('cost_per_unit') && form.watch('quantity') && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Total cost: {form.watch('cost_currency') === 'USD' ? '$' : 
                                 form.watch('cost_currency') === 'EUR' ? '€' :
                                 form.watch('cost_currency') === 'GBP' ? '£' :
                                 form.watch('cost_currency') === 'KES' ? 'KSh' :
                                 form.watch('cost_currency') === 'NGN' ? '₦' :
                                 form.watch('cost_currency') === 'ZAR' ? 'R' : '$'}
                      {(parseFloat(form.watch('cost_per_unit') || '0') * parseFloat(form.watch('quantity') || '0')).toFixed(2)}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Any additional notes about this feeding..." 
                    className="min-h-[120px]" 
                    {...form.register('notes')} 
                  />
                </div>
              </div>
            </div>
            
            {/* Feeding Summary */}
            <div className="rounded-md bg-blue-50 p-4">
              <div className="flex">
                <Info className="h-5 w-5 text-blue-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Feeding Summary</h3>
                  <div className="mt-2 text-sm text-blue-700 space-y-1">
                    <p>
                      <span className="font-medium">Feed:</span> {form.watch('feed_type') || 'Not specified'}
                    </p>
                    <p>
                      <span className="font-medium">Quantity:</span> {form.watch('quantity') || '0'} {form.watch('unit')}
                    </p>
                    <p>
                      <span className="font-medium">Scheduled for:</span> {form.watch('feeding_time') 
                        ? format(new Date(form.watch('feeding_time')), 'MMM d, yyyy h:mm a')
                        : 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t px-6 py-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEdit ? 'Update Feeding Record' : 'Create Feeding Record'}
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default FeedingRecordForm;
