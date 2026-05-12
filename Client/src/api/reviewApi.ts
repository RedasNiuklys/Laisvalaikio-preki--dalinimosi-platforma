import axios from "axios";
import { getAuthToken } from "../utils/authUtils";
import { BASE_URL } from "../utils/envConfig";
import {
  CreateReviewDto,
  Review,
  ReviewEligibility,
  UpdateReviewDto,
} from "../types/Review";

const REVIEW_ENDPOINT = `${BASE_URL}/review`;

export const getReviewsForEquipment = async (equipmentId: string): Promise<Review[]> => {
  const token = await getAuthToken();
  const response = await axios.get(`${REVIEW_ENDPOINT}/equipment/${equipmentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getReviewEligibility = async (equipmentId: string): Promise<ReviewEligibility> => {
  const token = await getAuthToken();
  const response = await axios.get(`${REVIEW_ENDPOINT}/equipment/${equipmentId}/eligibility`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createReview = async (dto: CreateReviewDto): Promise<Review> => {
  const token = await getAuthToken();
  const response = await axios.post(REVIEW_ENDPOINT, dto, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateReview = async (id: string, dto: UpdateReviewDto): Promise<Review> => {
  const token = await getAuthToken();
  const response = await axios.put(`${REVIEW_ENDPOINT}/${id}`, dto, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const deleteReview = async (id: string): Promise<void> => {
  const token = await getAuthToken();
  await axios.delete(`${REVIEW_ENDPOINT}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
