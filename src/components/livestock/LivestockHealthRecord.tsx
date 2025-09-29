import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Stethoscope, Syringe, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface LivestockHealthData {
  id: string;
  health_status: string;
  vaccination_date: string | null;
  notes: string | null;
  updated_at: string;
}

interface LivestockHealthRecordProps {
  livestockId: string;
  organizationId: string;
}

export const LivestockHealthRecord = ({ livestockId, organizationId }: LivestockHealthRecordProps) => {
  const [healthData, setHealthData] = useState<LivestockHealthData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<{
    health_status: string;
    vaccination_date: string;
    notes: string;
  }>({
    health_status: "healthy",
    vaccination_date: new Date().toISOString().split('T')[0],
    notes: ""
  });

  useEffect(() => {
    fetchHealthData();
  }, [livestockId]);

  const fetchHealthData = async () => {
    try {
      const { data, error } = await supabase
        .from('livestock')
        .select('id, health_status, vaccination_date, notes, updated_at')
        .eq('id', livestockId)
        .single();

      if (error) throw error;
      
      if (data) {
        setHealthData(data);
        setFormData({
          health_status: data.health_status || 'healthy',
          vaccination_date: data.vaccination_date || new Date().toISOString().split('T')[0],
          notes: data.notes || ''
        });
      }
    } catch (error) {
      console.error('Error fetching livestock health data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch livestock health data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const updateData = {
        health_status: formData.health_status,
        vaccination_date: formData.vaccination_date || null,
        notes: formData.notes || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('livestock')
        .update(updateData)
        .eq('id', livestockId);

      if (error) throw error;

      toast({ 
        title: "Success", 
        description: "Health record updated successfully" 
      });
      
      setIsDialogOpen(false);
      fetchHealthData();
    } catch (error: any) {
      console.error('Error updating health record:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update health record",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      health_status: healthData?.health_status || 'healthy',
      vaccination_date: healthData?.vaccination_date?.split('T')[0] || new Date().toISOString().split('T')[0],
      notes: healthData?.notes || ''
    });
  };

  const getRecordTypeIcon = (type: string) => {
    switch (type) {
      case 'vaccination': return <Syringe className="h-4 w-4" />;
      case 'treatment': return <Stethoscope className="h-4 w-4" />;
      case 'mortality': return <AlertTriangle className="h-4 w-4" />;
      case 'health_check': return <CheckCircle className="h-4 w-4" />;
      default: return <Stethoscope className="h-4 w-4" />;
    }
  };

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case 'vaccination': return 'default';
      case 'treatment': return 'secondary';
      case 'mortality': return 'destructive';
      case 'health_check': return 'default';
      default: return 'default';
    }
  };

  if (loading) {
    return <div>Loading health data...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Health Status</CardTitle>
            <CardDescription>Manage health information for this livestock</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> Update Health
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Update Health Status</DialogTitle>
                  <DialogDescription>
                    Update the health information for this livestock.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="health_status" className="text-right">
                      Health Status
                    </Label>
                    <Select
                      value={formData.health_status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, health_status: value })
                      }
                      required
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select health status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="healthy">Healthy</SelectItem>
                        <SelectItem value="sick">Sick</SelectItem>
                        <SelectItem value="under_observation">Under Observation</SelectItem>
                        <SelectItem value="deceased">Deceased</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="vaccination_date" className="text-right">
                      Last Vaccination
                    </Label>
                    <Input
                      id="vaccination_date"
                      type="date"
                      className="col-span-3"
                      value={formData.vaccination_date}
                      onChange={(e) =>
                        setFormData({ ...formData, vaccination_date: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="notes" className="text-right mt-2">
                      Health Notes
                    </Label>
                    <Textarea
                      id="notes"
                      className="col-span-3"
                      rows={4}
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="Any health observations, treatments, or notes..."
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Current Status</div>
              <div className="mt-1">
                <Badge variant={
                  healthData?.health_status === 'healthy' ? 'default' :
                  healthData?.health_status === 'sick' ? 'destructive' :
                  healthData?.health_status === 'under_observation' ? 'secondary' :
                  'secondary'
                }>
                  {healthData?.health_status?.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </Badge>
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-muted-foreground">Last Updated</div>
              <div className="mt-1">
                {healthData?.updated_at ? format(new Date(healthData.updated_at), 'PPPpp') : 'Never'}
              </div>
            </div>

            {healthData?.vaccination_date && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Last Vaccination</div>
                <div className="mt-1">
                  {format(new Date(healthData.vaccination_date), 'PPP')}
                </div>
              </div>
            )}
          </div>

          {healthData?.notes && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">Health Notes</div>
              <div className="p-4 bg-muted/20 rounded-md whitespace-pre-wrap">
                {healthData.notes}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};