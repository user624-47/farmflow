import React, { useState, useEffect } from 'react';

type LivestockStatus = 'active' | 'inactive' | 'sick' | 'pregnant' | 'sold' | 'deceased';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useLivestock, useSingleLivestock } from '../hooks/useLivestock';
import { LivestockInput } from '../types';
import { cn } from '@/lib/utils';

// Form Schema
const livestockFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  animal_type: z.string().min(1, 'Animal type is required'),
  breed: z.string().min(1, 'Breed is required'),
  status: z.enum(['active', 'inactive', 'sick', 'pregnant', 'sold', 'deceased']),
  date_of_birth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']),
  color: z.string().optional(),
  ear_tag: z.string().optional(),
  rfid: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  weight: z.string().optional(),
  weight_unit: z.string().optional(),
  purchase_date: z.string().optional(),
  purchase_price: z.string().optional(),
  purchase_currency: z.string().optional(),
  mother_id: z.string().optional(),
  father_id: z.string().optional(),
  last_checkup_date: z.string().optional(),
  next_checkup_date: z.string().optional(),
});

type LivestockFormValues = z.infer<typeof livestockFormSchema>;

export interface LivestockFormProps {
  isEdit?: boolean;
  initialData?: LivestockInput;
  onSuccess?: () => void;
}

// Utility component for error messages
export const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-sm text-red-500">{message}</p> : null;

// Step 1: Basic Information
const BasicInfoStep = ({ control, register, errors, watch }: any) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Basic Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name*</Label>
          <Input id="name" placeholder="Enter name" {...register('name')} />
          <FieldError message={errors.name?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="animal_type">Animal Type*</Label>
          <Input id="animal_type" placeholder="e.g., Cow, Goat, Chicken" {...register('animal_type')} />
          <FieldError message={errors.animal_type?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="breed">Breed*</Label>
          <Input id="breed" placeholder="Enter breed" {...register('breed')} />
          <FieldError message={errors.breed?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender*</Label>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <FieldError message={errors.gender?.message} />
        </div>
      </div>
    </div>
  );
};

// Step 2: Identification & Status
const IdentificationStep = ({ control, register, errors }: any) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Identification & Status</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ear_tag">Ear Tag</Label>
          <Input id="ear_tag" placeholder="Enter ear tag number" {...register('ear_tag')} />
          <FieldError message={errors.ear_tag?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rfid">RFID</Label>
          <Input id="rfid" placeholder="Enter RFID" {...register('rfid')} />
          <FieldError message={errors.rfid?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status*</Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="sick">Sick</SelectItem>
                  <SelectItem value="pregnant">Pregnant</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="deceased">Deceased</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <FieldError message={errors.status?.message} />
        </div>
      </div>
    </div>
  );
};

// Step 3: Health & Details
const HealthDetailsStep = ({ control, register, errors }: any) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Health & Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date_of_birth">Date of Birth</Label>
          <Input id="date_of_birth" type="date" {...register('date_of_birth')} />
          <FieldError message={errors.date_of_birth?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <Input id="color" placeholder="Enter color" {...register('color')} />
          <FieldError message={errors.color?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight">Weight</Label>
          <div className="flex gap-2">
            <Input id="weight" type="number" placeholder="0.0" {...register('weight')} />
            <Controller
              name="weight_unit"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="kg" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="lbs">lbs</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <FieldError message={errors.weight?.message} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" placeholder="Additional notes about this animal" className="min-h-[100px]" {...register('notes')} />
        <FieldError message={errors.notes?.message} />
      </div>
    </div>
  );
};

export const LivestockForm: React.FC<LivestockFormProps> = ({
  isEdit = false,
  initialData,
  onSuccess,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { createLivestock, updateLivestock } = useLivestock();
  
  const methods = useForm<LivestockFormValues>({
    resolver: zodResolver(livestockFormSchema),
    defaultValues: {
      gender: 'female',
      ...initialData,
      // Ensure status is one of the allowed values, defaulting to 'active' if not provided or invalid
      status: (initialData?.status && ['active', 'inactive', 'sick', 'pregnant', 'sold', 'deceased'].includes(initialData.status))
        ? initialData.status as 'active' | 'inactive' | 'sick' | 'pregnant' | 'sold' | 'deceased'
        : 'active',
    },
  });

  const { handleSubmit, control, formState: { errors }, register, watch } = methods;

  const onSubmit: SubmitHandler<LivestockFormValues> = async (data) => {
    try {
      setIsLoading(true);
      
      if (isEdit && id) {
        await updateLivestock({ id, updates: data });
        toast({
          title: 'Success',
          description: 'Livestock updated successfully',
          variant: 'default',
        });
      } else {
        await createLivestock(data);
        toast({
          title: 'Success',
          description: 'Livestock added successfully',
          variant: 'default',
        });
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Error saving livestock:', error);
      toast({
        title: 'Error',
        description: 'Failed to save livestock. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {isEdit ? 'Edit Livestock' : 'Add New Livestock'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 1 && <BasicInfoStep control={control} register={register} errors={errors} watch={watch} />}
            {currentStep === 2 && <IdentificationStep control={control} register={register} errors={errors} />}
            {currentStep === 3 && <HealthDetailsStep control={control} register={register} errors={errors} />}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1 || isLoading}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            {currentStep < 3 ? (
              <Button type="button" onClick={nextStep}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEdit ? 'Update' : 'Save'} Livestock
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
};
