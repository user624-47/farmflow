import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Settings as SettingsIcon, Users, Building, UserPlus, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";
// Using dynamic import with React.lazy for Vite
import { lazy, Suspense } from 'react';

// Dynamically import the map component to avoid SSR issues with the Google Maps API
const LocationMap = lazy(() => import('../components/maps/LocationMapBox'));

interface Organization {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  subscription_plan: string;
  subscription_status: string;
  subscription_end: string;
  created_at: string;
  updated_at: string;
  [key: string]: any; // Add index signature to allow any string key
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profiles?: {
    display_name?: string;
  };
}

const Settings = () => {
  const { userRole, organizationId, organization: orgFromContext, updateOrganization: updateOrgInContext } = useAuth();
  console.log('Settings - Auth Context:', { userRole, organizationId, orgFromContext });
  
  const [organization, setOrganization] = useState<Organization | null>(orgFromContext || null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [orgFormData, setOrgFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    latitude: null as number | null,
    longitude: null as number | null
  });
  
  const [locationData, setLocationData] = useState({
    address: "",
    latitude: null as number | null,
    longitude: null as number | null,
  });
  
  const [showMap, setShowMap] = useState(false);
  const [userFormData, setUserFormData] = useState({
    email: "",
    role: "farmer" as "admin" | "extension_officer" | "farmer"
  });
  
  // Debug effect to track state changes
  useEffect(() => {
    console.log('Settings - State Updated:', {
      userRole,
      organizationId,
      organization,
      loading,
      userRoles
    });
  }, [userRole, organizationId, organization, loading, userRoles]);

  // Fetch user roles when the component mounts or organizationId changes
  const fetchUserRoles = useCallback(async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    
    try {
      console.log('Fetching user roles for organization:', organizationId);
      
      // First, get all user roles for the organization
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('organization_id', organizationId);
      
      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        throw rolesError;
      }
      
      console.log('Fetched user roles:', rolesData);
      
      if (!rolesData || rolesData.length === 0) {
        console.log('No user roles found for organization:', organizationId);
        setUserRoles([]);
        setLoading(false);
        return;
      }
      
      // For now, just use the basic role data without profile information
      const basicUserRoles = rolesData.map(role => ({
        ...role,
        profiles: {
          display_name: `User ${role.user_id?.substring(0, 6) || ''}`,
          email: role.user_id || ''
        }
      }));
      
      console.log('Processed user roles:', basicUserRoles);
      setUserRoles(basicUserRoles);
    } catch (error) {
      console.error('Error in fetchUserRoles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user roles',
        variant: 'destructive',
      });
      setUserRoles([]); // Set empty array to prevent undefined errors
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchUserRoles();
    }
  }, [userRole, organizationId, fetchUserRoles]);

  const updateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) return;
    
    try {
      const updates = {
        name: orgFormData.name,
        email: orgFormData.email,
        phone: orgFormData.phone,
        address: orgFormData.address,
        latitude: orgFormData.latitude,
        longitude: orgFormData.longitude,
      };
      
      await updateOrgInContext(updates);
      
      toast({
        title: "Success",
        description: "Organization details updated successfully",
      });
      
      setIsOrgDialogOpen(false);
    } catch (error) {
      console.error("Error updating organization:", error);
      toast({
        title: "Error",
        description: "Failed to update organization details",
        variant: "destructive",
      });
    }
  };

  const handleOrgFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setOrgFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Update form data when organization data changes
  useEffect(() => {
    if (orgFromContext) {
      setOrgFormData({
        name: orgFromContext.name || "",
        email: orgFromContext.email || "",
        phone: orgFromContext.phone || "",
        address: orgFromContext.address || "",
        latitude: orgFromContext.latitude || null,
        longitude: orgFromContext.longitude || null,
      });
      
      setLocationData({
        address: orgFromContext.address || "",
        latitude: orgFromContext.latitude || null,
        longitude: orgFromContext.longitude || null,
      });
    }
  }, [orgFromContext]);
  
  const handleLocationSelect = useCallback(({ lat, lng, address }: { lat: number; lng: number; address: string }) => {
    setLocationData({
      address,
      latitude: lat,
      longitude: lng
    });
    
    setOrgFormData(prev => ({
      ...prev,
      address,
      latitude: lat,
      longitude: lng
    }));
  }, []);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) return;

    try {
      // In a real application, you would:
      // 1. Send an invitation email to the user
      // 2. Create a pending invitation record
      // 3. When they accept, create their user account and role
      
      // For this demo, we'll just show a success message
      toast({ 
        title: "Invitation Sent", 
        description: `Invitation sent to ${userFormData.email} with role: ${userFormData.role}` 
      });
      setIsUserDialogOpen(false);
      setUserFormData({ email: "", role: "farmer" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this user from the organization?")) return;

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("organization_id", organizationId);

      if (error) throw error;
      toast({ title: "Success", description: "User removed successfully" });
      fetchUserRoles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "default";
      case "extension_officer": return "secondary";
      case "farmer": return "outline";
      default: return "secondary";
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-96 bg-gray-100 rounded"></div>
        </div>
        <div className="space-y-4">
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto"></div>
              <p className="text-sm text-gray-500">Loading settings...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check for admin access
  if (userRole !== "admin") {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Access restricted to administrators
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <SettingsIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground text-center">
              You need administrator privileges to access organization settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Farm Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization and user permissions
        </p>
      </div>

      <Tabs defaultValue="organization" className="space-y-4">
        <TabsList>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Organization Details
                  </CardTitle>
                  <CardDescription>
                    Manage your organization information and settings
                  </CardDescription>
                </div>
                <Dialog open={isOrgDialogOpen} onOpenChange={setIsOrgDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Organization
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Organization</DialogTitle>
                      <DialogDescription>
                        Update your organization information
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={updateOrganization} className="space-y-4">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Organization Name</Label>
                            <Input
                              id="name"
                              name="name"
                              value={orgFormData.name}
                              onChange={handleOrgFormChange}
                              placeholder="Enter organization name"
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={orgFormData.email}
                              onChange={handleOrgFormChange}
                              placeholder="Enter organization email"
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                              id="phone"
                              name="phone"
                              type="tel"
                              value={orgFormData.phone}
                              onChange={handleOrgFormChange}
                              placeholder="Enter contact number"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <div className="flex space-x-2">
                              <Input
                                id="address"
                                name="address"
                                value={orgFormData.address}
                                onChange={handleOrgFormChange}
                                placeholder="Enter full address"
                                className="flex-1"
                              />
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="icon"
                                title="Use map to set address"
                                onClick={() => setShowMap(!showMap)}
                              >
                                <MapPin className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {showMap && (
                            <div className="mt-2 h-64 rounded-md overflow-hidden border">
                              <Suspense fallback={<div className="h-full flex items-center justify-center">Loading map...</div>}>
                                <LocationMap 
                                  onLocationSelect={(location) => {
                                    setOrgFormData(prev => ({
                                      ...prev,
                                      latitude: location.lat,
                                      longitude: location.lng,
                                      address: location.address
                                    }));
                                    setShowMap(false);
                                  }}
                                  initialPosition={orgFormData.latitude && orgFormData.longitude ? 
                                    { lat: orgFormData.latitude, lng: orgFormData.longitude } : undefined
                                  }
                                  initialAddress={orgFormData.address}
                                />
                              </Suspense>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                              <Label htmlFor="latitude">Latitude</Label>
                              <Input
                                id="latitude"
                                name="latitude"
                                type="number"
                                step="0.000001"
                                value={orgFormData.latitude || ''}
                                onChange={(e) => setOrgFormData({
                                  ...orgFormData, 
                                  latitude: e.target.value ? parseFloat(e.target.value) : null
                                })}
                                placeholder="e.g. 9.0820"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="longitude">Longitude</Label>
                              <Input
                                id="longitude"
                                name="longitude"
                                type="number"
                                step="0.000001"
                                value={orgFormData.longitude || ''}
                                onChange={(e) => setOrgFormData({
                                  ...orgFormData, 
                                  longitude: e.target.value ? parseFloat(e.target.value) : null
                                })}
                                placeholder="e.g. 8.6753"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <DialogFooter className="mt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsOrgDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">Save Changes</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {organization && (
                <div className="space-y-4">
                  <div>
                    <Label>Organization Name</Label>
                    <p className="text-lg font-medium">{organization.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Email</Label>
                      <p>{organization.email}</p>
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <p>{organization.phone || "Not provided"}</p>
                    </div>
                  </div>
                  <div>
                    <Label>Address</Label>
                    <p>{organization.address || "Not provided"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Subscription Plan</Label>
                      <Badge variant="outline">{organization.subscription_plan}</Badge>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Badge variant={organization.subscription_status === "active" ? "default" : "secondary"}>
                        {organization.subscription_status}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Management
                  </CardTitle>
                  <CardDescription>
                    Manage users and their roles in your organization
                  </CardDescription>
                </div>
                <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite New User</DialogTitle>
                      <DialogDescription>
                        Send an invitation to join your organization
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleInviteUser} className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={userFormData.email}
                          onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select value={userFormData.role} onValueChange={(value: any) => setUserFormData({...userFormData, role: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="farmer">Farmer</SelectItem>
                            <SelectItem value="extension_officer">Extension Officer</SelectItem>
                            <SelectItem value="admin">Administrator</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <Button type="submit">Send Invitation</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userRoles.map((userRole) => (
                  <div key={userRole.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                      <p className="font-medium">
                        User ID: {userRole.user_id}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getRoleBadgeVariant(userRole.role)}>
                          {userRole.role.replace("_", " ").toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Added {new Date(userRole.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveUser(userRole.user_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {userRoles.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    No users found. Start by inviting team members to your organization.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;