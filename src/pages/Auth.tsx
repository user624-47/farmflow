import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, User as UserIcon, Lock, Mail, Eye, EyeOff, ChevronRight, Leaf, Users, Brain, BarChart, Activity, Zap, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

// Background animation component
const BackgroundAnimation = () => (
  <div className="absolute inset-0 overflow-hidden -z-10">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/5 animate-gradient" />
    <div className="absolute inset-0 bg-grid-pattern opacity-5" />
  </div>
);

// Form input component
const FormInput = ({ 
  id, 
  label, 
  type = 'text', 
  icon: Icon, 
  value, 
  onChange, 
  placeholder = '',
  required = true,
  showPasswordToggle = false,
  onTogglePassword = () => {}
}: {
  id: string;
  label: string;
  type?: string;
  icon: React.ElementType;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  showPasswordToggle?: boolean;
  onTogglePassword?: () => void;
}) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="text-sm font-medium text-muted-foreground">
      {label}
    </Label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <Input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={cn(
          "pl-10 pr-10 h-11 rounded-lg bg-background/50 backdrop-blur-sm border-border/50",
          "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
          "transition-all duration-200"
        )}
      />
      {showPasswordToggle && (
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
          tabIndex={-1}
        >
          {type === 'password' ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  </div>
);

const Auth = () => {
  const { user, loading, signIn, signUp, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    organizationName: "",
  });
  const [formErrors, setFormErrors] = useState({
    email: "",
    password: "",
    organizationName: "",
  });

  // Reset form when switching tabs
  useEffect(() => {
    setFormData({
      email: "",
      password: "",
      organizationName: "",
    });
    setFormErrors({
      email: "",
      password: "",
      organizationName: "",
    });
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Leaf className="h-12 w-12 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading your farm dashboard...</p>
        </div>
      </div>
    );
  }

  if (user) {
    // If user is authenticated but organization is not set up, redirect to setup
    if (user.user_metadata?.organization_setup_complete === false) {
      return <Navigate to="/setup-organization" replace />;
    }
    // Otherwise, redirect to dashboard
    return <Navigate to="/" replace />;
  }

  const validateForm = (isSignUp = false) => {
    const errors = {
      email: "",
      password: "",
      organizationName: "",
    };

    let isValid = true;

    if (!formData.email) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!formData.password) {
      errors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    if (isSignUp && !formData.organizationName) {
      errors.organizationName = "Organization name is required";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;
    
    setIsLoading(true);
    try {
      await signIn(formData.email, formData.password);
    } catch (error) {
      console.error("Sign in error:", error);
      // Error handling is done in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to login page after successful sign out
      window.location.href = '/auth';
    } catch (error) {
      console.error('Sign out error:', error);
      // If you want to show an error to the user, you can use a toast notification
      // toast({
      //   title: "Error",
      //   description: "Failed to sign out. Please try again.",
      //   variant: "destructive",
      // });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(true)) return;
    
    setIsLoading(true);
    try {
      await signUp(formData.email, formData.password, formData.organizationName);
    } catch (error) {
      console.error("Sign up error:", error);
      // Error handling is done in the auth context
    } finally {
      setIsLoading(false);
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <BackgroundAnimation />
      
      {/* Left Side - Image (70%) */}
      <div className="hidden md:flex md:w-[70%] bg-muted/50 relative overflow-hidden">
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60 z-10" />
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent z-10" />
        <img
          src="/images/farm-landscape.jpg"
          alt="Farm landscape"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex flex-col justify-end p-12 z-20 text-white">
          <div className="max-w-2xl">
            <h2 className="text-5xl font-bold mb-6 leading-tight">Welcome to FarmFlow</h2>
            <p className="text-xl text-white/90 mb-6 leading-relaxed">
              Harness the power of AI to revolutionize your farming. Our intelligent platform provides:
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <BarChart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Real-time Crop Analysis</h4>
                  <p className="text-white/80 text-sm">AI-powered monitoring for optimal growth conditions</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Livestock Health Tracking</h4>
                  <p className="text-white/80 text-sm">Predictive insights for healthier animals</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Smart Recommendations</h4>
                  <p className="text-white/80 text-sm">Data-driven decisions for maximum yield</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/10">
              <Zap className="h-5 w-5 text-yellow-400" />
              <span className="text-sm font-medium tracking-wider text-yellow-100">POWERED BY OPENAI TECHNOLOGY</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Side - Login Form (30%) */}
      <div className="w-full md:w-[30%] flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Welcome to FarmFlow
          </h1>
          <p className="mt-2 text-muted-foreground">
            {activeTab === 'signin' 
              ? 'Sign in to manage your farm operations' 
              : 'Create your account to get started'}
          </p>
        </div>

        {/* Auth Tabs */}
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger 
              value="signin" 
              className="relative z-10 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Sign In
            </TabsTrigger>
            <TabsTrigger 
              value="signup" 
              className="relative z-10 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Create Account
            </TabsTrigger>
          </TabsList>

          {/* Sign In Form */}
          <TabsContent value="signin" className="mt-6">
            <Card className="border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden">
              <CardContent className="pt-6 space-y-4">
                <form onSubmit={handleSignIn} className="space-y-5">
                  <FormInput
                    id="email"
                    label="Email address"
                    type="email"
                    icon={Mail}
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="you@example.com"
                  />
                  {formErrors.email && (
                    <p className="text-sm text-destructive -mt-3">{formErrors.email}</p>
                  )}
                  
                  <FormInput
                    id="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    icon={Lock}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    showPasswordToggle
                    onTogglePassword={togglePasswordVisibility}
                  />
                  {formErrors.password && (
                    <p className="text-sm text-destructive -mt-3">{formErrors.password}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor="remember-me" className="ml-2 text-muted-foreground">
                        Remember me
                      </label>
                    </div>
                    <a 
                      href="#" 
                      className="font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      Forgot password?
                    </a>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-11 font-medium rounded-lg bg-primary hover:bg-primary/90 transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
                
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-background text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" type="button" className="h-10">
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google
                  </Button>
                  <Button variant="outline" type="button" className="h-10">
                    <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                    Twitter
                  </Button>
                </div>
              </CardContent>
              
              <CardFooter className="bg-muted/30 px-6 py-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground text-center w-full">
                  Don't have an account?{' '}
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('signup')}
                    className="font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Sign up
                  </button>
                </p>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Sign Up Form */}
          <TabsContent value="signup" className="mt-6">
            <Card className="border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden">
              <CardContent className="pt-6 space-y-4">
                <form onSubmit={handleSignUp} className="space-y-5">
                  <FormInput
                    id="organizationName"
                    label="Organization Name"
                    type="text"
                    icon={Users}
                    value={formData.organizationName}
                    onChange={handleInputChange}
                    placeholder="Your farm or business name"
                  />
                  {formErrors.organizationName && (
                    <p className="text-sm text-destructive -mt-3">{formErrors.organizationName}</p>
                  )}
                  
                  <FormInput
                    id="email"
                    label="Email address"
                    type="email"
                    icon={Mail}
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="you@example.com"
                  />
                  {formErrors.email && (
                    <p className="text-sm text-destructive -mt-3">{formErrors.email}</p>
                  )}
                  
                  <FormInput
                    id="password"
                    label="Create Password"
                    type={showPassword ? 'text' : 'password'}
                    icon={Lock}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    showPasswordToggle
                    onTogglePassword={togglePasswordVisibility}
                  />
                  {formErrors.password && (
                    <p className="text-sm text-destructive -mt-3">{formErrors.password}</p>
                  )}
                  
                  <div className="text-sm text-muted-foreground">
                    <p>Password must be at least 6 characters long</p>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="terms"
                        name="terms"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        required
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="terms" className="text-muted-foreground">
                        I agree to the{' '}
                        <a href="#" className="font-medium text-primary hover:text-primary/80">
                          Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="#" className="font-medium text-primary hover:text-primary/80">
                          Privacy Policy
                        </a>
                        .
                      </label>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-11 font-medium rounded-lg bg-primary hover:bg-primary/90 transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </CardContent>
              
              <CardFooter className="bg-muted/30 px-6 py-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground text-center w-full">
                  Already have an account?{' '}
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('signin')}
                    className="font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Sign in
                  </button>
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} FarmFlow. All rights reserved.</p>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Auth;