import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LivestockList } from './components/LivestockList';
import { LivestockForm } from './components/LivestockForm';
import { LivestockDetail } from './components/LivestockDetail';
import { HealthRecordForm } from './components/HealthRecordForm';
import { BreedingRecordForm } from './components/BreedingRecordForm';
import { FeedingRecordForm } from './components/FeedingRecordForm';

// Layout component for livestock section
const LivestockLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="p-6">
    {children}
  </div>
);

export const livestockRoutes = [
  {
    path: '/livestock',
    element: (
      <LivestockLayout>
        <LivestockList />
      </LivestockLayout>
    ),
  },
  {
    path: '/livestock/new',
    element: (
      <LivestockLayout>
        <LivestockForm />
      </LivestockLayout>
    ),
  },
  {
    path: '/livestock/:id',
    element: (
      <LivestockLayout>
        <LivestockDetail />
      </LivestockLayout>
    ),
  },
  {
    path: '/livestock/:id/edit',
    element: (
      <LivestockLayout>
        <LivestockForm isEdit />
      </LivestockLayout>
    ),
  },
  // Health Records
  {
    path: '/livestock/:id/health/new',
    element: (
      <LivestockLayout>
        <HealthRecordForm />
      </LivestockLayout>
    ),
  },
  {
    path: '/livestock/:id/health/:recordId/edit',
    element: (
      <LivestockLayout>
        <HealthRecordForm isEdit />
      </LivestockLayout>
    ),
  },
  // Breeding Records
  {
    path: '/livestock/:id/breeding/new',
    element: (
      <LivestockLayout>
        <BreedingRecordForm />
      </LivestockLayout>
    ),
  },
  {
    path: '/livestock/:id/breeding/:recordId/edit',
    element: (
      <LivestockLayout>
        <BreedingRecordForm isEdit />
      </LivestockLayout>
    ),
  },
  // Feeding Records
  {
    path: '/livestock/:id/feeding/new',
    element: (
      <LivestockLayout>
        <FeedingRecordForm />
      </LivestockLayout>
    ),
  },
  {
    path: '/livestock/:id/feeding/:recordId/edit',
    element: (
      <LivestockLayout>
        <FeedingRecordForm isEdit />
      </LivestockLayout>
    ),
  },
  // Redirect any unmatched livestock routes to the main livestock page
  {
    path: '/livestock/*',
    element: <Navigate to="/livestock" replace />,
  },
];

// Create the router instance
export const livestockRouter = createBrowserRouter(livestockRoutes);

export default livestockRouter;
