import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, X, Calendar as CalendarIcon, Baby, User, CalendarCheck, AlertCircle, Info } from 'lucide-react';
import { useSingleLivestock } from '../hooks/useLivestock';
import { addBreedingRecord, updateBreedingRecord } from '../api/livestockService';
import { format } from 'date-fns';

// Define form schema with Zod
const breedingRecordFormSchema = z.object({
  breeding_date: z.string().min(1, 'Breeding date is required'),
  expected_birth_date: z.string().min(1, 'Expected birth date is required'),
  actual_birth_date: z.string().optional(),
  status: z.enum(['pregnant', 'delivered', 'failed', 'in_progress']),
  notes: z.string().optional(),
  sire_id: z.string().optional(),
  dam_id: z.string().optional(),
  breeding_method: z.string().optional(),
  pregnancy_check_date: z.string().optional(),
  pregnancy_check_result: z.string().optional(),
  number_of_offspring: z.string().optional(),
  offspring_notes: z.string().optional(),
});

type BreedingRecordFormValues = z.infer<typeof breedingRecordFormSchema>;

interface BreedingRecordFormProps {
  isEdit?: boolean;
  initialData?: any;
  onSuccess?: () => void;
}

export const BreedingRecordForm: React.FC<BreedingRecordFormProps> = ({ 
  isEdit = false, 
  initialData, 
  onSuccess 
}) => {
  const { id, recordId } = useParams<{ id: string; recordId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: livestock } = useSingleLivestock(id || '');
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Initialize form with default values
  const form = useForm<BreedingRecordFormValues>({
    resolver: zodResolver(breedingRecordFormSchema),
    defaultValues: {
      breeding_date: format(new Date(), 'yyyy-MM-dd'),
      status: 'in_progress',
      breeding_method: 'natural',
    },
  });

  // If in edit mode and we have initial data, populate the form
  useEffect(() => {
    if (isEdit && initialData) {
      // Format dates for the date inputs
      const formattedData = {
        ...initialData,
        breeding_date: initialData.breeding_date 
          ? format(new Date(initialData.breeding_date), 'yyyy-MM-dd') 
          : format(new Date(), 'yyyy-MM-dd'),
        expected_birth_date: initialData.expected_birth_date
          ? format(new Date(initialData.expected_birth_date), 'yyyy-MM-dd')
          : '',
        actual_birth_date: initialData.actual_birth_date
          ? format(new Date(initialData.actual_birth_date), 'yyyy-MM-dd')
          : '',
        pregnancy_check_date: initialData.pregnancy_check_date
          ? format(new Date(initialData.pregnancy_check_date), 'yyyy-MM-dd')
          : '',
        number_of_offspring: initialData.number_of_offspring?.toString() || '',
        status: initialData.status || 'in_progress',
      };
      
      form.reset(formattedData);
    }
  }, [form, initialData, isEdit]);

  // Handle form submission
  const onSubmit = async (data: BreedingRecordFormValues) => {
    try {
      setIsSubmitting(true);
      
      const breedingRecordData = {
        ...data,
        // Ensure status is set, default to 'in_progress' if not provided
        status: data.status || 'in_progress',
        livestock_id: id || '',
        // Convert string dates to ISO strings
        breeding_date: new Date(data.breeding_date).toISOString(),
        expected_birth_date: data.expected_birth_date
          ? new Date(data.expected_birth_date).toISOString()
          : null,
        actual_birth_date: data.actual_birth_date
          ? new Date(data.actual_birth_date).toISOString()
          : null,
        pregnancy_check_date: data.pregnancy_check_date
          ? new Date(data.pregnancy_check_date).toISOString()
          : null,
        // Convert number of offspring to integer if it exists
        number_of_offspring: data.number_of_offspring 
          ? parseInt(data.number_of_offspring, 10) 
          : null,
      };
      
      if (isEdit && recordId && id) {
        // Update existing breeding record - requires livestockId, recordId, and updates
        await updateBreedingRecord(id, recordId, breedingRecordData);
        
        toast({
          title: 'Success',
          description: 'Breeding record updated successfully',
          variant: 'default',
        });
      } else if (id) {
        // Create new breeding record
        await addBreedingRecord({
          ...breedingRecordData,
          status: breedingRecordData.status as 'pregnant' | 'delivered' | 'failed' | 'in_progress',
          livestock_id: id
        });
        
        toast({
          title: 'Success',
          description: 'Breeding record created successfully',
          variant: 'default',
        });
      } else {
        throw new Error('Missing required livestock ID');
      }
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Default navigation on success
        navigate(`/livestock/${id}`);
      }
    } catch (error) {
      console.error('Error saving breeding record:', error);
      toast({
        title: 'Error',
        description: 'Failed to save breeding record. Please try again.',
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
            <Baby className="h-6 w-6 mr-2 text-primary" />
            <CardTitle>{isEdit ? 'Edit Breeding Record' : 'Add Breeding Record'}</CardTitle>
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
              {/* Breeding Information */}
              <div className="space-y-4">
                <h3 className="font-medium">Breeding Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="breeding_date">Breeding Date *</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="breeding_date" 
                      type="date" 
                      className="pl-10"
                      {...form.register('breeding_date')} 
                    />
                  </div>
                  {form.formState.errors.breeding_date && (
                    <p className="text-sm text-red-500">{form.formState.errors.breeding_date.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expected_birth_date">Expected Birth Date *</Label>
                  <div className="relative">
                    <CalendarCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="expected_birth_date" 
                      type="date" 
                      className="pl-10"
                      {...form.register('expected_birth_date')} 
                    />
                  </div>
                  {form.formState.errors.expected_birth_date && (
                    <p className="text-sm text-red-500">{form.formState.errors.expected_birth_date.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="actual_birth_date">Actual Birth Date</Label>
                  <div className="relative">
                    <Baby className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="actual_birth_date" 
                      type="date" 
                      className="pl-10"
                      {...form.register('actual_birth_date')} 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <select
                    id="status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...form.register('status')}
                  >
                    <option value="in_progress">In Progress</option>
                    <option value="pregnant">Pregnant</option>
                    <option value="delivered">Delivered</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="breeding_method">Breeding Method</Label>
                  <select
                    id="breeding_method"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...form.register('breeding_method')}
                  >
                    <option value="natural">Natural Mating</option>
                    <option value="ai">Artificial Insemination</option>
                    <option value="embryo">Embryo Transfer</option>
                  </select>
                </div>
              </div>
              
              {/* Parent Information */}
              <div className="space-y-4">
                <h3 className="font-medium">Parent Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="sire_id">Sire (Father) ID</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="sire_id" 
                      placeholder="Sire's ID" 
                      className="pl-10"
                      {...form.register('sire_id')} 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dam_id">Dam (Mother) ID</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="dam_id" 
                      placeholder="Dam's ID" 
                      className="pl-10"
                      value={id}
                      disabled
                    />
                    <input type="hidden" {...form.register('dam_id')} value={id} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This record is for the mother (dam). The ID is pre-filled.
                  </p>
                </div>
                
                {/* Pregnancy Check */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Pregnancy Check</h4>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="pregnancy_check_date">Check Date</Label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                          id="pregnancy_check_date" 
                          type="date" 
                          className="pl-10"
                          {...form.register('pregnancy_check_date')} 
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="pregnancy_check_result">Check Result</Label>
                      <Input 
                        id="pregnancy_check_result" 
                        placeholder="e.g. Positive, Negative, Inconclusive" 
                        {...form.register('pregnancy_check_result')} 
                      />
                    </div>
                  </div>
                </div>
                
                {/* Offspring Information - Only show if status is delivered */}
                {form.watch('status') === 'delivered' && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">Offspring Information</h4>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="number_of_offspring">Number of Offspring</Label>
                        <Input 
                          id="number_of_offspring" 
                          type="number" 
                          min="1" 
                          placeholder="1" 
                          {...form.register('number_of_offspring')} 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="offspring_notes">Offspring Notes</Label>
                        <Textarea 
                          id="offspring_notes" 
                          placeholder="Notes about the offspring..." 
                          className="min-h-[80px]" 
                          {...form.register('offspring_notes')} 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* General Notes */}
            <div className="space-y-2 pt-4">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                placeholder="Any additional notes about this breeding record..." 
                className="min-h-[100px]" 
                {...form.register('notes')} 
              />
            </div>
            
            {/* Form Status */}
            <div className="rounded-md bg-blue-50 p-4">
              <div className="flex">
                <Info className="h-5 w-5 text-blue-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Breeding Record Status</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Current status: <span className="font-medium capitalize">{form.watch('status')?.replace('_', ' ')}</span>
                    </p>
                    {form.watch('status') === 'pregnant' && (
                      <p className="mt-1">
                        Expected delivery: {form.watch('expected_birth_date') ? format(new Date(form.watch('expected_birth_date')), 'MMM d, yyyy') : 'Not set'}
                      </p>
                    )}
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
                  {isEdit ? 'Update Breeding Record' : 'Create Breeding Record'}
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default BreedingRecordForm;
