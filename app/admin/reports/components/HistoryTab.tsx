'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { History, ArrowUpDown, ArrowUp, ArrowDown, Calendar, DollarSign } from 'lucide-react';
import type { HistoryTabProps, SortConfig } from '@/types/reports';

const HistoryTab: React.FC<HistoryTabProps> = ({ data, isLoading, error, onRefresh }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({
    key: 'resetDate',
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

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format datetime
  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Sort data
  const sortedData = useMemo(() => {
    if (!data?.rounds || !sortConfig) return data?.rounds || [];

    return [...data.rounds].sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof typeof a];
      let bValue: any = b[sortConfig.key as keyof typeof b];

      // Convert dates to timestamps for comparison
      if (sortConfig.key.includes('Date')) {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

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
  }, [data?.rounds, sortConfig]);

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

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (!data?.rounds) return { totalRounds: 0, totalBookings: 0, totalRevenue: 0 };

    return {
      totalRounds: data.rounds.length,
      totalBookings: data.rounds.reduce((sum, round) => sum + round.totalBookings, 0),
      totalRevenue: data.rounds.reduce((sum, round) => sum + round.totalRevenue, 0)
    };
  }, [data?.rounds]);

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <History className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Rounds</p>
                <p className="text-2xl font-bold">{summaryStats.totalRounds}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold">{summaryStats.totalBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(summaryStats.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Booking History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.rounds.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No booking history available</p>
              <p className="text-gray-400 text-sm mt-2">
                Historical data will appear here after booking rounds are reset
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('goDate')}
                    >
                      <div className="flex items-center gap-2">
                        Go Date
                        {getSortIcon('goDate')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('returnDate')}
                    >
                      <div className="flex items-center gap-2">
                        Return Date
                        {getSortIcon('returnDate')}
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
                      onClick={() => handleSort('totalRevenue')}
                    >
                      <div className="flex items-center gap-2">
                        Total Revenue
                        {getSortIcon('totalRevenue')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('resetDate')}
                    >
                      <div className="flex items-center gap-2">
                        Reset Date
                        {getSortIcon('resetDate')}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((round) => (
                    <TableRow key={round.id}>
                      <TableCell className="font-medium">
                        {formatDate(round.goDate)}
                      </TableCell>
                      <TableCell>
                        {formatDate(round.returnDate)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {round.totalBookings}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(round.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDateTime(round.resetDate)}
                      </TableCell>
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

export default HistoryTab;
