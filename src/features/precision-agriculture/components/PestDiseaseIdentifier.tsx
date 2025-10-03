import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, AlertCircle, CheckCircle, XCircle, Image as ImageIcon, Loader2, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { analyzePlantImage, preprocessImage } from "@/services/aiService";
import { useToast } from "@/components/ui/use-toast";

interface DetectionResult {
  id: string;
  name: string;
  confidence: number;
  type: 'pest' | 'disease' | 'unknown';
  description: string;
  treatment: string;
  prevention: string[];
}

const MAX_FILE_SIZE_MB = 5;
const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

const PestDiseaseIdentifier = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<DetectionResult[] | null>(null);
  const [activeTab, setActiveTab] = useState('camera');
  const [cropType, setCropType] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Reset error when switching tabs
  useEffect(() => {
    setError(null);
  }, [activeTab]);

  const validateImage = (file: File): { valid: boolean; message?: string } => {
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      return { 
        valid: false, 
        message: 'Unsupported file format. Please upload a JPEG, PNG, or WebP image.' 
      };
    }
    
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return { 
        valid: false, 
        message: `File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.` 
      };
    }
    
    return { valid: true };
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImage(file);
    if (!validation.valid) {
      setError(validation.message || 'Invalid image');
      toast({
        title: 'Invalid Image',
        description: validation.message,
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Preprocess the image (resize, compress, etc.)
      const processedImage = await preprocessImage(file);
      setImage(processedImage);
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to process image. Please try another one.');
      toast({
        title: 'Processing Error',
        description: 'Failed to process the image. Please try another one.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // Preprocess the captured image
      const processedImage = await preprocessImage(file);
      setImage(processedImage);
      
      // Auto-analyze after capture
      await analyzeImage(processedImage);
    } catch (err) {
      console.error('Error processing captured image:', err);
      setError('Failed to process the captured image.');
      toast({
        title: 'Capture Error',
        description: 'Failed to process the captured image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeImage = async (imageData: string) => {
    if (!imageData) {
      setError('No image to analyze');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const { success, results: analysisResults, error: analysisError } = 
        await analyzePlantImage(imageData, cropType || undefined);
      
      if (!success || !analysisResults) {
        throw new Error(analysisError || 'Failed to analyze image');
      }
      
      setResults(analysisResults);
      
      if (analysisResults.length === 0) {
        toast({
          title: 'No issues detected',
          description: 'No pests or diseases were detected in the image.',
        });
      }
      
    } catch (err) {
      console.error('Analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze image';
      setError(errorMessage);
      toast({
        title: 'Analysis Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (image) {
      analyzeImage(image);
    }
  };

  const handleRetake = () => {
    setImage(null);
    setResults(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          Pest & Disease Identification
        </CardTitle>
        <CardDescription className="space-y-1">
          <p>Upload or capture an image to identify pests and diseases affecting your crops.</p>
          <p className="text-xs text-muted-foreground">
            Supported formats: JPG, PNG, WebP (max {MAX_FILE_SIZE_MB}MB)
          </p>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!image ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="camera">Take Photo</TabsTrigger>
              <TabsTrigger value="upload">Upload Image</TabsTrigger>
            </TabsList>
            <TabsContent value="camera" className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-gray-500 mb-4">
                  Take a clear, well-lit photo of the affected plant part
                </p>
                {error && activeTab === 'camera' && (
                  <Alert variant="destructive" className="mb-4 text-left">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                )}
                <div className="relative">
                  <Button asChild variant="outline" className="relative">
                    <Label htmlFor="camera-input" className="cursor-pointer">
                      <Camera className="mr-2 h-4 w-4" />
                      Open Camera
                      <Input
                        id="camera-input"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="sr-only"
                        onChange={handleCapture}
                      />
                    </Label>
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="upload" className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-gray-500 mb-4">
                  Upload a clear, well-lit image of the affected plant part
                </p>
                {error && activeTab === 'upload' && (
                  <Alert variant="destructive" className="mb-4 text-left">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                )}
                <div className="relative">
                  <Button asChild variant="outline" className="relative">
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      Choose Image
                      <Input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleImageUpload}
                      />
                    </Label>
                  </Button>
                </div>
              </div>
              {image && (
                <div className="mt-4 space-y-4">
                  <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border">
                    <img
                      src={image}
                      alt="Uploaded preview"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                      {isLoading && (
                        <div className="flex flex-col items-center text-white bg-black/50 p-3 rounded-lg">
                          <Loader2 className="h-6 w-6 animate-spin mb-1" />
                          <span className="text-xs">Processing...</span>
                        </div>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setImage(null);
                          setResults(null);
                          setError(null);
                        }}
                        className="h-8 w-8 bg-white/80 hover:bg-white/100"
                        disabled={isLoading}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                
                  <div className="text-xs text-muted-foreground text-center">
                    Ensure the affected area is clearly visible and well-lit
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="crop-type" className="block text-sm font-medium mb-2">
                      Crop Type (Optional)
                    </Label>
                    <Input
                      id="crop-type"
                      placeholder="e.g., Maize, Cassava, Rice"
                      value={cropType}
                      onChange={(e) => setCropType(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full mt-4"
                    onClick={() => analyzeImage(image)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Analyze Image'
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Analyzing your image...</p>
            <p className="text-sm text-muted-foreground">This may take a few moments</p>
          </div>
        ) : results ? (
          <div className="space-y-6">
            <div className="relative rounded-lg overflow-hidden border">
              <img
                src={image}
                alt="Analysis result"
                className="w-full max-h-64 object-cover"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-white/80 hover:bg-white/90"
                onClick={handleRetake}
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Detection Results</h3>
              
              {results.map((result) => (
                <Alert key={result.id} className="text-left">
                  {result.type === 'pest' ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                  <AlertTitle className="flex items-center gap-2">
                    {result.name}
                    <Badge 
                      variant={result.confidence > 80 ? 'default' : 'secondary'}
                      className="ml-2"
                    >
                      {result.confidence}% confidence
                    </Badge>
                  </AlertTitle>
                  <AlertDescription className="mt-2 space-y-2">
                    <p>{result.description}</p>
                    
                    <div className="mt-3">
                      <h4 className="font-medium text-sm mb-1">Recommended Treatment:</h4>
                      <p className="text-sm">{result.treatment}</p>
                    </div>
                    
                    <div className="mt-3">
                      <h4 className="font-medium text-sm mb-1">Prevention Tips:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {result.prevention.map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}

              <div className="pt-2">
                <Button variant="outline" className="w-full" onClick={handleRetake}>
                  Analyze Another Image
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default PestDiseaseIdentifier;
