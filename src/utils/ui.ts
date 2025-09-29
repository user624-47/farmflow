import { VariantProps } from 'class-variance-authority';
import { badgeVariants } from '@/components/ui/badge';

type StatusVariant = VariantProps<typeof badgeVariants>['variant'];

export const getStatusColor = (status: string): StatusVariant => {
  if (!status) return 'secondary';
  
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('healthy') || statusLower.includes('completed') || statusLower === 'harvested') {
    return 'default';
  }
  
  if (statusLower.includes('growing') || statusLower === 'ready_for_harvest') {
    return 'secondary';
  }
  
  if (statusLower.includes('warning') || statusLower.includes('failed') || statusLower.includes('diseased')) {
    return 'destructive';
  }
  
  // Default for planted, info, and any other status
  return 'outline';
};
