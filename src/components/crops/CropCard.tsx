import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import { Crop } from "@/types/crop";

interface CropCardProps {
  crop: Crop;
  onEdit: (crop: Crop) => void;
  onDelete: (id: string) => void;
  canManage: boolean;
}

export function CropCard({ crop, onEdit, onDelete, canManage }: CropCardProps) {
  const getStatusColor = (status: 'planted' | 'growing' | 'harvested' | 'failed' | 'ready_for_harvest' | 'diseased') => {
    switch (status.toLowerCase()) {
      case 'planted':
        return 'bg-blue-100 text-blue-800';
      case 'growing':
        return 'bg-green-100 text-green-800';
      case 'ready_for_harvest':
        return 'bg-yellow-100 text-yellow-800';
      case 'harvested':
        return 'bg-purple-100 text-purple-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'diseased':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {/* Image Section */}
      <div className="h-48 bg-gray-100 flex items-center justify-center">
        {crop.image_url ? (
          <img
            src={crop.image_url}
            alt={`${crop.crop_name}${crop.variety ? ' - ' + crop.variety : ''}`}
            className="h-full w-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = '/placeholder-crop.jpg';
            }}
          />
        ) : (
          <div className="text-gray-400">
            <ImageIcon className="h-12 w-12 mx-auto" />
            <span className="text-sm">No image available</span>
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{crop.crop_name}</CardTitle>
            {crop.variety && (
              <CardDescription className="text-sm">{crop.variety}</CardDescription>
            )}
          </div>
          <Badge className={getStatusColor(crop.status)}>
            {crop.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2 text-sm">
          {crop.planting_date && (
            <div className="flex items-center text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Planted: {new Date(crop.planting_date).toLocaleDateString()}</span>
            </div>
          )}
          
          {crop.expected_harvest_date && (
            <div className="text-sm text-gray-600">
              Expected: {new Date(crop.expected_harvest_date).toLocaleDateString()}
            </div>
          )}

          {crop.farm_area && (
            <div className="text-sm text-gray-600">
              Area: {crop.farm_area} {crop.unit || 'units'}
            </div>
          )}

          {crop.quantity_planted && (
            <div className="text-sm text-gray-600">
              Planted: {crop.quantity_planted} {crop.unit || 'units'}
            </div>
          )}

          {crop.quantity_harvested && (
            <div className="text-sm text-gray-600">
              Harvested: {crop.quantity_harvested} {crop.unit || 'units'}
            </div>
          )}

          {crop.notes && (
            <div className="pt-2 text-sm text-gray-600 line-clamp-2">
              {crop.notes}
            </div>
          )}
        </div>

        {canManage && (
          <div className="mt-4 flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(crop)}
              className="h-8"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(crop.id)}
              className="h-8"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
