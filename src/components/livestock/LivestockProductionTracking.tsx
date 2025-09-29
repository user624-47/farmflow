import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Milk, Egg, Baby, TrendingUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth } from "date-fns";

// Define the production record type
interface ProductionRecord {
  id: string;
  livestock_id: string;
  organization_id: string;
  production_type: string;
  quantity: number;
  unit: string;
  production_date: string;
  quality_grade?: string | null;
  market_price?: number | null;
  sold_quantity?: number | null;
  revenue?: number | null;
  created_at?: string;
}

// Helper type for new record data
type NewProductionRecord = Omit<ProductionRecord, 'id' | 'created_at'>;

interface LivestockProductionTrackingProps {
  livestockId: string;
  livestockType: string;
  organizationId: string;
}

export const LivestockProductionTracking = ({ 
  livestockId, 
  livestockType, 
  organizationId 
}: LivestockProductionTrackingProps) => {
  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    production_type: "",
    quantity: "",
    unit: "",
    production_date: new Date().toISOString().split('T')[0],
    quality_grade: "",
    market_price: "",
    sold_quantity: "",
    revenue: ""
  });

  useEffect(() => {
    fetchProductionRecords();
  }, [livestockId]);

  const fetchProductionRecords = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('livestock_production')
        .select('*')
        .eq('livestock_id', livestockId)
        .order('production_date', { ascending: false });

      if (error) throw error;
      setProductionRecords((data as ProductionRecord[]) || []);
    } catch (error) {
      console.error('Error fetching production records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const recordData = {
        livestock_id: livestockId,
        organization_id: organizationId,
        ...formData,
        quantity: parseFloat(formData.quantity),
        market_price: formData.market_price ? parseFloat(formData.market_price) : null,
        sold_quantity: formData.sold_quantity ? parseFloat(formData.sold_quantity) : null,
        revenue: formData.revenue ? parseFloat(formData.revenue) : null
      };

      const { error } = await (supabase as any)
        .from('livestock_production')
        .insert([recordData]);

      if (error) throw error;

      toast({ 
        title: "Success", 
        description: "Production record added successfully" 
      });
      
      setIsDialogOpen(false);
      resetForm();
      fetchProductionRecords();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      production_type: "",
      quantity: "",
      unit: "",
      production_date: new Date().toISOString().split('T')[0],
      quality_grade: "",
      market_price: "",
      sold_quantity: "",
      revenue: ""
    });
  };

  const getProductionTypeIcon = (type: string) => {
    switch (type) {
      case 'milk': return <Milk className="h-4 w-4" />;
      case 'eggs': return <Egg className="h-4 w-4" />;
      case 'offspring': return <Baby className="h-4 w-4" />;
      default: return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getProductionTypeColor = (type: string) => {
    switch (type) {
      case 'milk': return 'default';
      case 'eggs': return 'secondary';
      case 'offspring': return 'outline';
      default: return 'secondary';
    }
  };

  const getProductionOptions = (): Array<{value: string; label: string}> => {
    const type = livestockType?.toLowerCase() || '';
    
    if (type.includes('cattle') || type.includes('cow') || type.includes('bull')) {
      return [
        { value: 'milk', label: 'Milk' },
        { value: 'offspring', label: 'Calves' }
      ];
    } else if (type.includes('poultry') || type.includes('chicken') || type.includes('bird')) {
      return [
        { value: 'eggs', label: 'Eggs' },
        { value: 'offspring', label: 'Chicks' }
      ];
    } else if (type.includes('goat') || type.includes('sheep')) {
      const offspringLabel = type.includes('goat') ? 'Kids' : 'Lambs';
      return [
        { value: 'milk', label: 'Milk' },
        { value: 'offspring', label: `${offspringLabel}` }
      ];
    }
    
    // Default options
    return [
      { value: 'offspring', label: 'Offspring' },
      { value: 'milk', label: 'Milk' },
      { value: 'eggs', label: 'Eggs' },
      { value: 'other', label: 'Other' }
    ];
  };

  // Calculate monthly totals
  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const currentMonthRecords = productionRecords.filter(record => {
    const recordDate = new Date(record.production_date);
    return recordDate >= monthStart && recordDate <= monthEnd;
  });

  const monthlyTotals = currentMonthRecords.reduce((acc, record) => {
    const type = record.production_type;
    if (!acc[type]) {
      acc[type] = { quantity: 0, revenue: 0, unit: record.unit };
    }
    acc[type].quantity += record.quantity;
    acc[type].revenue += record.revenue || 0;
    return acc;
  }, {} as Record<string, { quantity: number; revenue: number; unit: string }>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Production Tracking</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Record Production
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Production</DialogTitle>
              <DialogDescription>
                Track daily production and sales for this livestock.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="production_date">Date</Label>
                  <Input
                    id="production_date"
                    type="date"
                    value={formData.production_date}
                    onChange={(e) => setFormData({...formData, production_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="production_type">Type</Label>
                  <Select 
                    value={formData.production_type} 
                    onValueChange={(value) => setFormData({...formData, production_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {getProductionOptions().map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Select 
                    value={formData.unit} 
                    onValueChange={(value) => setFormData({...formData, unit: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="liters">Liters</SelectItem>
                      <SelectItem value="pieces">Pieces</SelectItem>
                      <SelectItem value="dozens">Dozens</SelectItem>
                      <SelectItem value="heads">Heads</SelectItem>
                      <SelectItem value="kg">Kilograms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="quality_grade">Quality Grade</Label>
                <Select 
                  value={formData.quality_grade} 
                  onValueChange={(value) => setFormData({...formData, quality_grade: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="grade_a">Grade A</SelectItem>
                    <SelectItem value="grade_b">Grade B</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="market_price">Market Price (₦)</Label>
                  <Input
                    id="market_price"
                    type="number"
                    step="0.01"
                    value={formData.market_price}
                    onChange={(e) => setFormData({...formData, market_price: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="sold_quantity">Sold Quantity</Label>
                  <Input
                    id="sold_quantity"
                    type="number"
                    step="0.01"
                    value={formData.sold_quantity}
                    onChange={(e) => setFormData({...formData, sold_quantity: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="revenue">Revenue (₦)</Label>
                <Input
                  id="revenue"
                  type="number"
                  step="0.01"
                  value={formData.revenue}
                  onChange={(e) => setFormData({...formData, revenue: e.target.value})}
                />
              </div>
              
              <DialogFooter>
                <Button type="submit">Record Production</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Monthly Summary */}
      {Object.keys(monthlyTotals).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {format(currentMonth, 'MMMM yyyy')} Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(monthlyTotals).map(([type, data]) => (
                <div key={type} className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    {getProductionTypeIcon(type)}
                    <span className="text-sm font-medium capitalize">{type}</span>
                  </div>
                  <p className="text-lg font-bold">
                    {data.quantity.toLocaleString()} {data.unit}
                  </p>
                  {data.revenue > 0 && (
                    <p className="text-sm text-muted-foreground">
                      ₦{data.revenue.toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Production Records */}
      <div className="space-y-3">
        {productionRecords.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <TrendingUp className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No production records yet</p>
            </CardContent>
          </Card>
        ) : (
          productionRecords.slice(0, 5).map((record) => (
            <Card key={record.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={getProductionTypeColor(record.production_type)} className="flex items-center gap-1">
                      {getProductionTypeIcon(record.production_type)}
                      {record.production_type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(record.production_date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  {record.revenue && (
                    <span className="text-sm font-medium text-green-600">
                      ₦{record.revenue.toLocaleString()}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">
                      {record.quantity.toLocaleString()} {record.unit}
                    </span>
                    {record.quality_grade && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {record.quality_grade.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                  {record.market_price && (
                    <span className="text-muted-foreground">
                      ₦{record.market_price.toLocaleString()}/{record.unit}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};