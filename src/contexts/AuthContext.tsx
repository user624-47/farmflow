import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  organizationId: string | null;
  organization: Organization | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, organizationName?: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
  setupOrganization: (organizationName?: string) => Promise<{ error?: any }>;
  updateOrganization: (updates: Partial<Organization>) => Promise<Organization>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const updateOrganization = async (updates: Partial<Organization>) => {
    if (!organizationId) return;
    
    try {
      const { data, error } = await supabase
        .from("organizations")
        .update(updates)
        .eq("id", organizationId)
        .select()
        .single();
      
      if (error) throw error;
      
      setOrganization(data);
      return data;
    } catch (error) {
      console.error("Error updating organization:", error);
      throw error;
    }
  };

  const refreshUserRole = async () => {
    if (!user) {
      console.log("No user, skipping role refresh");
      return;
    }
    
    console.log("Refreshing user role for user:", user.id);
    
    try {
      // First get the user role and organization ID
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select(`
          role, 
          organization_id
        `)
        .eq("user_id", user.id)
        .maybeSingle();
      
      console.log("User role fetch result:", { roleData, roleError });
      
      if (roleError) {
        console.error("Error fetching user role:", roleError);
        return;
      }
      
      if (roleData) {
        setUserRole(roleData.role);
        setOrganizationId(roleData.organization_id);
        
        // If we have an organization ID, fetch the full organization data
        if (roleData.organization_id) {
          console.log("Fetching organization data for ID:", roleData.organization_id);
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', roleData.organization_id)
            .maybeSingle();
            
          if (orgError) {
            console.error("Error fetching organization:", orgError);
          } else if (orgData) {
            console.log("Setting organization data:", orgData);
            setOrganization(orgData);
          } else {
            console.log("No organization data found for ID:", roleData.organization_id);
            setOrganization(null);
          }
        } else {
          console.log("No organization ID found in user role");
          setOrganization(null);
        }
      } else {
        console.log("No role data found for user:", user.id);
        setUserRole(null);
        setOrganizationId(null);
        setOrganization(null);
      }
    } catch (error) {
      console.error("Error in refreshUserRole:", error);
    }
  };
  const setupOrganization = async (organizationName?: string) => {
    if (!user) return { error: new Error("User not authenticated") };
    
    try {
      console.log("Setting up organization...");
      const { data: organizationId, error } = await supabase.rpc('setup_organization_with_admin', {
        org_name: organizationName || 'My Organization'
      });
      
      if (error) {
        console.error("Error setting up organization:", error);
        return { error };
      }
      
      console.log("Organization created with ID:", organizationId);
      
      // Manually set the organization in the state
      if (organizationId) {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', organizationId)
          .single();
          
        if (orgError) {
          console.error("Error fetching organization:", orgError);
          return { error: orgError };
        }
        
        setOrganization(orgData);
        setOrganizationId(organizationId);
      }
      
      // Refresh role after organization setup
      await refreshUserRole();
      return { error: null };
    } catch (error) {
      console.error("Error in setupOrganization:", error);
      return { error };
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer role fetching to avoid blocking auth state change
          setTimeout(async () => {
            await refreshUserRole();
          }, 0);
        } else {
          setUserRole(null);
          setOrganizationId(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(async () => {
          await refreshUserRole();
        }, 0);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: "Sign In Error",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      // After successful login, fetch the user's organization status
      if (data.user) {
        const { data: userData, error: userError } = await supabase
          .from('user_roles')
          .select('organization_id')
          .eq('user_id', data.user.id)
          .single();

        if (!userError && userData) {
          // Update user metadata with organization status
          await supabase.auth.updateUser({
            data: { 
              organization_setup_complete: !!userData.organization_id 
            }
          });
        }
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
      
      return { error: null };
    } catch (error) {
      console.error("Sign in error:", error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, organizationName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            organization_name: organizationName,
            organization_setup_complete: false // Initialize as not set up
          }
        }
      });
      
      if (error) {
        toast({
          title: "Sign Up Error",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      // If email confirmation is disabled, set up organization immediately
      if (data.user && !data.user.email_confirmed_at && data.session) {
        const setupResult = await setupOrganization(organizationName);
        if (setupResult.error) {
          console.error("Failed to setup organization:", setupResult.error);
        } else {
          // Update organization setup status after successful setup
          await supabase.auth.updateUser({
            data: { organization_setup_complete: true }
          });
        }
      }
      
      toast({
        title: "Account Created!",
        description: data.user?.email_confirmed_at 
          ? "Welcome! Your organization has been set up." 
          : "Please check your email to confirm your account.",
      });
      
      return { error: null, user: data.user };
    } catch (error) {
      console.error("Sign up error:", error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Sign Out Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signed Out",
          description: "You have been signed out successfully.",
        });
      }
      setUserRole(null);
      setOrganizationId(null);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const value = {
    user,
    session,
    userRole,
    organizationId,
    organization,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUserRole,
    setupOrganization,
    updateOrganization,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}