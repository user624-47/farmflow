import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Building2 } from "lucide-react";

export default function SetupOrganization() {
  const [organizationName, setOrganizationName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setupOrganization } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationName.trim()) {
      setError("Organization name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error } = await setupOrganization(organizationName);
      if (error) {
        throw error;
      }
      
      // Update user metadata to mark organization as set up
      await setupOrganization(organizationName);
      
      // Redirect to dashboard after successful setup
      navigate("/")
    } catch (error: any) {
      console.error("Setup error:", error);
      setError(error.message || "Failed to set up organization. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Set Up Your Organization</CardTitle>
          <CardDescription>
            Let's get started by setting up your organization details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organization">Organization Name</Label>
              <Input
                id="organization"
                placeholder="Enter your organization name"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                required
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting Up...
                </>
              ) : (
                "Continue to Dashboard"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
