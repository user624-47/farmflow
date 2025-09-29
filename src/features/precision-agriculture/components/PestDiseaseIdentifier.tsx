import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, AlertCircle, CheckCircle, XCircle, Image as ImageIcon, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface DetectionResult {
  id: string;
  name: string;
  confidence: number;
  type: 'pest' | 'disease';
  description: string;
  treatment: string;
  prevention: string[];
}

const PestDiseaseIdentifier = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<DetectionResult[] | null>(null);
  const [activeTab, setActiveTab] = useState('camera');
  const [cropType, setCropType] = useState('');

  // Mock data - in a real app, this would come from an AI service
  const mockResults: DetectionResult[] = [
    {
      id: '1',
      name: 'Fall Armyworm',
      confidence: 92,
      type: 'pest',
      description: 'A highly destructive pest that primarily affects maize and other cereal crops.',
      treatment: 'Apply appropriate insecticides or use biological controls like parasitoids.',
      prevention: ['Early planting', 'Crop rotation', 'Use of resistant varieties']
    },
    {
      id: '2',
      name: 'Maize Lethal Necrosis Disease',
      confidence: 87,
      type: 'disease',
      description: 'A serious disease of maize caused by a combination of viruses.',
      treatment: 'Remove and destroy infected plants. Use disease-free seeds.',
      prevention: ['Plant resistant varieties', 'Control insect vectors', 'Practice crop rotation']
    }
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        analyzeImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (imageData: string) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setResults(mockResults);
    setIsLoading(false);
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
        <CardDescription>
          Upload or capture an image to identify pests and diseases affecting your crops.
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
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-gray-500 mb-4">
                  Take a clear photo of the affected plant part
                </p>
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
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-gray-500 mb-4">
                  Upload a clear image of the affected plant part
                </p>
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
                <div className="mt-4">
                  <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={image}
                      alt="Uploaded preview"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => setImage(null)}
                        className="h-8 w-8"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
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
