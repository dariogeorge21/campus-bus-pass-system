'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Users, Trophy, Medal, Award } from 'lucide-react';
import type { StopsTabProps } from '@/types/reports';

const StopsTab: React.FC<StopsTabProps> = ({ 
  data, 
  isLoading, 
  error, 
  selectedRoute, 
  onRouteChange, 
  onRefresh, 
  availableRoutes 
}) => {
  // Get ranking icon for top stops
  const getRankingIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 1: return <Medal className="w-5 h-5 text-gray-400" />;
      case 2: return <Award className="w-5 h-5 text-orange-500" />;
      default: return null;
    }
  };

  // Get ranking badge variant
  const getRankingBadge = (index: number) => {
    if (index < 3) return 'default';
    return 'secondary';
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

  return (
    <div className="space-y-6">
      {/* Route Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Select Route
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedRoute} onValueChange={onRouteChange}>
            <SelectTrigger className="w-full md:w-80">
              <SelectValue placeholder="Choose a bus route to view stop analytics" />
            </SelectTrigger>
            <SelectContent>
              {availableRoutes.map((route) => (
                <SelectItem key={route.value} value={route.value}>
                  {route.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}

      {/* No route selected */}
      {!selectedRoute && !isLoading && (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Select a route to view stop analytics</p>
          <p className="text-gray-400 text-sm mt-2">
            Choose from the dropdown above to see booking distribution across stops
          </p>
        </div>
      )}

      {/* Route data */}
      {data && selectedRoute && !isLoading && (
        <div className="space-y-6">
          {/* Route Summary */}
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {data.busName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-blue-100 text-sm">Total Route Bookings</p>
                  <p className="text-2xl font-bold">{data.totalRouteBookings}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Number of Stops</p>
                  <p className="text-2xl font-bold">{data.stops.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stops Grid */}
          {data.stops.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No bookings found for this route</p>
                <p className="text-gray-400 text-sm mt-2">
                  This route hasn't received any bookings yet
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.stops.map((stop, index) => (
                <Card 
                  key={stop.stopName}
                  className={`transition-all duration-200 hover:shadow-lg ${
                    index < 3 ? 'border-yellow-200 bg-yellow-50' : 'hover:border-blue-200'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-lg">
                      <span className="truncate">{stop.stopName}</span>
                      {getRankingIcon(index)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Booking Count */}
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {stop.bookingCount}
                      </div>
                      <p className="text-sm text-gray-600">bookings</p>
                    </div>

                    {/* Percentage */}
                    <div className="text-center">
                      <div className="text-xl font-semibold text-gray-700">
                        {stop.percentageOfRoute}%
                      </div>
                      <p className="text-xs text-gray-500">of route total</p>
                    </div>

                    {/* Ranking Badge */}
                    <div className="flex justify-center">
                      <Badge variant={getRankingBadge(index)}>
                        {index < 3 ? `#${index + 1} Most Popular` : `Rank #${index + 1}`}
                      </Badge>
                    </div>

                    {/* Visual Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          index < 3 ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}
                        style={{ 
                          width: `${Math.max(stop.percentageOfRoute, 5)}%` // Minimum 5% for visibility
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Top Performers Summary */}
          {data.stops.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Top Performing Stops
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {data.stops.slice(0, 3).map((stop, index) => (
                    <div key={stop.stopName} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-center mb-2">
                        {getRankingIcon(index)}
                      </div>
                      <p className="font-semibold text-gray-800">{stop.stopName}</p>
                      <p className="text-sm text-gray-600">
                        {stop.bookingCount} bookings ({stop.percentageOfRoute}%)
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default StopsTab;
