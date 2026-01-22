
export interface ProductVariant {
  type: string; // e.g., "Color", "Size", "Storage"
  options: string[];
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  stock: number;
  rating: number;
  reviews: number;
  isNew?: boolean;
  discount?: number;
  variants?: ProductVariant[];
  reviewsList?: Review[];
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariants?: Record<string, string>;
}

export type PaymentMethod = 'cash' | 'card' | 'mobile_wallet';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'manager' | 'cashier';
  avatar?: string;
  loyaltyPoints?: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  tax: number;
  discount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
  type: 'online' | 'pos';
  paymentMethod?: PaymentMethod;
  staffId?: string;
}

export interface Shift {
  id: string;
  staffId: string;
  startTime: string;
  endTime?: string;
  totalSales: number;
  status: 'active' | 'closed';
}

export interface Notification {
  id: string;
  userId: string;
  subject: string;
  body: string;
  type: 'order_confirmation' | 'shipping_update' | 'delivery_confirmation';
  timestamp: string;
  read: boolean;
}

export interface Coupon {
  code: string;
  discount: number; // percentage
  isActive: boolean;
}

export type View = 'home' | 'shop' | 'product' | 'cart' | 'checkout' | 'profile' | 'admin' | 'auth';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}
