import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Edit, Trash2, Eye, HeartPulse, Baby, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
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

export const LivestockList: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [breedFilter, setBreedFilter] = useState<string>('');
  
  const pageSize = 10;
  
  const { 
    livestock, 
    pagination, 
    stats, 
    isLoading, 
    error, 
    deleteLivestock,
    searchLivestock 
  } = useLivestock(
    { 
      status: statusFilter, 
      breed: breedFilter,
      search: searchTerm 
    },
    page,
    pageSize
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
    searchLivestock(e.target.value);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this livestock?')) {
      try {
        await deleteLivestock(id);
        toast({
          title: 'Success',
          description: 'Livestock deleted successfully',
          variant: 'default',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete livestock',
          variant: 'destructive',
        });
      }
    }
  };

  const handleViewDetails = (id: string) => {
    navigate(`/livestock/${id}`);
  };

  const handleAddHealthRecord = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigate(`/livestock/${id}/health/new`);
  };

  const handleAddBreedingRecord = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigate(`/livestock/${id}/breeding/new`);
  };

  const handleAddFeedingRecord = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigate(`/livestock/${id}/feeding/new`);
  };

  const handleEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigate(`/livestock/${id}/edit`);
  };

  // Memoize the breeds for the filter dropdown
  const breeds: string[] = useMemo(() => {
    if (!livestock) return [];
    const uniqueBreeds = new Set<string>();
    livestock.forEach(animal => {
      if (animal.breed) {
        uniqueBreeds.add(animal.breed);
      }
    });
    return Array.from(uniqueBreeds);
  }, [livestock]);

  if (error) {
    return (
      <div className="p-4">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading livestock</h3>
              <p className="mt-1 text-sm text-red-700">
                {error instanceof Error ? error.message : 'An unknown error occurred'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Livestock Management</h2>
          <p className="text-muted-foreground">
            Manage your livestock inventory and records
          </p>
        </div>
        <Button onClick={() => navigate('/livestock/new')}>
          <Plus className="mr-2 h-4 w-4" /> Add Livestock
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Livestock</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Total animals in your inventory
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byStatus.active || 0}</div>
              <p className="text-xs text-muted-foreground">
                Currently active animals
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pregnant</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byStatus.pregnant || 0}</div>
              <p className="text-xs text-muted-foreground">
                Pregnant animals
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sick</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byStatus.sick || 0}</div>
              <p className="text-xs text-muted-foreground">
                Animals needing attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search livestock..."
                className="w-full rounded-lg bg-background pl-8"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 pl-8 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  {Object.entries(statusVariant).map(([status]) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 pl-8 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={breedFilter}
                  onChange={(e) => setBreedFilter(e.target.value)}
                >
                  <option value="">All Breeds</option>
                  {breeds.map((breed: string) => (
                    <option key={breed} value={breed}>
                      {breed}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Breed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Checkup</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Skeleton loading state
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : livestock && livestock.length > 0 ? (
                  // Actual data
                  livestock.map((animal) => (
                    <TableRow 
                      key={animal.id} 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleViewDetails(animal.id)}
                    >
                      <TableCell className="font-medium">{animal.id.split('-')[0]}</TableCell>
                      <TableCell className="font-medium">{animal.name || 'Unnamed'}</TableCell>
                      <TableCell>{animal.animal_type}</TableCell>
                      <TableCell>{animal.breed || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge 
                          className={`${
                            statusVariant[animal.status as keyof typeof statusVariant] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {animal.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{animal.location || 'N/A'}</TableCell>
                      <TableCell>
                        {animal.last_checkup_date 
                          ? new Date(animal.last_checkup_date).toLocaleDateString() 
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 p-0 hover:bg-blue-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(animal.id);
                            }}
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 p-0 hover:bg-green-100"
                            onClick={(e) => handleAddHealthRecord(e, animal.id)}
                            title="Add Health Record"
                          >
                            <HeartPulse className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 p-0 hover:bg-purple-100"
                            onClick={(e) => handleAddBreedingRecord(e, animal.id)}
                            title="Add Breeding Record"
                          >
                            <Baby className="h-4 w-4 text-purple-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 p-0 hover:bg-yellow-100"
                            onClick={(e) => handleAddFeedingRecord(e, animal.id)}
                            title="Add Feeding Record"
                          >
                            <Utensils className="h-4 w-4 text-yellow-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(e, animal.id);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 p-0 hover:bg-red-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(animal.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No livestock found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {pagination && pagination.total > 0 && (
            <div className="mt-4 flex items-center justify-between px-2">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-medium">
                  {Math.min((page - 1) * pageSize + 1, pagination.total)}
                </span> to{' '}
                <span className="font-medium">
                  {Math.min(page * pageSize, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> livestock
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * pageSize >= (pagination?.total || 0) || isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LivestockList;
