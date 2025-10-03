'use client';

import { GrowthStageManager } from '@/components/growth/GrowthStageManager';
import { useOrganization } from '@/hooks/useOrganization';
import { useParams } from 'next/navigation';

export default function GrowthStagesPage() {
  const { organizationId } = useOrganization();
  const params = useParams();
  
  // Get cropTypeId from URL params if it exists
  const cropTypeId = params?.cropTypeId as string | undefined;

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please select an organization to manage growth stages.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          {cropTypeId ? 'Crop Growth Stages' : 'Growth Stages'}
        </h1>
        <GrowthStageManager 
          organizationId={organizationId} 
          cropTypeId={cropTypeId} 
        />
      </div>
    </div>
  );
}
