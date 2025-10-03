// src/components/growth/GrowthTimeline.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Camera, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useGrowthRecords, useCreateGrowthRecord } from '@/hooks/useGrowth';
import { GrowthRecord, GrowthStage } from '@/types/growth';
import { useState } from 'react';

export function GrowthTimeline({ cropId }: { cropId: string }) {
  const { toast } = useToast();
  const { data: records = [], isLoading } = useGrowthRecords(cropId);
  const createRecord = useCreateGrowthRecord();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (isLoading) {
    return <div>Loading growth timeline...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Growth Timeline</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Stage
            </Button>
          </DialogTrigger>
          <GrowthRecordForm 
            onSubmit={(data) => {
              createRecord.mutate(
                { cropId, data },
                {
                  onSuccess: () => {
                    setIsDialogOpen(false);
                    toast({
                      title: 'Success',
                      description: 'Growth record added successfully',
                    });
                  },
                  onError: (error: Error) => {
                    toast({
                      title: 'Error',
                      description: error.message,
                      variant: 'destructive',
                    });
                  },
                }
              );
            }}
            onCancel={() => setIsDialogOpen(false)}
          />
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {records.map((record) => (
            <GrowthRecordCard 
              key={record.id} 
              record={record} 
              onEdit={() => {}} 
              onDelete={() => {}} 
            />
          ))}
          {records.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No growth records yet. Add the first growth stage.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function GrowthRecordForm({ 
  onSubmit,
  onCancel
}: { 
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    stage_id: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
    notes: '',
    health_score: 80,
    images: [] as File[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...Array.from(e.target.files!)]
      }));
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add Growth Stage</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Growth Stage *</Label>
          <select
            value={formData.stage_id}
            onChange={(e) => setFormData(prev => ({ ...prev, stage_id: e.target.value }))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            required
          >
            <option value="">Select a stage</option>
            {/* Will be populated from API */}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date *</Label>
            <Input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              min={formData.start_date}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Health Score: {formData.health_score}</Label>
          <div className="flex items-center gap-4">
            <Input
              type="range"
              min="0"
              max="100"
              value={formData.health_score}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                health_score: parseInt(e.target.value) 
              }))}
              className="w-full"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Upload Photos</Label>
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <label className="flex flex-col items-center gap-2 cursor-pointer">
              <Camera className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Click to upload or drag and drop
              </span>
              <Input
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
              />
            </label>
          </div>
          {formData.images.length > 0 && (
            <div className="mt-2">
              <div className="flex flex-wrap gap-2">
                {formData.images.map((file, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${i + 1}`}
                      className="h-16 w-16 rounded-md object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          images: prev.images.filter((_, idx) => idx !== i)
                        }));
                      }}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </DialogContent>
  );
}

function GrowthRecordCard({ 
  record,
  onEdit,
  onDelete
}: {
  record: GrowthRecord;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="border-l-2 border-primary pl-4 relative">
      <div className="absolute -left-2 top-2 h-3 w-3 rounded-full bg-primary" />
      <div className="ml-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium">{record.stage.name}</h4>
            <p className="text-sm text-muted-foreground">
              {format(new Date(record.start_date), 'MMM d, yyyy')}
              {record.end_date && ` - ${format(new Date(record.end_date), 'MMM d, yyyy')}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
        
        {record.health_score !== undefined && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm font-medium">Health</span>
            <div className="relative w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${record.health_score}%`,
                  backgroundColor: record.health_score > 70 
                    ? 'hsl(142.1, 76.2%, 36.3%)'  // green-600
                    : record.health_score > 40 
                      ? 'hsl(38, 92%, 50%)'  // yellow-600
                      : 'hsl(0, 84.2%, 60.2%)'  // red-600
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{record.health_score}%</span>
          </div>
        )}
        
        {record.notes && (
          <div className="mt-2 text-sm text-muted-foreground">
            <p className="whitespace-pre-line">{record.notes}</p>
          </div>
        )}
        
        {record.images.length > 0 && (
          <div className="flex gap-2 mt-2">
            {record.images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Growth stage ${record.stage.name}`}
                className="h-16 w-16 rounded-md object-cover"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}