export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Participant {
  id: string;
  registerNumber: string;
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  year?: string;
  teamName?: string;
  hallName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  participantId: string;
  participant?: Participant;
  checkInDate?: string;
  checkInTime?: string;
  checkOutDate?: string;
  checkOutTime?: string;
  status: 'CHECKED_IN' | 'CHECKED_OUT';
  checkInHall?: string;
  checkOutHall?: string;
  isLate: boolean;
  isEarlyCheckout: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Hall {
  id: string;
  name: string;
  location?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errorCode?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  totalParticipants: number;
  checkedIn: number;
  checkedOut: number;
  currentlyInside: number;
  absent: number;
  lateCheckIns: number;
  earlyCheckOuts: number;
}

export interface ImportResult {
  total: number;
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    registerNumber: string;
    reason: string;
  }>;
}
