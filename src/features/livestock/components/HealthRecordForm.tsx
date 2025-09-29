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
import { Loader2, Save, X, Calendar as CalendarIcon, AlertTriangle, Pill, Stethoscope, CalendarCheck } from 'lucide-react';
import { useSingleLivestock } from '../hooks/useLivestock';
import { addHealthRecord, updateHealthRecord } from '../api/livestockService';
import { format } from 'date-fns';

// Define form schema with Zod
const healthRecordFormSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  treatment: z.string().min(1, 'Treatment is required'),
  vet_notes: z.string().optional(),
  medication: z.string().optional(),
  dosage: z.string().optional(),
  next_checkup_date: z.string().optional(),
  cost: z.string().optional(),
  cost_currency: z.string().optional(),
  vet_name: z.string().optional(),
  vet_contact: z.string().optional(),
});

type HealthRecordFormValues = z.infer<typeof healthRecordFormSchema>;

interface HealthRecordFormProps {
  isEdit?: boolean;
  initialData?: any;
  onSuccess?: () => void;
}

export const HealthRecordForm: React.FC<HealthRecordFormProps> = ({ 
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
  const form = useForm<HealthRecordFormValues>({
    resolver: zodResolver(healthRecordFormSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      diagnosis: '',
      treatment: '',
      vet_notes: '',
      medication: '',
      dosage: '',
      next_checkup_date: '',
      cost: '',
      cost_currency: 'USD',
      vet_name: '',
      vet_contact: '',
    },
  });

  // If in edit mode and we have initial data, populate the form
  useEffect(() => {
    if (isEdit && initialData) {
      // Format dates for the date inputs
      const formattedData = {
        ...initialData,
        date: initialData.date ? format(new Date(initialData.date), 'yyyy-MM-dd') : '',
        next_checkup_date: initialData.next_checkup_date 
          ? format(new Date(initialData.next_checkup_date), 'yyyy-MM-dd') 
          : '',
      };
      
      form.reset(formattedData);
    }
  }, [form, initialData, isEdit]);

  // Handle form submission
  const onSubmit = async (data: HealthRecordFormValues) => {
    try {
      setIsSubmitting(true);
      
      const healthRecordData = {
        ...data,
        livestock_id: id,
        // Convert string dates to ISO strings
        date: new Date(data.date).toISOString(),
        next_checkup_date: data.next_checkup_date 
          ? new Date(data.next_checkup_date).toISOString() 
          : null,
        // Convert cost to number if it exists
        cost: data.cost ? parseFloat(data.cost) : null,
      };
      
      if (isEdit && recordId) {
        // Update existing health record
        await updateHealthRecord(recordId, healthRecordData);
        
        toast({
          title: 'Success',
          description: 'Health record updated successfully',
          variant: 'default',
        });
      } else {
        // Create new health record
        await addHealthRecord(healthRecordData);
        
        toast({
          title: 'Success',
          description: 'Health record created successfully',
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
      console.error('Error saving health record:', error);
      toast({
        title: 'Error',
        description: 'Failed to save health record. Please try again.',
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
            <Stethoscope className="h-6 w-6 mr-2 text-primary" />
            <CardTitle>{isEdit ? 'Edit Health Record' : 'Add Health Record'}</CardTitle>
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
              {/* Date & Diagnosis */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="date" 
                      type="date" 
                      className="pl-10"
                      {...form.register('date')} 
                    />
                  </div>
                  {form.formState.errors.date && (
                    <p className="text-sm text-red-500">{form.formState.errors.date.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="diagnosis">Diagnosis *</Label>
                  <div className="relative">
                    <AlertTriangle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="diagnosis" 
                      placeholder="e.g. Foot Rot, Mastitis" 
                      className="pl-10"
                      {...form.register('diagnosis')} 
                    />
                  </div>
                  {form.formState.errors.diagnosis && (
                    <p className="text-sm text-red-500">{form.formState.errors.diagnosis.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="treatment">Treatment *</Label>
                  <Textarea 
                    id="treatment" 
                    placeholder="Describe the treatment provided..." 
                    className="min-h-[100px]" 
                    {...form.register('treatment')} 
                  />
                  {form.formState.errors.treatment && (
                    <p className="text-sm text-red-500">{form.formState.errors.treatment.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vet_notes">Veterinarian's Notes</Label>
                  <Textarea 
                    id="vet_notes" 
                    placeholder="Additional notes from the veterinarian..." 
                    className="min-h-[100px]" 
                    {...form.register('vet_notes')} 
                  />
                </div>
              </div>
              
              {/* Medication & Follow-up */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="medication">Medication</Label>
                  <div className="relative">
                    <Pill className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="medication" 
                      placeholder="e.g. Penicillin, Ivermectin" 
                      className="pl-10"
                      {...form.register('medication')} 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dosage">Dosage</Label>
                    <Input 
                      id="dosage" 
                      placeholder="e.g. 10mg, 1 tablet" 
                      {...form.register('dosage')} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="next_checkup_date">Next Checkup</Label>
                    <div className="relative">
                      <CalendarCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        id="next_checkup_date" 
                        type="date" 
                        className="pl-10"
                        {...form.register('next_checkup_date')} 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Veterinarian Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vet_name">Veterinarian Name</Label>
                      <Input 
                        id="vet_name" 
                        placeholder="Dr. Smith" 
                        {...form.register('vet_name')} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="vet_contact">Contact Information</Label>
                      <Input 
                        id="vet_contact" 
                        placeholder="Phone or email" 
                        {...form.register('vet_contact')} 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Cost</h4>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="cost">Amount</Label>
                      <Input 
                        id="cost" 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...form.register('cost')} 
                      />
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
                  {isEdit ? 'Update Health Record' : 'Create Health Record'}
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default HealthRecordForm;
