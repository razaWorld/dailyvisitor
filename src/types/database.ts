export type UserRole = 'admin' | 'customer' | 'visitor';
export type VisitorStatus = 'pending' | 'approved' | 'suspended' | 'rejected';
export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'in_progress'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export interface UserProfile {
  id: number;
  auth_id: string;
  name: string;
  email: string;
  role: UserRole;
  lat: number | null;
  long: number | null;
  address: string | null;
  job_type: string | null;
  gender: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VisitorProfile {
  id: number;
  user_id: number;
  status: VisitorStatus;
  bio: string | null;
  service_radius_km: number;
  is_available: boolean;
  rating_avg: number;
  rating_count: number;
  created_at: string;
}

export interface NearbyVisitor {
  user_id: number;
  name: string;
  lat: number;
  long: number;
  distance_km: number;
  visitor_profile_id: number;
  rating_avg: number;
  is_available: boolean;
}

export interface ServiceCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  is_active: boolean;
}

export interface Order {
  id: number;
  customer_id: number;
  visitor_id: number;
  status: OrderStatus;
  total_amount: number;
  is_recurring: boolean;
  scheduled_for: string | null;
  notes: string | null;
  created_at: string;
}

export interface MapPoint {
  lat: number;
  lng: number;
}
