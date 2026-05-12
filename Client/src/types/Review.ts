export interface ReviewUser {
  id: string;
  userName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface Review {
  id: string;
  equipmentId: string;
  userId: string;
  bookingId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt?: string;
  reviewer: ReviewUser;
}

export interface CreateReviewDto {
  equipmentId: string;
  bookingId: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewDto {
  rating?: number;
  comment?: string;
}

export interface ReviewEligibility {
  canReview: boolean;
  eligibleBookingId?: string;
  reason?: string;
}
