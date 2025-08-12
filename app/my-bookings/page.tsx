'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageTransition } from '@/components/ui/page-transition';
import { Search, ArrowLeft, Calendar, MapPin, CreditCard, Bus, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Booking {
  id: number;
  admission_number: string;
  student_name: string;
  destination: string;
  bus_name?: string;
  go_date: string;
  return_date: string;
  fare: number;
  payment_status: boolean;
  created_at: string;
  razorpay_payment_id?: string | null;
  razorpay_order_id?: string | null;
  razorpay_signature?: string | null;
}

export default function MyBookingsPage() {
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const router = useRouter();

  const ITEMS_PER_PAGE = 10;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!admissionNumber.trim()) {
      toast.error('Please enter an admission number');
      return;
    }

    setIsLoading(true);
    setCurrentPage(1); // Reset to first page on new search
    try {
      const response = await fetch(`/api/bookings/search?admission_number=${encodeURIComponent(admissionNumber.trim())}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to search bookings');
      }

      // Fix: Access data from the correct response structure
      const bookingsData = result.data?.bookings || [];
      const count = result.data?.count || 0;
      
      console.log('API Response:', result); // Debug log
      console.log('Bookings data:', bookingsData); // Debug log
      
      setBookings(bookingsData);
      setTotalCount(count);
      setHasSearched(true);
      
      if (count === 0) {
        toast.info('No bookings found for this admission number');
      } else {
        toast.success(`Found ${count} booking(s)`);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to search bookings');
      setBookings([]);
      setTotalCount(0);
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPaymentStatus = (status: boolean) => {
    return status ? (
      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
        Paid
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
        Not Paid
      </Badge>
    );
  };

  // Pagination functions
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentBookings = bookings.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              size="sm"
              className="mb-4 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                My Bookings
              </h1>
              <p className="text-gray-600">
                Search and view your bus pass bookings
              </p>
            </div>
          </motion.div>

          {/* Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Search Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="space-y-4">
                  <div>
                    <Label htmlFor="admissionNumber">Admission Number</Label>
                    <Input
                      id="admissionNumber"
                      type="text"
                      placeholder="e.g., 24CS094"
                      value={admissionNumber}
                      onChange={(e) => setAdmissionNumber(e.target.value.toUpperCase())}
                      maxLength={7}
                      className="mt-1"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: XXAA000 (Year - Department - Registration Number)
                    </p>
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Searching...' : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Search Bookings
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results */}
          {hasSearched && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {totalCount === 0 ? (
                <Card className="max-w-md mx-auto">
                  <CardContent className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                      <Search className="w-12 h-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      No Bookings Found
                    </h3>
                    <p className="text-gray-500">
                      No bookings were found for admission number: <strong>{admissionNumber}</strong>
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      Your Bookings
                    </h2>
                    <p className="text-gray-600">
                      Found {totalCount} booking(s) for {admissionNumber}
                    </p>
                    {totalPages > 1 && (
                      <p className="text-sm text-gray-500 mt-1">
                        Showing {startIndex + 1}-{Math.min(endIndex, totalCount)} of {totalCount} bookings
                      </p>
                    )}
                  </div>

                  {/* Mobile Card View */}
                  <div className="block md:hidden space-y-4">
                    {currentBookings.map((booking) => (
                      <Card key={booking.id} className="overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{booking.student_name}</CardTitle>
                              <p className="text-sm text-gray-600">{booking.admission_number}</p>
                            </div>
                            {formatPaymentStatus(booking.payment_status)}
                          </div>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-green-600" />
                              <span className="font-medium">Destination:</span>
                              <span>{booking.destination}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-purple-600" />
                              <span className="font-medium">Go Date:</span>
                              <span>{formatDate(booking.go_date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-purple-600" />
                              <span className="font-medium">Return Date:</span>
                              <span>{formatDate(booking.return_date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-orange-600" />
                              <span className="font-medium">Fare:</span>
                              <span>₹{booking.fare || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Booked on:</span>
                              <span>{formatDate(booking.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Bus className="w-4 h-4 text-blue-600" />
                              <span className="font-medium">Bus Name:</span>
                              <span>{booking.bus_name}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {/* Mobile Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                          className="flex items-center gap-1"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </Button>
                        
                        <span className="text-sm text-gray-600 px-2">
                          {currentPage} / {totalPages}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className="flex items-center gap-1"
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <Card>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Student</TableHead>
                              <TableHead>Bus Name</TableHead>
                              <TableHead>Destination</TableHead>
                              <TableHead>Go Date</TableHead>
                              <TableHead>Return Date</TableHead>
                              <TableHead>Fare</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Booked On</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentBookings.map((booking) => (
                              <TableRow key={booking.id}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{booking.student_name}</div>
                                    <div className="text-sm text-gray-500">{booking.admission_number}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Bus className="w-4 h-4 text-blue-600" />
                                    {booking.bus_name}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-green-600" />
                                    {booking.destination}
                                  </div>
                                </TableCell>
                                <TableCell>{formatDate(booking.go_date)}</TableCell>
                                <TableCell>{formatDate(booking.return_date)}</TableCell>
                                <TableCell>₹{booking.fare || 'N/A'}</TableCell>
                                <TableCell>{formatPaymentStatus(booking.payment_status)}</TableCell>
                                <TableCell>{formatDate(booking.created_at)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-600">
                          Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={goToPreviousPage}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                          </Button>
                          
                          {/* Page Numbers */}
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }
                              
                              return (
                                <Button
                                  key={pageNum}
                                  variant={currentPage === pageNum ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => goToPage(pageNum)}
                                  className="w-8 h-8 p-0"
                                >
                                  {pageNum}
                                </Button>
                              );
                            })}
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-1"
                          >
                            Next
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}