import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Edit, Trash2, ArrowLeft, Plus, HeartPulse, Baby, Utensils, Calendar, Hash, Ruler, DollarSign, MapPin, Info, Tag, User, Users, Cake, Calendar as CalendarIcon, AlertTriangle, Droplets } from 'lucide-react';
import { useSingleLivestock } from '../hooks/useLivestock';
import { useLivestock } from '../hooks/useLivestock';
import { Livestock } from '../types';

const statusVariant = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  sick: 'bg-red-100 text-red-800',
  pregnant: 'bg-purple-100 text-purple-800',
  sold: 'bg-yellow-100 text-yellow-800',
  deceased: 'bg-gray-800 text-white',
} as const;

export const LivestockDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: livestock, isLoading, error } = useSingleLivestock(id || '');
  const { deleteLivestock } = useLivestock();
  const [activeTab, setActiveTab] = useState('overview');
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading livestock details...</span>
      </div>
    );
  }
  
  if (error || !livestock) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading livestock</h3>
            <p className="mt-1 text-sm text-red-700">
              {error instanceof Error ? error.message : 'Livestock not found'}
            </p>
            <div className="mt-4">
              <Button variant="outline" onClick={() => navigate('/livestock')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Livestock
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this livestock? This action cannot be undone.')) {
      try {
        await deleteLivestock(livestock.id);
        toast({
          title: 'Success',
          description: 'Livestock deleted successfully',
          variant: 'default',
        });
        navigate('/livestock');
      } catch (error) {
        console.error('Error deleting livestock:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete livestock. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  const renderOverviewTab = () => (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Info Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">Basic Information</CardTitle>
                <CardDescription>Details about this livestock</CardDescription>
              </div>
              <Badge className={statusVariant[livestock.status as keyof typeof statusVariant]}>
                {livestock.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <Tag className="h-4 w-4 text-muted-foreground mr-2" />
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{livestock.name || 'Unnamed'}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Info className="h-4 w-4 text-muted-foreground mr-2" />
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{livestock.animal_type || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Info className="h-4 w-4 text-muted-foreground mr-2" />
                <div>
                  <p className="text-sm text-muted-foreground">Breed</p>
                  <p className="font-medium">{livestock.breed || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <User className="h-4 w-4 text-muted-foreground mr-2" />
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium capitalize">{livestock.gender || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <CakeIcon className="h-4 w-4 text-muted-foreground mr-2" />
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{formatDate(livestock.date_of_birth)}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-muted-foreground mr-2" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{livestock.location || 'N/A'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Identification Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Identification</CardTitle>
            <CardDescription>Tags and identification details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <Hash className="h-4 w-4 text-muted-foreground mr-2" />
                <div>
                  <p className="text-sm text-muted-foreground">ID</p>
                  <p className="font-mono text-sm">{livestock.id}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Tag className="h-4 w-4 text-muted-foreground mr-2" />
                <div>
                  <p className="text-sm text-muted-foreground">Ear Tag</p>
                  <p className="font-medium">{livestock.ear_tag || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Tag className="h-4 w-4 text-muted-foreground mr-2" />
                <div>
                  <p className="text-sm text-muted-foreground">RFID Tag</p>
                  <p className="font-medium">{livestock.rfid || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 text-muted-foreground mr-2" />
                <div>
                  <p className="text-sm text-muted-foreground">Created On</p>
                  <p className="font-medium">{formatDate(livestock.created_at)}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 text-muted-foreground mr-2" />
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{formatDate(livestock.updated_at)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Health & Weight Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Health & Weight</CardTitle>
            <CardDescription>Health status and measurements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-muted-foreground mr-2" />
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={statusVariant[livestock.status as keyof typeof statusVariant]}>
                    {livestock.status}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                <div>
                  <p className="text-sm text-muted-foreground">Last Checkup</p>
                  <p className="font-medium">{formatDate(livestock.last_checkup_date)}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                <div>
                  <p className="text-sm text-muted-foreground">Next Checkup</p>
                  <p className="font-medium">{formatDate(livestock.next_checkup_date)}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Ruler className="h-4 w-4 text-muted-foreground mr-2" />
                <div>
                  <p className="text-sm text-muted-foreground">Weight</p>
                  <p className="font-medium">
                    {livestock.weight ? `${livestock.weight} ${livestock.weight_unit || 'kg'}` : 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Droplets className="h-4 w-4 text-muted-foreground mr-2" />
                <div>
                  <p className="text-sm text-muted-foreground">Color/Markings</p>
                  <p className="font-medium">{livestock.color || 'N/A'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Notes Card */}
      {livestock.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              {livestock.notes.split('\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
  
  const renderHealthTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Health Records</h3>
        <Button size="sm" onClick={() => navigate(`/livestock/${id}/health/new`)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Health Record
        </Button>
      </div>
      
      {livestock.health_records && livestock.health_records.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Diagnosis</TableHead>
                <TableHead>Treatment</TableHead>
                <TableHead>Medication</TableHead>
                <TableHead>Next Checkup</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {livestock.health_records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{formatDate(record.date)}</TableCell>
                  <TableCell className="font-medium">{record.diagnosis}</TableCell>
                  <TableCell>{record.treatment}</TableCell>
                  <TableCell>{record.medication || 'N/A'}</TableCell>
                  <TableCell>{formatDate(record.next_checkup_date)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="rounded-md border border-dashed p-8 text-center">
          <HeartPulse className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No health records found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start by adding a health record for this livestock.
          </p>
          <Button onClick={() => navigate(`/livestock/${id}/health/new`)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Health Record
          </Button>
        </div>
      )}
    </div>
  );
  
  const renderBreedingTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Breeding Records</h3>
        <Button size="sm" onClick={() => navigate(`/livestock/${id}/breeding/new`)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Breeding Record
        </Button>
      </div>
      
      {livestock.breeding_records && livestock.breeding_records.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Breeding Date</TableHead>
                <TableHead>Expected Birth</TableHead>
                <TableHead>Actual Birth</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {livestock.breeding_records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{formatDate(record.breeding_date)}</TableCell>
                  <TableCell>{formatDate(record.expected_birth_date)}</TableCell>
                  <TableCell>{formatDate(record.actual_birth_date)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="rounded-md border border-dashed p-8 text-center">
          <Baby className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No breeding records found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start by adding a breeding record for this livestock.
          </p>
          <Button onClick={() => navigate(`/livestock/${id}/breeding/new`)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Breeding Record
          </Button>
        </div>
      )}
    </div>
  );
  
  const renderFeedingTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Feeding Records</h3>
        <Button size="sm" onClick={() => navigate(`/livestock/${id}/feeding/new`)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Feeding Record
        </Button>
      </div>
      
      {livestock.feeding_records && livestock.feeding_records.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Feed Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {livestock.feeding_records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{formatDate(record.feeding_time)}</TableCell>
                  <TableCell className="font-medium">{record.feed_type}</TableCell>
                  <TableCell>{record.quantity} {record.unit}</TableCell>
                  <TableCell>{record.notes || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="rounded-md border border-dashed p-8 text-center">
          <Utensils className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No feeding records found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start by adding a feeding record for this livestock.
          </p>
          <Button onClick={() => navigate(`/livestock/${id}/feeding/new`)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Feeding Record
          </Button>
        </div>
      )}
    </div>
  );
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/livestock')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Livestock
          </Button>
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold tracking-tight">
              {livestock.name || 'Unnamed Livestock'}
            </h1>
            <Badge className={statusVariant[livestock.status as keyof typeof statusVariant]}>
              {livestock.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {livestock.animal_type} • {livestock.breed || 'Unknown breed'}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/livestock/${id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="breeding">Breeding</TabsTrigger>
          <TabsTrigger value="feeding">Feeding</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="overview">
            {renderOverviewTab()}
          </TabsContent>
          
          <TabsContent value="health">
            {renderHealthTab()}
          </TabsContent>
          
          <TabsContent value="breeding">
            {renderBreedingTab()}
          </TabsContent>
          
          <TabsContent value="feeding">
            {renderFeedingTab()}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default LivestockDetail;
