// TypeScript interfaces for the Analytics Dashboard

// Base API response structure
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// Revenue Management Tab Interfaces
export interface RouteRevenue {
  busRoute: string;
  busName: string;
  totalRevenue: number;
  bookingCount: number;
  revenuePerBooking: number;
}

export interface RevenueData {
  totalRevenue: number;
  routes: RouteRevenue[];
}

export type RevenueApiResponse = ApiResponse<RevenueData>;

// Route Management Tab Interfaces
export interface RouteInfo {
  routeCode: string;
  busName: string;
  totalBookings: number;
  bookingPercentage: number;
  demandLevel: 'High' | 'Medium' | 'Low';
  isActive: boolean;
}

export interface RoutesData {
  routes: RouteInfo[];
  totalBookings: number;
}

export type RoutesApiResponse = ApiResponse<RoutesData>;

// Stop Management Tab Interfaces
export interface StopInfo {
  stopName: string;
  bookingCount: number;
  percentageOfRoute: number;
}

export interface StopsData {
  busRoute: string;
  busName: string;
  totalRouteBookings: number;
  stops: StopInfo[];
}

export type StopsApiResponse = ApiResponse<StopsData>;

// Booking History Tab Interfaces
export interface BookingRound {
  id: string;
  goDate: string;
  returnDate: string;
  totalBookings: number;
  totalRevenue: number;
  resetDate: string;
}

export interface RoundsData {
  rounds: BookingRound[];
}

export type RoundsApiResponse = ApiResponse<RoundsData>;

// Component Props Interfaces
export interface RevenueTabProps {
  data: RevenueData | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export interface RoutesTabProps {
  data: RoutesData | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export interface StopsTabProps {
  data: StopsData | null;
  isLoading: boolean;
  error: string | null;
  selectedRoute: string;
  onRouteChange: (route: string) => void;
  onRefresh: () => void;
  availableRoutes: { value: string; label: string }[];
}

export interface HistoryTabProps {
  data: RoundsData | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

// Table sorting interfaces
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

// Performance badge types
export type PerformanceBadge = 'top' | 'bottom' | 'middle';

// Demand level types
export type DemandLevel = 'High' | 'Medium' | 'Low';

// Demand color types
export type DemandColor = 'green' | 'yellow' | 'red';

// Loading skeleton props
export interface SkeletonProps {
  rows?: number;
  columns?: number;
}

// Error boundary props
export interface ErrorBoundaryProps {
  error: string;
  onRetry: () => void;
}

// Data refresh timestamp
export interface RefreshInfo {
  lastUpdated: Date;
  isRefreshing: boolean;
}

// Query parameters for API endpoints
export interface StopsQueryParams {
  bus_route: string;
}

// Utility types for data processing
export interface ProcessedRouteData extends RouteInfo {
  demandColor: DemandColor;
}

export interface ProcessedRevenueData extends RouteRevenue {
  performanceBadge: PerformanceBadge;
}

// Form validation interfaces
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Export utility functions types
export type CurrencyFormatter = (amount: number) => string;
export type DateFormatter = (date: string | Date) => string;
export type PercentageFormatter = (value: number) => string;

// Analytics dashboard state
export interface AnalyticsDashboardState {
  activeTab: 'revenue' | 'routes' | 'stops' | 'history';
  selectedRoute: string;
  refreshInfo: RefreshInfo;
  sortConfig: SortConfig | null;
}

// CSV export data types
export interface CSVExportData {
  filename: string;
  headers: string[];
  rows: (string | number)[][];
}

// Mobile responsive breakpoints
export interface ResponsiveConfig {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}
