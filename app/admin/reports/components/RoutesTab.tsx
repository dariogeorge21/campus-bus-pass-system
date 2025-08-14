'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer } from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Bus, Users, ArrowUpDown, ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';
import type { RoutesTabProps, SortConfig } from '@/types/reports';

const RoutesTab: React.FC<RoutesTabProps> = ({ data, isLoading, error, onRefresh }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({
    key: 'totalBookings',
    direction: 'desc'
  });

  // Get demand badge variant
  const getDemandBadgeVariant = (demandLevel: string) => {
    switch (demandLevel) {
      case 'High': return 'destructive';
      case 'Medium': return 'default';
      case 'Low': return 'secondary';
      default: return 'secondary';
    }
  };

  // Sort data
  const sortedData = useMemo(() => {
    if (!data?.routes || !sortConfig) return data?.routes || [];

    return [...data.routes].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof typeof a];
      const bValue = b[sortConfig.key as keyof typeof b];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });
  }, [data?.routes, sortConfig]);

  // Handle sort
  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Get sort icon
  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return <ArrowUpDown className="w-4 h-4" />;
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="w-4 h-4" />
      : <ArrowDown className="w-4 h-4" />;
  };

  // Error state
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={onRefresh} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  // Empty state
  if (!data?.routes || data.routes.length === 0) {
    return (
      <div className="text-center py-8">
        <Bus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No route data available</p>
        <Button onClick={onRefresh} variant="outline" className="mt-4">
          Refresh Data
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Bus className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Routes</p>
                <p className="text-2xl font-bold">{data?.routes.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold">
                  {data?.totalBookings || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Routes Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Booking Demand by Route
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.routes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No route data available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('routeCode')}
                    >
                      <div className="flex items-center gap-2">
                        Route Code
                        {getSortIcon('routeCode')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('busName')}
                    >
                      <div className="flex items-center gap-2">
                        Bus Name
                        {getSortIcon('busName')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('totalBookings')}
                    >
                      <div className="flex items-center gap-2">
                        Total Bookings
                        {getSortIcon('totalBookings')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('bookingPercentage')}
                    >
                      <div className="flex items-center gap-2">
                        Booking %
                        {getSortIcon('bookingPercentage')}
                      </div>
                    </TableHead>
                    <TableHead>Demand Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((route) => (
                    <TableRow key={route.routeCode}>
                      <TableCell className="font-medium">{route.routeCode}</TableCell>
                      <TableCell>{route.busName}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {route.totalBookings}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold">{route.bookingPercentage}%</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getDemandBadgeVariant(route.demandLevel)}>
                          {route.demandLevel}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Demand Level Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Demand Level Classification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">Low: &lt;5% of total bookings</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-sm">Medium: 5-14% of total bookings</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm">High: ≥15% of total bookings</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Routes Benchmark Chart */}
      {data?.routes && data.routes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Top Routes by Booking Demand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-180"> {/* Reduce height to prevent overflow */}
              <ChartContainer
                config={{
                  bookings: {
                    label: "Total Bookings",
                    color: "hsl(16, 100%, 70%)",
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sortedData.slice(0, 8).sort((a, b) => b.totalBookings - a.totalBookings)} // Show top 8 routes sorted by bookings
                    margin={{
                      top: 20,
                      right: 20, // Adjust right margin
                      left: 20,  // Adjust left margin
                      bottom: 40, // Reduce bottom margin
                    }}
                    barSize={40}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="routeCode"
                      angle={-45}
                      textAnchor="end"
                      height={30} // Reduce height to fit within card
                      fontSize={12}
                      tickMargin={10}
                      padding={{ left: 20, right: 20 }}
                    />
                    <YAxis 
                      domain={[0, 'auto']} 
                      allowDecimals={false}
                      tickMargin={10}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border rounded-lg shadow-lg">
                              <p className="font-semibold text-base mb-1">{data.busName}</p>
                              <p className="text-sm text-gray-600 mb-2">Route: {label}</p>
                              <div className="space-y-1">
                                <p className="text-sm flex justify-between gap-3">
                                  <span className="font-medium">Bookings:</span>
                                  <span className="font-bold">{data.totalBookings}</span>
                                </p>
                                <p className="text-sm flex justify-between gap-3">
                                  <span className="font-medium">Percentage:</span>
                                  <span className="font-bold">{data.bookingPercentage}%</span>
                                </p>
                                <p className="text-sm flex justify-between gap-3">
                                  <span className="font-medium">Demand:</span>
                                  <span className={`font-bold ${data.demandLevel === 'High' ? 'text-red-600' : data.demandLevel === 'Medium' ? 'text-amber-600' : 'text-green-600'}`}>
                                    {data.demandLevel}
                                  </span>
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="totalBookings"
                      fill="hsl(16, 100%, 70%)"
                      radius={[4, 4, 0, 0]}
                      label={{
                        position: 'top',
                        fill: '#666',
                        fontSize: 12,
                        fontWeight: 'bold'
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            <p className="text-sm text-gray-600 mt-4 text-center">
              Showing top 8 routes by total booking count
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RoutesTab;
