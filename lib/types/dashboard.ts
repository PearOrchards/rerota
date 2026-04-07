export type DashboardMetrics = {
  expiringCompetencies: number;
  underCoveredRidePositions: number;
};

export type DashboardTask = {
  id: string;
  title: string;
  description: string;
  href: string;
  priority: number;
};
