'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { withAdminAuth } from '@/contexts/AdminContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import type {
  RevenueApiResponse,
  RoutesApiResponse,
  StopsApiResponse,
  RoundsApiResponse,
  AnalyticsDashboardState
} from '@/types/reports';

// Import tab components (will create these next)
import RevenueTab from './components/RevenueTab';
import RoutesTab from './components/RoutesTab';
import StopsTab from './components/StopsTab';
import HistoryTab from './components/HistoryTab';

function ReportsPage() {
  const [state, setState] = useState<AnalyticsDashboardState>({
    activeTab: 'revenue',
    selectedRoute: '',
    refreshInfo: {
      lastUpdated: new Date(),
      isRefreshing: false
    },
    sortConfig: null
  });

  // Data states
  const [revenueData, setRevenueData] = useState<RevenueApiResponse['data'] | null>(null);
  const [routesData, setRoutesData] = useState<RoutesApiResponse['data'] | null>(null);
  const [stopsData, setStopsData] = useState<StopsApiResponse['data'] | null>(null);
  const [roundsData, setRoundsData] = useState<RoundsApiResponse['data'] | null>(null);

  // Loading states
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(false);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [isLoadingStops, setIsLoadingStops] = useState(false);
  const [isLoadingRounds, setIsLoadingRounds] = useState(false);

  // Error states
  const [revenueError, setRevenueError] = useState<string | null>(null);
  const [routesError, setRoutesError] = useState<string | null>(null);
  const [stopsError, setStopsError] = useState<string | null>(null);
  const [roundsError, setRoundsError] = useState<string | null>(null);

  // Available routes for stops dropdown
  const [availableRoutes, setAvailableRoutes] = useState<{ value: string; label: string }[]>([]);

  // Fetch functions
  const fetchRevenueData = useCallback(async () => {
    setIsLoadingRevenue(true);
    setRevenueError(null);
    try {
      const response = await fetch('/api/admin/reports/revenue', {
        credentials: 'include'
      });
      const result: RevenueApiResponse = await response.json();
      
      if (result.success) {
        setRevenueData(result.data);
      } else {
        setRevenueError(result.error || 'Failed to fetch revenue data');
      }
    } catch (error) {
      setRevenueError('Network error while fetching revenue data');
      console.error('Revenue fetch error:', error);
    } finally {
      setIsLoadingRevenue(false);
    }
  }, []);

  const fetchRoutesData = useCallback(async () => {
    setIsLoadingRoutes(true);
    setRoutesError(null);
    try {
      const response = await fetch('/api/admin/reports/routes', {
        credentials: 'include'
      });
      const result: RoutesApiResponse = await response.json();
      
      if (result.success) {
        setRoutesData(result.data);
        // Update available routes for stops dropdown
        const routes = result.data.routes.map(route => ({
          value: route.routeCode,
          label: route.busName
        }));
        setAvailableRoutes(routes);
      } else {
        setRoutesError(result.error || 'Failed to fetch routes data');
      }
    } catch (error) {
      setRoutesError('Network error while fetching routes data');
      console.error('Routes fetch error:', error);
    } finally {
      setIsLoadingRoutes(false);
    }
  }, []);

  const fetchStopsData = useCallback(async (busRoute: string) => {
    if (!busRoute) {
      setStopsData(null);
      return;
    }

    setIsLoadingStops(true);
    setStopsError(null);
    try {
      const response = await fetch(`/api/admin/reports/stops?bus_route=${encodeURIComponent(busRoute)}`, {
        credentials: 'include'
      });
      const result: StopsApiResponse = await response.json();
      
      if (result.success) {
        setStopsData(result.data);
      } else {
        setStopsError(result.error || 'Failed to fetch stops data');
      }
    } catch (error) {
      setStopsError('Network error while fetching stops data');
      console.error('Stops fetch error:', error);
    } finally {
      setIsLoadingStops(false);
    }
  }, []);

  const fetchRoundsData = useCallback(async () => {
    setIsLoadingRounds(true);
    setRoundsError(null);
    try {
      const response = await fetch('/api/admin/reports/rounds', {
        credentials: 'include'
      });
      const result: RoundsApiResponse = await response.json();
      
      if (result.success) {
        setRoundsData(result.data);
      } else {
        setRoundsError(result.error || 'Failed to fetch rounds data');
      }
    } catch (error) {
      setRoundsError('Network error while fetching rounds data');
      console.error('Rounds fetch error:', error);
    } finally {
      setIsLoadingRounds(false);
    }
  }, []);

  // Refresh all data
  const refreshAllData = useCallback(async () => {
    setState(prev => ({
      ...prev,
      refreshInfo: { ...prev.refreshInfo, isRefreshing: true }
    }));

    try {
      await Promise.all([
        fetchRevenueData(),
        fetchRoutesData(),
        fetchRoundsData()
      ]);

      // Fetch stops data if a route is selected
      if (state.selectedRoute) {
        await fetchStopsData(state.selectedRoute);
      }

      setState(prev => ({
        ...prev,
        refreshInfo: {
          lastUpdated: new Date(),
          isRefreshing: false
        }
      }));

      toast.success('Data refreshed successfully');
    } catch (error) {
      setState(prev => ({
        ...prev,
        refreshInfo: { ...prev.refreshInfo, isRefreshing: false }
      }));
      toast.error('Failed to refresh data');
    }
  }, [fetchRevenueData, fetchRoutesData, fetchRoundsData, fetchStopsData, state.selectedRoute]);

  // Handle route selection for stops tab
  const handleRouteChange = useCallback((route: string) => {
    setState(prev => ({ ...prev, selectedRoute: route }));
    if (route) {
      fetchStopsData(route);
    } else {
      setStopsData(null);
    }
  }, [fetchStopsData]);

  // Handle tab change
  const handleTabChange = useCallback((tab: string) => {
    setState(prev => ({ ...prev, activeTab: tab as any }));
  }, []);

  // Initial data load
  useEffect(() => {
    refreshAllData();
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(refreshAllData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshAllData]);

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Reports Dashboard</h1>
            <p className="text-gray-600">
              Last updated: {state.refreshInfo.lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => window.location.href = '/admin/dashboard'} // Redirect to admin dashboard
              variant="ghost"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <Button
              onClick={refreshAllData}
              disabled={state.refreshInfo.isRefreshing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${state.refreshInfo.isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <nav className="text-sm text-gray-600">
            Admin &gt; Reports &gt; {state.activeTab.charAt(0).toUpperCase() + state.activeTab.slice(1)}
          </nav>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analytics Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={state.activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="revenue">Revenue</TabsTrigger>
                  <TabsTrigger value="routes">Routes</TabsTrigger>
                  <TabsTrigger value="stops">Stops</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="revenue" className="mt-6">
                  <RevenueTab
                    data={revenueData}
                    isLoading={isLoadingRevenue}
                    error={revenueError}
                    onRefresh={fetchRevenueData}
                  />
                </TabsContent>

                <TabsContent value="routes" className="mt-6">
                  <RoutesTab
                    data={routesData}
                    isLoading={isLoadingRoutes}
                    error={routesError}
                    onRefresh={fetchRoutesData}
                  />
                </TabsContent>

                <TabsContent value="stops" className="mt-6">
                  <StopsTab
                    data={stopsData}
                    isLoading={isLoadingStops}
                    error={stopsError}
                    selectedRoute={state.selectedRoute}
                    onRouteChange={handleRouteChange}
                    onRefresh={() => fetchStopsData(state.selectedRoute)}
                    availableRoutes={availableRoutes}
                  />
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                  <HistoryTab
                    data={roundsData}
                    isLoading={isLoadingRounds}
                    error={roundsError}
                    onRefresh={fetchRoundsData}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default withAdminAuth(ReportsPage);
