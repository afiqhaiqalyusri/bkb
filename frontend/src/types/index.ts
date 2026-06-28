export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'CUSTOMER' | 'STAFF' | 'MANAGER' | 'GUEST' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
}

export interface StaffMember extends User {
  icNumber?: string;
  typhoidExpiry?: string;
  foodHandlerExpiry?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  promoPrice?: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  ingredients: Ingredient[];
}

export interface Ingredient {
  id: number;
  ingredientName: string;
  defaultLevel: 'NONE' | 'LESS' | 'MEDIUM' | 'EXTRA';
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  customisations: Customisation[];
  isFree?: boolean;
}

export interface Customisation {
  ingredient: string;
  level: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: 'ONLINE' | 'CASH';
  paymentStatus: 'UNPAID' | 'PAID' | 'FAILED';
  subtotal: number;
  tax: number;
  total: number;
  pickupTime?: string;
  scheduledTime?: string;
  queueEnteredAt?: string;
  notes?: string;
  guestPhone?: string;
  createdAt: string;
  customerName: string;
  customerId?: number;
  paymentToken?: string;
  paymentChannel?: string;
  guestToken?: string;
  rating?: number;
  feedback?: string;
  items: OrderItem[];
}

export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'GRILLING'
  | 'ASSEMBLING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ON_HOLD'
  | 'INCOMING_ORDER';

export interface OrderItem {
  id: number;
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  customisations?: string;
}

export interface InventoryItem {
  id: number;
  itemName: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  status: 'GOOD' | 'LOW' | 'CRITICAL';
  updatedAt: string;
  averageDailyUsage?: number;
  estimatedDaysRemaining?: number | null;
}

export interface LoyaltyAccount {
  id: number;
  points: number;
  totalEarned: number;
  updatedAt: string;
  transactions: LoyaltyTx[];
}

export interface LoyaltyTx {
  id: number;
  type: 'EARN' | 'REDEEM';
  points: number;
  orderNumber?: string;
  createdAt: string;
}

export interface LoyaltyReward {
  id: number;
  name: string;
  pointsCost: number;
  isActive: boolean;
  menuItemId?: number;
  menuItemName?: string;
  menuItemImageUrl?: string;
  description?: string;
  imageUrl?: string;
}

export interface Promotion {
  id: number;
  title: string;
  description: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface SalesReport {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  dailyRevenue: DailyRevenue[];
  topItems: TopItem[];
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

export interface CustomerInsightsResponse {
  totalUniqueCustomers: number;
  repeatCustomers: number;
  averageCustomerLtv: number;
  averageRating: number;
  recentFeedback: FeedbackEntry[];
}

export interface FeedbackEntry {
  customerName: string;
  orderNumber: string;
  rating: number;
  feedback: string;
  date: string;
}

export interface TopItem {
  itemName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface MenuItemIngredient {
  id: number;
  menuItemId: number;
  menuItemName: string;
  ingredientName: string;
  defaultLevel: 'NONE' | 'LESS' | 'MEDIUM' | 'EXTRA';
}

export interface Category {
  id: number;
  name: string;
  displayOrder?: number;
}

export interface WasteEntry {
  id: number;
  inventoryName: string;
  unit: string;
  quantity: number;
  reason: string;
  createdAt: string;
  loggedBy: string;
  transactionCost?: number;
}

export interface LoyaltyAccountManagerDetail {
  id: number;
  userName: string;
  userEmail: string;
  points: number;
  totalEarned: number;
  updatedAt: string;
  userRole: string;
  phone: string;
}

export interface SecurityLog {
  id: number;
  timestamp?: string; // from local logs
  createdAt?: string; // from backend logs
  userEmail?: string; // from backend logs
  action?: string; // from backend logs
  details: string;
  ipAddress?: string; // from backend logs
  userAgent?: string; // from backend logs
  user: string;
  role: string;
  event: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ─── Recipe / Ingredient Recipe Types ───────────────────────────────────────
export interface RecipeIngredientItem {
  id: number;
  inventoryId: number;
  inventoryName: string;
  unit: string;
  trackingType: 'AUTO' | 'MANUAL';
  quantity: number;
  isOptional: boolean;
  currentStock: number;
  stockStatus: 'GOOD' | 'LOW' | 'CRITICAL';
}

export interface Recipe {
  id?: number;
  menuItemId: number;
  menuItemName: string;
  menuItemCategory: string;
  menuItemImageUrl?: string;
  notes?: string;
  updatedAt?: string;
  ingredients: RecipeIngredientItem[];
}

export interface RecipeIngredientRequest {
  inventoryId: number;
  quantity: number;
  isOptional: boolean;
}



