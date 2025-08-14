'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, ArrowUpDown, ArrowUp, ArrowDown, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import type { RevenueTabProps, SortConfig, PerformanceBadge } from '@/types/reports';

const RevenueTab: React.FC<RevenueTabProps> = ({ data, isLoading, error, onRefresh }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({
    key: 'totalRevenue',
    direction: 'desc'
  });

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Determine performance badge
  const getPerformanceBadge = (revenue: number, allRevenues: number[]): PerformanceBadge => {
    if (allRevenues.length === 0) return 'middle';
    
    const sortedRevenues = [...allRevenues].sort((a, b) => b - a);
    const topThreshold = Math.ceil(sortedRevenues.length * 0.25);
    const bottomThreshold = Math.floor(sortedRevenues.length * 0.75);
    
    const rank = sortedRevenues.indexOf(revenue);
    
    if (rank < topThreshold) return 'top';
    if (rank >= bottomThreshold) return 'bottom';
    return 'middle';
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

  // Export to CSV
  const exportToCSV = () => {
    if (!data?.routes) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Bus Name', 'Total Revenue', 'Bookings', 'Avg Revenue/Booking'];
    const rows = data.routes.map(route => [
      route.busName,
      route.totalRevenue.toString(),
      route.bookingCount.toString(),
      route.revenuePerBooking.toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Revenue report exported successfully');
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
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const allRevenues = data?.routes.map(route => route.totalRevenue) || [];

  return (
    <div className="space-y-6">
      {/* Total Revenue Card */}
      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="w-5 h-5" />
            Total Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {formatCurrency(data?.totalRevenue || 0)}
          </div>
          <p className="text-green-100 text-sm mt-1">
            From {data?.routes.length || 0} active routes
          </p>
        </CardContent>
      </Card>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Revenue Table */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Route</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.routes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No revenue data available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
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
                      onClick={() => handleSort('totalRevenue')}
                    >
                      <div className="flex items-center gap-2">
                        Total Revenue
                        {getSortIcon('totalRevenue')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('bookingCount')}
                    >
                      <div className="flex items-center gap-2">
                        Bookings
                        {getSortIcon('bookingCount')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('revenuePerBooking')}
                    >
                      <div className="flex items-center gap-2">
                        Avg Revenue/Booking
                        {getSortIcon('revenuePerBooking')}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((route) => (
                    <TableRow key={route.busRoute}>
                      <TableCell className="font-medium">{route.busName}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(route.totalRevenue)}
                      </TableCell>
                      <TableCell>{route.bookingCount}</TableCell>
                      <TableCell>{formatCurrency(route.revenuePerBooking)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueTab;
