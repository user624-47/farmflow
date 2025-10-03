import React from 'react';
import { useGrowthStages, useCreateGrowthStage, useUpdateGrowthStage, useDeleteGrowthStage } from '@/hooks/useGrowthStages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Trash2, Plus } from 'lucide-react';

// Define form schema using Zod
const growthStageFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  order: z.number().int().min(0, 'Order must be a positive number'),
  crop_type_id: z.string().min(1, 'Crop Type ID is required'),
  organization_id: z.string().min(1, 'Organization ID is required'),
});

type GrowthStageFormValues = z.infer<typeof growthStageFormSchema>;

interface GrowthStageManagerProps {
  organizationId: string;
  cropTypeId?: string;
}

export function GrowthStageManager({ organizationId, cropTypeId }: GrowthStageManagerProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  
  // Fetch growth stages
  const { data: stages, isLoading, error } = useGrowthStages({
    organizationId,
    cropTypeId,
  });
  
  // Form setup
  const form = useForm<GrowthStageFormValues>({
    resolver: zodResolver(growthStageFormSchema),
    defaultValues: {
      name: '',
      description: '',
      order: 0,
      crop_type_id: cropTypeId || '',
      organization_id: organizationId,
    },
  });

  // Reset form when cropTypeId changes
  React.useEffect(() => {
    form.reset({
      ...form.getValues(),
      crop_type_id: cropTypeId || '',
      organization_id: organizationId,
    });
  }, [cropTypeId, organizationId, form]);

  // Mutations
  const createMutation = useCreateGrowthStage();
  const updateMutation = useUpdateGrowthStage();
  const deleteMutation = useDeleteGrowthStage();

  const onSubmit = async (data: GrowthStageFormValues) => {
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: {
            name: data.name,
            description: data.description,
            order: data.order,
          },
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      form.reset();
      setEditingId(null);
    } catch (error) {
      console.error('Error saving growth stage:', error);
    }
  };

  const handleEdit = (stage: any) => {
    setEditingId(stage.id);
    form.reset({
      name: stage.name,
      description: stage.description || '',
      order: stage.order,
      crop_type_id: stage.crop_type_id,
      organization_id: stage.organization_id,
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this growth stage?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting growth stage:', error);
      }
    }
  };

  if (isLoading) return <div>Loading growth stages...</div>;
  if (error) return <div>Error loading growth stages: {error.message}</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Growth Stages</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Stage name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={0} 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="crop_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Crop Type ID</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Crop Type ID" 
                      {...field} 
                      disabled={!!cropTypeId}
                    />
                  </FormControl>
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
                  <Input placeholder="Stage description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end space-x-2">
            {editingId && (
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  form.reset();
                  setEditingId(null);
                }}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {editingId ? 'Update' : 'Add'} Stage
            </Button>
          </div>
        </form>
      </Form>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stages?.length ? (
              [...stages]
                .sort((a, b) => a.order - b.order)
                .map((stage) => (
                  <TableRow key={stage.id}>
                    <TableCell className="font-medium">{stage.name}</TableCell>
                    <TableCell>{stage.description || '-'}</TableCell>
                    <TableCell>{stage.order}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEdit(stage)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(stage.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No growth stages found. Add one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
