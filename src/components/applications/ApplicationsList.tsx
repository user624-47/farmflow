import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Droplets, Bug, Leaf, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Application } from "@/types/application";

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface ApplicationsListProps {
  applications: Application[];
  onEdit: (app: Application) => void;
  onDelete: (id: string) => Promise<void>;
  loading?: boolean;
  sortConfig?: SortConfig;
  onSort?: (key: keyof Application) => void;
  getSortIndicator?: (key: keyof Application) => React.ReactNode;
}

export function ApplicationsList({ 
  applications = [], 
  onEdit, 
  onDelete, 
  loading = false, 
  sortConfig, 
  onSort, 
  getSortIndicator 
}: ApplicationsListProps) {

  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case "fertilizer":
        return <Leaf className="h-4 w-4" />;
      case "pesticide":
      case "insecticide":
        return <Bug className="h-4 w-4" />;
      default:
        return <Droplets className="h-4 w-4" />;
    }
  };

  const getProductTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      fertilizer: "default",
      pesticide: "destructive",
      herbicide: "secondary",
      fungicide: "outline",
      insecticide: "destructive",
    };
    return variants[type] || "default";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No applications found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Crop</TableHead>
            <TableHead>Farmer</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Next Due</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((application) => (
            <TableRow key={application.id}>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(application.application_date), "MMM d, yyyy")}</span>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {application.product_name}
              </TableCell>
              <TableCell>
                <Badge variant="default" className="flex items-center space-x-1 w-fit">
                  <Droplets className="h-4 w-4" />
                  <span className="capitalize">{application.application_method || 'application'}</span>
                </Badge>
              </TableCell>
              <TableCell>
                {application.crops?.crop_name || "N/A"}
              </TableCell>
              <TableCell>
                {application.farmers ? 
                  `${application.farmers.first_name} ${application.farmers.last_name}` : 
                  "N/A"
                }
              </TableCell>
              <TableCell>
                {application.quantity} {application.unit}
              </TableCell>
              <TableCell>
                {application.next_application_date ? (
                  <span className="text-sm">
                    {format(new Date(application.next_application_date), "MMM d, yyyy")}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Not set</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => onEdit(application)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onDelete(application.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}