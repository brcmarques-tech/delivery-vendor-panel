import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: any; output: any; }
};

export type AddToCartInput = {
  notes?: InputMaybe<Scalars['String']['input']>;
  productId: Scalars['String']['input'];
  quantity?: Scalars['Int']['input'];
  weightGrams?: InputMaybe<Scalars['Int']['input']>;
};

export type Address = {
  __typename?: 'Address';
  city: Scalars['String']['output'];
  complement?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  isDefault: Scalars['Boolean']['output'];
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
  neighborhood: Scalars['String']['output'];
  number: Scalars['String']['output'];
  state: Scalars['String']['output'];
  street: Scalars['String']['output'];
  user: AppUser;
  zipCode: Scalars['String']['output'];
};

export type AnticipationResult = {
  __typename?: 'AnticipationResult';
  approvedAmount: Scalars['Float']['output'];
  createdAt: Scalars['String']['output'];
  fee: Scalars['Float']['output'];
  id: Scalars['String']['output'];
  requestedAmount: Scalars['Float']['output'];
  status: Scalars['String']['output'];
};

export type AnticipationSimulation = {
  __typename?: 'AnticipationSimulation';
  anticipatedAmount: Scalars['Float']['output'];
  fee: Scalars['Float']['output'];
  feePercentage: Scalars['Float']['output'];
  originalAmount: Scalars['Float']['output'];
};

export type AppAuthResponse = {
  __typename?: 'AppAuthResponse';
  accessToken: Scalars['String']['output'];
  user: AppUser;
};

export type AppUser = {
  __typename?: 'AppUser';
  acceptedTermsAt?: Maybe<Scalars['DateTime']['output']>;
  addresses?: Maybe<Array<Address>>;
  approvedAt?: Maybe<Scalars['DateTime']['output']>;
  avatarUrl?: Maybe<Scalars['String']['output']>;
  birthDate?: Maybe<Scalars['String']['output']>;
  cnhNumber?: Maybe<Scalars['String']['output']>;
  cpf?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  emailVerified: Scalars['Boolean']['output'];
  googleId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  identityPhotoBackUrl?: Maybe<Scalars['String']['output']>;
  identityPhotoUrl?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  isDeliverer: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  notificationEmail?: Maybe<Scalars['String']['output']>;
  orders?: Maybe<Array<Order>>;
  pagarmeRecipientId?: Maybe<Scalars['String']['output']>;
  paymentConnected: Scalars['Boolean']['output'];
  pendingRole?: Maybe<Scalars['String']['output']>;
  permissions?: Maybe<Scalars['String']['output']>;
  phone: Scalars['String']['output'];
  phoneVerified: Scalars['Boolean']['output'];
  profilePhotoUrl?: Maybe<Scalars['String']['output']>;
  rejectedAt?: Maybe<Scalars['DateTime']['output']>;
  rejectionReason?: Maybe<Scalars['String']['output']>;
  role: UserRole;
  updatedAt: Scalars['DateTime']['output'];
  vehiclePlate?: Maybe<Scalars['String']['output']>;
  vehicleType?: Maybe<Scalars['String']['output']>;
};

export type Appointment = {
  __typename?: 'Appointment';
  address?: Maybe<Scalars['String']['output']>;
  appointmentNumber: Scalars['String']['output'];
  checkoutUrl?: Maybe<Scalars['String']['output']>;
  commissionAmount?: Maybe<Scalars['Float']['output']>;
  createdAt: Scalars['DateTime']['output'];
  customer: AppUser;
  endTime: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  latitude?: Maybe<Scalars['Float']['output']>;
  longitude?: Maybe<Scalars['Float']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  pagarmeOrderId?: Maybe<Scalars['String']['output']>;
  paymentMethod?: Maybe<Scalars['String']['output']>;
  paymentStatus?: Maybe<Scalars['String']['output']>;
  pixQrCode?: Maybe<Scalars['String']['output']>;
  pixQrCodeBase64?: Maybe<Scalars['String']['output']>;
  price?: Maybe<Scalars['Float']['output']>;
  quoteDescription?: Maybe<Scalars['String']['output']>;
  quoteResponse?: Maybe<Scalars['String']['output']>;
  scheduledDate: Scalars['String']['output'];
  scheduledTime: Scalars['String']['output'];
  service: Service;
  status: AppointmentStatus;
  store: Store;
  updatedAt: Scalars['DateTime']['output'];
};

export enum AppointmentStatus {
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Confirmed = 'CONFIRMED',
  NoShow = 'NO_SHOW',
  Pending = 'PENDING',
  Quoted = 'QUOTED',
  QuoteAccepted = 'QUOTE_ACCEPTED',
  QuoteRejected = 'QUOTE_REJECTED',
  QuoteRequested = 'QUOTE_REQUESTED'
}

export type ApprovalLog = {
  __typename?: 'ApprovalLog';
  action: Scalars['String']['output'];
  adminId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  identityPhotoBackUrl?: Maybe<Scalars['String']['output']>;
  identityPhotoUrl?: Maybe<Scalars['String']['output']>;
  profilePhotoUrl?: Maybe<Scalars['String']['output']>;
  reason?: Maybe<Scalars['String']['output']>;
  role: Scalars['String']['output'];
  userEmail: Scalars['String']['output'];
  userId: Scalars['String']['output'];
  userName: Scalars['String']['output'];
  userType: Scalars['String']['output'];
};

export type BarcodeLookupResult = {
  __typename?: 'BarcodeLookupResult';
  barcode: Scalars['String']['output'];
  brand?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  imageUrl?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  quantity?: Maybe<Scalars['String']['output']>;
};

export type BulkCreateProductsInput = {
  products: Array<BulkProductItem>;
  storeId: Scalars['String']['input'];
};

export type BulkImportResult = {
  __typename?: 'BulkImportResult';
  created: Scalars['Int']['output'];
  errors: Array<Scalars['String']['output']>;
};

export type BulkProductItem = {
  barcode?: InputMaybe<Scalars['String']['input']>;
  categoryId?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  isVariableWeight?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  price: Scalars['Float']['input'];
  stock?: InputMaybe<Scalars['Float']['input']>;
  unit?: InputMaybe<Scalars['String']['input']>;
};

export type CartItem = {
  __typename?: 'CartItem';
  createdAt: Scalars['DateTime']['output'];
  customer: AppUser;
  id: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  product: Product;
  quantity: Scalars['Int']['output'];
  store: Store;
  updatedAt: Scalars['DateTime']['output'];
  weightGrams?: Maybe<Scalars['Int']['output']>;
};

export type CartProductSummary = {
  __typename?: 'CartProductSummary';
  productId: Scalars['ID']['output'];
  productImageUrl?: Maybe<Scalars['String']['output']>;
  productName: Scalars['String']['output'];
  totalPeople: Scalars['Int']['output'];
  totalQuantity: Scalars['Int']['output'];
};

export type Category = {
  __typename?: 'Category';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  products?: Maybe<Array<Product>>;
  requiresAgeVerification: Scalars['Boolean']['output'];
  sortOrder: Scalars['Float']['output'];
  store: Store;
};

export type Coupon = {
  __typename?: 'Coupon';
  code: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  discountType: Scalars['String']['output'];
  discountValue: Scalars['Float']['output'];
  expiresAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  maxDiscount?: Maybe<Scalars['Float']['output']>;
  maxUses: Scalars['Int']['output'];
  minimumOrder?: Maybe<Scalars['Float']['output']>;
  store: Store;
  updatedAt: Scalars['DateTime']['output'];
  usesCount: Scalars['Int']['output'];
};

export type CouponValidation = {
  __typename?: 'CouponValidation';
  couponId: Scalars['String']['output'];
  discount: Scalars['Float']['output'];
  message: Scalars['String']['output'];
  valid: Scalars['Boolean']['output'];
};

export type CreateAddressInput = {
  city: Scalars['String']['input'];
  complement?: InputMaybe<Scalars['String']['input']>;
  isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  latitude: Scalars['Float']['input'];
  longitude: Scalars['Float']['input'];
  neighborhood: Scalars['String']['input'];
  number: Scalars['String']['input'];
  state: Scalars['String']['input'];
  street: Scalars['String']['input'];
  zipCode: Scalars['String']['input'];
};

export type CreateAppointmentInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  cardId?: InputMaybe<Scalars['String']['input']>;
  cardToken?: InputMaybe<Scalars['String']['input']>;
  latitude?: InputMaybe<Scalars['Float']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  /** ON_SERVICE | PIX | CREDIT_CARD */
  paymentMethod?: InputMaybe<Scalars['String']['input']>;
  scheduledDate: Scalars['String']['input'];
  scheduledTime: Scalars['String']['input'];
  serviceId: Scalars['String']['input'];
  storeId: Scalars['String']['input'];
};

export type CreateCouponInput = {
  code: Scalars['String']['input'];
  discountType?: Scalars['String']['input'];
  discountValue: Scalars['Float']['input'];
  expiresAt?: InputMaybe<Scalars['DateTime']['input']>;
  maxDiscount?: InputMaybe<Scalars['Float']['input']>;
  maxUses?: InputMaybe<Scalars['Int']['input']>;
  minimumOrder?: InputMaybe<Scalars['Float']['input']>;
  storeId: Scalars['String']['input'];
};

export type CreateOrderInput = {
  ageVerified?: InputMaybe<Scalars['Boolean']['input']>;
  cardId?: InputMaybe<Scalars['String']['input']>;
  cardToken?: InputMaybe<Scalars['String']['input']>;
  couponCode?: InputMaybe<Scalars['String']['input']>;
  deliveryAddress?: InputMaybe<Scalars['String']['input']>;
  deliveryLatitude?: InputMaybe<Scalars['Float']['input']>;
  deliveryLongitude?: InputMaybe<Scalars['Float']['input']>;
  isPickup?: InputMaybe<Scalars['Boolean']['input']>;
  items: Array<OrderItemInput>;
  notes?: InputMaybe<Scalars['String']['input']>;
  paymentMethod?: InputMaybe<Scalars['String']['input']>;
  storeId: Scalars['String']['input'];
};

export type CreateProductInput = {
  barcode?: InputMaybe<Scalars['String']['input']>;
  categoryId?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  isVariableWeight?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  price: Scalars['Float']['input'];
  stock?: InputMaybe<Scalars['Float']['input']>;
  storeId: Scalars['String']['input'];
  unit?: InputMaybe<Scalars['String']['input']>;
};

export type CreatePromotionInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  endDate: Scalars['DateTime']['input'];
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  productId?: InputMaybe<Scalars['String']['input']>;
  promotionalPrice: Scalars['Float']['input'];
  startDate: Scalars['DateTime']['input'];
  storeId: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type CreateServiceInput = {
  categoryId?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  estimatedDuration?: InputMaybe<Scalars['Int']['input']>;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  price?: InputMaybe<Scalars['Float']['input']>;
  requiresQuote?: InputMaybe<Scalars['Boolean']['input']>;
  storeId: Scalars['String']['input'];
};

export type CreateServiceRatingInput = {
  appointmentId: Scalars['String']['input'];
  comment?: InputMaybe<Scalars['String']['input']>;
  photoUrls?: InputMaybe<Array<Scalars['String']['input']>>;
  rating: Scalars['Int']['input'];
};

export type CreateStoreInput = {
  bannerUrl?: InputMaybe<Scalars['String']['input']>;
  city: Scalars['String']['input'];
  complement?: InputMaybe<Scalars['String']['input']>;
  deliveryEndTime?: InputMaybe<Scalars['String']['input']>;
  deliveryFee?: InputMaybe<Scalars['Float']['input']>;
  deliveryStartTime?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  estimatedDeliveryMinutes?: InputMaybe<Scalars['Float']['input']>;
  freeDelivery?: InputMaybe<Scalars['Boolean']['input']>;
  freeDeliveryAbove?: InputMaybe<Scalars['Float']['input']>;
  hasOwnDelivery?: InputMaybe<Scalars['Boolean']['input']>;
  latitude?: InputMaybe<Scalars['Float']['input']>;
  logoUrl?: InputMaybe<Scalars['String']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  minimumOrder?: InputMaybe<Scalars['Float']['input']>;
  name: Scalars['String']['input'];
  neighborhood: Scalars['String']['input'];
  number: Scalars['String']['input'];
  phone: Scalars['String']['input'];
  state: Scalars['String']['input'];
  storeType?: InputMaybe<StoreType>;
  street: Scalars['String']['input'];
  zipCode: Scalars['String']['input'];
};

export type DashboardStats = {
  __typename?: 'DashboardStats';
  activeDeliveries: Scalars['Int']['output'];
  appointmentRevenue: Scalars['Float']['output'];
  avgTicket: Scalars['Float']['output'];
  cancellationRate: Scalars['Float']['output'];
  completedDeliveries: Scalars['Int']['output'];
  onlineDeliverers: Scalars['Int']['output'];
  ordersByDay: Array<DayStats>;
  ordersByStatus: Array<StatusCount>;
  pendingApprovals: Scalars['Int']['output'];
  platformRevenue: Scalars['Float']['output'];
  recentOrders: Array<RecentOrder>;
  topStores: Array<TopStore>;
  totalAppointments: Scalars['Int']['output'];
  totalDeliveries: Scalars['Int']['output'];
  totalOrders: Scalars['Int']['output'];
  totalRevenue: Scalars['Float']['output'];
  totalStores: Scalars['Int']['output'];
  totalUsers: Scalars['Int']['output'];
  usersByRole: Array<RoleCount>;
};

export type DayStats = {
  __typename?: 'DayStats';
  count: Scalars['Int']['output'];
  date: Scalars['String']['output'];
  revenue: Scalars['Float']['output'];
};

export type Delivery = {
  __typename?: 'Delivery';
  createdAt: Scalars['DateTime']['output'];
  currentLatitude?: Maybe<Scalars['Float']['output']>;
  currentLongitude?: Maybe<Scalars['Float']['output']>;
  deliveredAt?: Maybe<Scalars['DateTime']['output']>;
  deliverer?: Maybe<AppUser>;
  id: Scalars['ID']['output'];
  order: Order;
  payoutAmount?: Maybe<Scalars['Float']['output']>;
  payoutMpId?: Maybe<Scalars['String']['output']>;
  payoutStatus?: Maybe<Scalars['String']['output']>;
  pickedUpAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  vendorPayoutAmount?: Maybe<Scalars['Float']['output']>;
  vendorPayoutMpId?: Maybe<Scalars['String']['output']>;
  vendorPayoutStatus?: Maybe<Scalars['String']['output']>;
};

export type FrequentStore = {
  __typename?: 'FrequentStore';
  bannerUrl?: Maybe<Scalars['String']['output']>;
  deliveryFee: Scalars['Float']['output'];
  description?: Maybe<Scalars['String']['output']>;
  freeDelivery: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  isOpen: Scalars['Boolean']['output'];
  lastOrderAt: Scalars['DateTime']['output'];
  logoUrl?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  orderCount: Scalars['Int']['output'];
  verificationLevel?: Maybe<Scalars['String']['output']>;
};

export type LoginInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  acceptAppTerms: AppUser;
  acceptDelivery: Delivery;
  acceptQuote: Appointment;
  acceptSubscriptionTerms: VendorUser;
  acceptVendorTerms: VendorUser;
  addToCart: CartItem;
  adjustOrderItemWeight: Order;
  adminDeleteCoupon: Scalars['Boolean']['output'];
  adminToggleCoupon: Coupon;
  approveAppUser: AppUser;
  approveVendorUser: VendorUser;
  bulkCreateProducts: BulkImportResult;
  cancelAppointment: Appointment;
  cancelDispute: Order;
  cancelOrder: Order;
  claimBadgeReward: Store;
  clearAllNotifications: Scalars['Boolean']['output'];
  clearCart: Scalars['Boolean']['output'];
  clearCartByStore: Scalars['Boolean']['output'];
  completeAppointment: Appointment;
  confirmAppointment: Appointment;
  confirmDelivery: Delivery;
  confirmEmailVerification: Scalars['Boolean']['output'];
  confirmPickup: Delivery;
  confirmReceipt: Order;
  createAddress: Address;
  createAppointment: Appointment;
  createCategory: Category;
  createCoupon: Coupon;
  createOrder: Order;
  createPlanUpgrade: Payment;
  createProduct: Product;
  createPromotion: Promotion;
  createService: Service;
  createStore: Store;
  customerDenyDelivery: Order;
  deleteAddress: Scalars['Boolean']['output'];
  deleteCard: Scalars['Boolean']['output'];
  deleteCategory: Scalars['Boolean']['output'];
  deleteCoupon: Scalars['Boolean']['output'];
  deleteNotification: Scalars['Boolean']['output'];
  deleteProduct: Scalars['Boolean']['output'];
  deletePromotion: Scalars['Boolean']['output'];
  deleteService: Scalars['Boolean']['output'];
  disconnectPayment: Scalars['Boolean']['output'];
  disputeCompletedOrder: Order;
  followStore: Scalars['Boolean']['output'];
  googleAuthApp: AppAuthResponse;
  googleAuthVendor: VendorAuthResponse;
  loginApp: AppAuthResponse;
  loginVendor: VendorAuthResponse;
  logout: Scalars['Boolean']['output'];
  markNoShow: Appointment;
  markPromotionPaid: Promotion;
  rateService: ServiceRating;
  recalculateVerification: Store;
  refundOrder: Order;
  registerApp: AppAuthResponse;
  registerAppPushToken: Scalars['Boolean']['output'];
  registerAppWithGoogle: AppAuthResponse;
  registerAsDeliverer: AppUser;
  registerRecipient: Scalars['Boolean']['output'];
  registerSuperadmin: AppUser;
  registerVendor: VendorAuthResponse;
  registerVendorPushToken: Scalars['Boolean']['output'];
  registerVendorWithGoogle: VendorAuthResponse;
  rejectAppUser: AppUser;
  rejectOrder: Order;
  rejectQuote: Appointment;
  rejectVendorUser: VendorUser;
  removeFromCart: Scalars['Boolean']['output'];
  requestAnticipation: AnticipationResult;
  requestCancelDispute: Order;
  requestPasswordResetApp: Scalars['String']['output'];
  requestPasswordResetVendor: Scalars['String']['output'];
  requestQuote: Appointment;
  requestStoreDelete: Scalars['Boolean']['output'];
  requestVendorStoreDelete: Scalars['Boolean']['output'];
  resendNotification: Scalars['Boolean']['output'];
  resetPassword: Scalars['Boolean']['output'];
  resolveDispute: Order;
  respondQuote: Appointment;
  restoreProduct: Product;
  saveCard: SavedCard;
  sendEmailVerification: Scalars['Boolean']['output'];
  sendVerificationCode: Scalars['String']['output'];
  setDefaultAddress: Address;
  setDeliveryBasePrice: PlatformConfig;
  setDeliveryCommissionPercent: PlatformConfig;
  setDeliveryPricePerKm: PlatformConfig;
  setMinimumOrderPlatform: PlatformConfig;
  setPromoPricePerDay: PlatformConfig;
  setSchedule: Array<Schedule>;
  setStoreVerification: Store;
  simulatePayment: Order;
  swapPromotionProduct: Promotion;
  toggleAppUserActive: AppUser;
  toggleAutoAnticipation: Scalars['Boolean']['output'];
  toggleCouponActive: Coupon;
  toggleProductActive: Product;
  toggleProductAvailability: Product;
  togglePromotionActive: Promotion;
  toggleStoreActive: Store;
  toggleStoreOpen: Store;
  toggleVendorUserActive: VendorUser;
  unfollowStore: Scalars['Boolean']['output'];
  updateAddress: Address;
  updateAppProfile: AppUser;
  updateAppUserRole: AppUser;
  updateBadgePoints: Scalars['Boolean']['output'];
  updateBadgeRewards: Scalars['Boolean']['output'];
  updateBadgeThresholds: Scalars['Boolean']['output'];
  updateCartItem: CartItem;
  updateCategory: Category;
  updateContractContent: Scalars['Boolean']['output'];
  updateCoupon: Coupon;
  updateNotificationEmail: AppUser;
  updateOrderStatus: Order;
  updatePlanConfig: Scalars['Boolean']['output'];
  updateProduct: Product;
  updateService: Service;
  updateStore: Store;
  updateSuperadminPermissions: AppUser;
  updateVendorPlan: VendorUser;
  updateVendorProfile: VendorUser;
  uploadFromUrl: Scalars['String']['output'];
  uploadImage: Scalars['String']['output'];
  validateDocumentPhoto: PhotoValidation;
  validateFacePhoto: PhotoValidation;
  validateRegistration: ValidationResult;
  vendorCancelAppointment: Appointment;
  vendorCancelOrder: Order;
  vendorConfirmPickup: Order;
  verifyCode: Scalars['Boolean']['output'];
};


export type MutationAcceptDeliveryArgs = {
  orderId: Scalars['String']['input'];
};


export type MutationAcceptQuoteArgs = {
  id: Scalars['String']['input'];
  scheduledDate: Scalars['String']['input'];
  scheduledTime: Scalars['String']['input'];
};


export type MutationAddToCartArgs = {
  input: AddToCartInput;
};


export type MutationAdjustOrderItemWeightArgs = {
  actualWeightGrams: Scalars['Int']['input'];
  orderItemId: Scalars['String']['input'];
};


export type MutationAdminDeleteCouponArgs = {
  id: Scalars['String']['input'];
};


export type MutationAdminToggleCouponArgs = {
  id: Scalars['String']['input'];
};


export type MutationApproveAppUserArgs = {
  id: Scalars['String']['input'];
};


export type MutationApproveVendorUserArgs = {
  id: Scalars['String']['input'];
};


export type MutationBulkCreateProductsArgs = {
  input: BulkCreateProductsInput;
};


export type MutationCancelAppointmentArgs = {
  id: Scalars['String']['input'];
};


export type MutationCancelDisputeArgs = {
  orderId: Scalars['String']['input'];
};


export type MutationCancelOrderArgs = {
  orderId: Scalars['String']['input'];
};


export type MutationClaimBadgeRewardArgs = {
  level: Scalars['String']['input'];
  storeId: Scalars['String']['input'];
};


export type MutationClearCartByStoreArgs = {
  storeId: Scalars['String']['input'];
};


export type MutationCompleteAppointmentArgs = {
  id: Scalars['String']['input'];
};


export type MutationConfirmAppointmentArgs = {
  id: Scalars['String']['input'];
};


export type MutationConfirmDeliveryArgs = {
  deliveryId: Scalars['String']['input'];
};


export type MutationConfirmEmailVerificationArgs = {
  code: Scalars['String']['input'];
  userType?: Scalars['String']['input'];
};


export type MutationConfirmPickupArgs = {
  deliveryId: Scalars['String']['input'];
};


export type MutationConfirmReceiptArgs = {
  orderId: Scalars['String']['input'];
};


export type MutationCreateAddressArgs = {
  input: CreateAddressInput;
};


export type MutationCreateAppointmentArgs = {
  input: CreateAppointmentInput;
};


export type MutationCreateCategoryArgs = {
  name: Scalars['String']['input'];
  requiresAgeVerification?: InputMaybe<Scalars['Boolean']['input']>;
  storeId: Scalars['String']['input'];
};


export type MutationCreateCouponArgs = {
  input: CreateCouponInput;
};


export type MutationCreateOrderArgs = {
  input: CreateOrderInput;
};


export type MutationCreatePlanUpgradeArgs = {
  billingPeriod?: InputMaybe<Scalars['String']['input']>;
  plan: VendorPlan;
};


export type MutationCreateProductArgs = {
  input: CreateProductInput;
};


export type MutationCreatePromotionArgs = {
  input: CreatePromotionInput;
};


export type MutationCreateServiceArgs = {
  input: CreateServiceInput;
};


export type MutationCreateStoreArgs = {
  input: CreateStoreInput;
};


export type MutationCustomerDenyDeliveryArgs = {
  orderId: Scalars['String']['input'];
  reason: Scalars['String']['input'];
};


export type MutationDeleteAddressArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteCardArgs = {
  cardId: Scalars['String']['input'];
};


export type MutationDeleteCategoryArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteCouponArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteNotificationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteProductArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeletePromotionArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteServiceArgs = {
  id: Scalars['String']['input'];
};


export type MutationDisputeCompletedOrderArgs = {
  orderId: Scalars['String']['input'];
  reason: Scalars['String']['input'];
};


export type MutationFollowStoreArgs = {
  storeId: Scalars['String']['input'];
};


export type MutationGoogleAuthAppArgs = {
  idToken: Scalars['String']['input'];
};


export type MutationGoogleAuthVendorArgs = {
  forceLogin?: InputMaybe<Scalars['Boolean']['input']>;
  idToken: Scalars['String']['input'];
};


export type MutationLoginAppArgs = {
  forceLogin?: InputMaybe<Scalars['Boolean']['input']>;
  input: LoginInput;
};


export type MutationLoginVendorArgs = {
  forceLogin?: InputMaybe<Scalars['Boolean']['input']>;
  input: LoginInput;
};


export type MutationMarkNoShowArgs = {
  id: Scalars['String']['input'];
};


export type MutationMarkPromotionPaidArgs = {
  id: Scalars['String']['input'];
};


export type MutationRateServiceArgs = {
  input: CreateServiceRatingInput;
};


export type MutationRecalculateVerificationArgs = {
  storeId: Scalars['String']['input'];
};


export type MutationRefundOrderArgs = {
  orderId: Scalars['String']['input'];
};


export type MutationRegisterAppArgs = {
  input: RegisterAppInput;
};


export type MutationRegisterAppPushTokenArgs = {
  token: Scalars['String']['input'];
};


export type MutationRegisterAppWithGoogleArgs = {
  cpf: Scalars['String']['input'];
  idToken: Scalars['String']['input'];
  phone: Scalars['String']['input'];
};


export type MutationRegisterAsDelivererArgs = {
  input: RegisterDelivererInput;
};


export type MutationRegisterRecipientArgs = {
  recipientData: Scalars['String']['input'];
};


export type MutationRegisterSuperadminArgs = {
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
  permissions?: InputMaybe<Scalars['String']['input']>;
  phone: Scalars['String']['input'];
};


export type MutationRegisterVendorArgs = {
  input: RegisterVendorInput;
};


export type MutationRegisterVendorPushTokenArgs = {
  token: Scalars['String']['input'];
};


export type MutationRegisterVendorWithGoogleArgs = {
  cpf: Scalars['String']['input'];
  idToken: Scalars['String']['input'];
  phone: Scalars['String']['input'];
};


export type MutationRejectAppUserArgs = {
  id: Scalars['String']['input'];
  reason: Scalars['String']['input'];
};


export type MutationRejectOrderArgs = {
  orderId: Scalars['String']['input'];
  reason: Scalars['String']['input'];
};


export type MutationRejectQuoteArgs = {
  id: Scalars['String']['input'];
};


export type MutationRejectVendorUserArgs = {
  id: Scalars['String']['input'];
  reason: Scalars['String']['input'];
};


export type MutationRemoveFromCartArgs = {
  cartItemId: Scalars['String']['input'];
};


export type MutationRequestCancelDisputeArgs = {
  orderId: Scalars['String']['input'];
};


export type MutationRequestPasswordResetAppArgs = {
  email: Scalars['String']['input'];
};


export type MutationRequestPasswordResetVendorArgs = {
  email: Scalars['String']['input'];
};


export type MutationRequestQuoteArgs = {
  input: RequestQuoteInput;
};


export type MutationRequestStoreDeleteArgs = {
  password: Scalars['String']['input'];
  storeId: Scalars['String']['input'];
};


export type MutationRequestVendorStoreDeleteArgs = {
  password: Scalars['String']['input'];
  storeId: Scalars['String']['input'];
};


export type MutationResendNotificationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationResetPasswordArgs = {
  newPassword: Scalars['String']['input'];
  token: Scalars['String']['input'];
  type?: Scalars['String']['input'];
};


export type MutationResolveDisputeArgs = {
  orderId: Scalars['String']['input'];
  resolution: Scalars['String']['input'];
};


export type MutationRespondQuoteArgs = {
  id: Scalars['String']['input'];
  price: Scalars['Float']['input'];
  response: Scalars['String']['input'];
};


export type MutationRestoreProductArgs = {
  id: Scalars['String']['input'];
};


export type MutationSaveCardArgs = {
  token: Scalars['String']['input'];
};


export type MutationSendEmailVerificationArgs = {
  userType?: Scalars['String']['input'];
};


export type MutationSendVerificationCodeArgs = {
  input: SendCodeInput;
};


export type MutationSetDefaultAddressArgs = {
  id: Scalars['String']['input'];
};


export type MutationSetDeliveryBasePriceArgs = {
  price: Scalars['Float']['input'];
};


export type MutationSetDeliveryCommissionPercentArgs = {
  percent: Scalars['Float']['input'];
};


export type MutationSetDeliveryPricePerKmArgs = {
  price: Scalars['Float']['input'];
};


export type MutationSetMinimumOrderPlatformArgs = {
  price: Scalars['Float']['input'];
};


export type MutationSetPromoPricePerDayArgs = {
  price: Scalars['Float']['input'];
};


export type MutationSetScheduleArgs = {
  input: SetScheduleInput;
};


export type MutationSetStoreVerificationArgs = {
  level: VerificationLevel;
  score?: InputMaybe<Scalars['Float']['input']>;
  storeId: Scalars['String']['input'];
};


export type MutationSimulatePaymentArgs = {
  orderId: Scalars['String']['input'];
};


export type MutationSwapPromotionProductArgs = {
  id: Scalars['String']['input'];
  productId: Scalars['String']['input'];
  promotionalPrice: Scalars['Float']['input'];
  title: Scalars['String']['input'];
};


export type MutationToggleAppUserActiveArgs = {
  id: Scalars['String']['input'];
};


export type MutationToggleAutoAnticipationArgs = {
  enabled: Scalars['Boolean']['input'];
};


export type MutationToggleCouponActiveArgs = {
  id: Scalars['String']['input'];
};


export type MutationToggleProductActiveArgs = {
  id: Scalars['String']['input'];
};


export type MutationToggleProductAvailabilityArgs = {
  id: Scalars['String']['input'];
};


export type MutationTogglePromotionActiveArgs = {
  id: Scalars['String']['input'];
};


export type MutationToggleStoreActiveArgs = {
  id: Scalars['String']['input'];
};


export type MutationToggleStoreOpenArgs = {
  id: Scalars['String']['input'];
};


export type MutationToggleVendorUserActiveArgs = {
  id: Scalars['String']['input'];
};


export type MutationUnfollowStoreArgs = {
  storeId: Scalars['String']['input'];
};


export type MutationUpdateAddressArgs = {
  input: UpdateAddressInput;
};


export type MutationUpdateAppProfileArgs = {
  avatarUrl?: InputMaybe<Scalars['String']['input']>;
  currentPassword?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  newPassword?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateAppUserRoleArgs = {
  id: Scalars['String']['input'];
  role: UserRole;
};


export type MutationUpdateBadgePointsArgs = {
  points: Scalars['String']['input'];
};


export type MutationUpdateBadgeRewardsArgs = {
  level: Scalars['String']['input'];
  rewards: Scalars['String']['input'];
};


export type MutationUpdateBadgeThresholdsArgs = {
  thresholds: Scalars['String']['input'];
};


export type MutationUpdateCartItemArgs = {
  input: UpdateCartItemInput;
};


export type MutationUpdateCategoryArgs = {
  id: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  requiresAgeVerification?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationUpdateContractContentArgs = {
  content: Scalars['String']['input'];
  type: Scalars['String']['input'];
};


export type MutationUpdateCouponArgs = {
  input: UpdateCouponInput;
};


export type MutationUpdateNotificationEmailArgs = {
  email: Scalars['String']['input'];
};


export type MutationUpdateOrderStatusArgs = {
  id: Scalars['String']['input'];
  status: OrderStatus;
};


export type MutationUpdatePlanConfigArgs = {
  annualPrice: Scalars['Float']['input'];
  canUseCoupons: Scalars['Boolean']['input'];
  commissionPercent: Scalars['Float']['input'];
  freePromosPerWeek: Scalars['Int']['input'];
  hasAnalytics: Scalars['Boolean']['input'];
  highlightDaysPerMonth: Scalars['Int']['input'];
  isContactSales: Scalars['Boolean']['input'];
  listingPriority: Scalars['Int']['input'];
  maxEmailsPerMonth: Scalars['Int']['input'];
  maxProductsPerStore: Scalars['Int']['input'];
  maxStores: Scalars['Int']['input'];
  monthlyPrice: Scalars['Float']['input'];
  plan: VendorPlan;
  quarterlyPrice: Scalars['Float']['input'];
  semiannualPrice: Scalars['Float']['input'];
  supportLevel: Scalars['String']['input'];
};


export type MutationUpdateProductArgs = {
  input: UpdateProductInput;
};


export type MutationUpdateServiceArgs = {
  input: UpdateServiceInput;
};


export type MutationUpdateStoreArgs = {
  input: UpdateStoreInput;
};


export type MutationUpdateSuperadminPermissionsArgs = {
  id: Scalars['String']['input'];
  permissions: Scalars['String']['input'];
};


export type MutationUpdateVendorPlanArgs = {
  durationMonths?: Scalars['Int']['input'];
  id: Scalars['String']['input'];
  plan: VendorPlan;
};


export type MutationUpdateVendorProfileArgs = {
  currentPassword?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  newPassword?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUploadFromUrlArgs = {
  folder?: InputMaybe<Scalars['String']['input']>;
  url: Scalars['String']['input'];
};


export type MutationUploadImageArgs = {
  base64: Scalars['String']['input'];
  folder?: InputMaybe<Scalars['String']['input']>;
};


export type MutationValidateDocumentPhotoArgs = {
  imageUrl: Scalars['String']['input'];
};


export type MutationValidateFacePhotoArgs = {
  imageUrl: Scalars['String']['input'];
};


export type MutationValidateRegistrationArgs = {
  cpf: Scalars['String']['input'];
  email: Scalars['String']['input'];
  phone: Scalars['String']['input'];
  userType?: Scalars['String']['input'];
};


export type MutationVendorCancelAppointmentArgs = {
  id: Scalars['String']['input'];
};


export type MutationVendorCancelOrderArgs = {
  orderId: Scalars['String']['input'];
  reason: Scalars['String']['input'];
};


export type MutationVendorConfirmPickupArgs = {
  orderId: Scalars['String']['input'];
};


export type MutationVerifyCodeArgs = {
  input: VerifyCodeInput;
};

export type NotificationLog = {
  __typename?: 'NotificationLog';
  createdAt: Scalars['DateTime']['output'];
  error?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  message: Scalars['String']['output'];
  retryCount: Scalars['Float']['output'];
  subject: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
  to: Scalars['String']['output'];
  type: Scalars['String']['output'];
  userName: Scalars['String']['output'];
  vendorId?: Maybe<Scalars['String']['output']>;
};

export type Order = {
  __typename?: 'Order';
  capturedAt?: Maybe<Scalars['DateTime']['output']>;
  checkoutUrl?: Maybe<Scalars['String']['output']>;
  commissionAmount?: Maybe<Scalars['Float']['output']>;
  commissionPercent?: Maybe<Scalars['Float']['output']>;
  completedAt?: Maybe<Scalars['DateTime']['output']>;
  coupon?: Maybe<Coupon>;
  couponCode?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  customer: AppUser;
  customerConfirmedAt?: Maybe<Scalars['DateTime']['output']>;
  delivererConfirmedDeliveryAt?: Maybe<Scalars['DateTime']['output']>;
  delivery?: Maybe<Delivery>;
  deliveryAddress?: Maybe<Scalars['String']['output']>;
  deliveryFee: Scalars['Float']['output'];
  deliveryLatitude?: Maybe<Scalars['Float']['output']>;
  deliveryLongitude?: Maybe<Scalars['Float']['output']>;
  discount?: Maybe<Scalars['Float']['output']>;
  disputeReason?: Maybe<Scalars['String']['output']>;
  disputeResolution?: Maybe<Scalars['String']['output']>;
  disputeResolvedAt?: Maybe<Scalars['DateTime']['output']>;
  disputedAt?: Maybe<Scalars['DateTime']['output']>;
  estimatedDeliveryEta?: Maybe<Scalars['DateTime']['output']>;
  estimatedPickupEta?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isPickup: Scalars['Boolean']['output'];
  isSettled: Scalars['Boolean']['output'];
  items: Array<OrderItem>;
  mpPreferenceId?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  orderNumber: Scalars['String']['output'];
  paymentMethod?: Maybe<Scalars['String']['output']>;
  pixQrCode?: Maybe<Scalars['String']['output']>;
  pixQrCodeBase64?: Maybe<Scalars['String']['output']>;
  preAuthChargeId?: Maybe<Scalars['String']['output']>;
  rejectedAt?: Maybe<Scalars['DateTime']['output']>;
  rejectionReason?: Maybe<Scalars['String']['output']>;
  status: OrderStatus;
  store: Store;
  subtotal: Scalars['Float']['output'];
  total: Scalars['Float']['output'];
  updatedAt: Scalars['DateTime']['output'];
  vendorConfirmedPickupAt?: Maybe<Scalars['DateTime']['output']>;
};

export type OrderItem = {
  __typename?: 'OrderItem';
  id: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  order: Order;
  product?: Maybe<Product>;
  quantity: Scalars['Int']['output'];
  totalPrice: Scalars['Float']['output'];
  unitPrice: Scalars['Float']['output'];
  weightGrams?: Maybe<Scalars['Int']['output']>;
};

export type OrderItemInput = {
  notes?: InputMaybe<Scalars['String']['input']>;
  productId: Scalars['String']['input'];
  quantity: Scalars['Int']['input'];
  weightGrams?: InputMaybe<Scalars['Int']['input']>;
};

export enum OrderStatus {
  Accepted = 'ACCEPTED',
  AwaitingPayment = 'AWAITING_PAYMENT',
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Delivered = 'DELIVERED',
  DelivererConfirmedDelivery = 'DELIVERER_CONFIRMED_DELIVERY',
  Delivering = 'DELIVERING',
  Disputed = 'DISPUTED',
  Expired = 'EXPIRED',
  PaymentReview = 'PAYMENT_REVIEW',
  Pending = 'PENDING',
  PickedUp = 'PICKED_UP',
  Preparing = 'PREPARING',
  Ready = 'READY',
  Rejected = 'REJECTED',
  VendorConfirmedPickup = 'VENDOR_CONFIRMED_PICKUP'
}

export type Payment = {
  __typename?: 'Payment';
  amount: Scalars['Float']['output'];
  appUser?: Maybe<AppUser>;
  checkoutUrl?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  metadata?: Maybe<Scalars['String']['output']>;
  mpPaymentId?: Maybe<Scalars['String']['output']>;
  mpPreferenceId?: Maybe<Scalars['String']['output']>;
  pagarmeOrderId?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
  type: Scalars['String']['output'];
  vendorUser?: Maybe<VendorUser>;
};

export type PhotoValidation = {
  __typename?: 'PhotoValidation';
  message: Scalars['String']['output'];
  valid: Scalars['Boolean']['output'];
};

export type PlanInfo = {
  __typename?: 'PlanInfo';
  annualPrice: Scalars['Float']['output'];
  canUseCoupons: Scalars['Boolean']['output'];
  commissionPercent: Scalars['Float']['output'];
  freePromosPerWeek: Scalars['Int']['output'];
  hasAnalytics: Scalars['Boolean']['output'];
  highlightDaysPerMonth: Scalars['Int']['output'];
  isContactSales: Scalars['Boolean']['output'];
  listingPriority: Scalars['Int']['output'];
  maxEmailsPerMonth: Scalars['Int']['output'];
  maxProductsPerStore: Scalars['Int']['output'];
  maxStores: Scalars['Int']['output'];
  monthlyPrice: Scalars['Float']['output'];
  plan: VendorPlan;
  quarterlyPrice: Scalars['Float']['output'];
  semiannualPrice: Scalars['Float']['output'];
  supportLevel: Scalars['String']['output'];
};

export type PlatformConfig = {
  __typename?: 'PlatformConfig';
  id: Scalars['ID']['output'];
  key: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  value: Scalars['String']['output'];
};

export type PopularProduct = {
  __typename?: 'PopularProduct';
  categoryId?: Maybe<Scalars['String']['output']>;
  categoryName?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  isAvailable: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  price: Scalars['Float']['output'];
  promotionalPrice?: Maybe<Scalars['Float']['output']>;
  storeId: Scalars['String']['output'];
  storeIsOpen: Scalars['Boolean']['output'];
  storeLogoUrl?: Maybe<Scalars['String']['output']>;
  storeName: Scalars['String']['output'];
  totalSold: Scalars['Int']['output'];
  unit?: Maybe<Scalars['String']['output']>;
};

export type Product = {
  __typename?: 'Product';
  barcode?: Maybe<Scalars['String']['output']>;
  category?: Maybe<Category>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  isAvailable: Scalars['Boolean']['output'];
  isVariableWeight: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  price: Scalars['Float']['output'];
  promotionalPrice?: Maybe<Scalars['Float']['output']>;
  stock: Scalars['Float']['output'];
  store: Store;
  unit?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type ProductDeletedPayload = {
  __typename?: 'ProductDeletedPayload';
  id: Scalars['ID']['output'];
  storeId?: Maybe<Scalars['String']['output']>;
};

export type Promotion = {
  __typename?: 'Promotion';
  adCost: Scalars['Float']['output'];
  checkoutUrl?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  endDate: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  isPaid: Scalars['Boolean']['output'];
  price?: Maybe<Scalars['Float']['output']>;
  product?: Maybe<Product>;
  promotionalPrice: Scalars['Float']['output'];
  startDate: Scalars['DateTime']['output'];
  store: Store;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type Query = {
  __typename?: 'Query';
  activePromotions: Array<Promotion>;
  allAppUsers: Array<AppUser>;
  allCoupons: Array<Coupon>;
  allDeliveries: Array<Delivery>;
  allOrders: Array<Order>;
  allPayments: Array<Payment>;
  allPromotions: Array<Promotion>;
  allServicesByStore: Array<Service>;
  allStores: Array<Store>;
  allVendorUsers: Array<VendorUser>;
  appointment: Appointment;
  approvalLogs: Array<ApprovalLog>;
  availableDeliveries: Array<Order>;
  availablePlans: Array<PlanInfo>;
  availableSlots: Array<Scalars['String']['output']>;
  averageStoreRating: Scalars['Float']['output'];
  badgeConfig: Scalars['String']['output'];
  calculateDeliveryFee: Scalars['Float']['output'];
  categoriesByStore: Array<Category>;
  contractContent: Scalars['String']['output'];
  contractUpdatedAt?: Maybe<Scalars['String']['output']>;
  dashboardStats: DashboardStats;
  deletedProductsByStore: Array<Product>;
  deliveryBasePrice: Scalars['Float']['output'];
  deliveryCommissionPercent: Scalars['Float']['output'];
  deliveryPricePerKm: Scalars['Float']['output'];
  disputedOrders: Array<Order>;
  estimatedDeliveryTime: Scalars['Float']['output'];
  followedStores: Array<Store>;
  followerCount: Scalars['Int']['output'];
  frequentStores: Array<FrequentStore>;
  isFollowingStore: Scalars['Boolean']['output'];
  lookupBarcode: BarcodeLookupResult;
  meApp: AppUser;
  meVendor: VendorUser;
  minimumOrderPlatform: Scalars['Float']['output'];
  myAddresses: Array<Address>;
  myAppointments: Array<Appointment>;
  myBalance: RecipientBalance;
  myCards: Array<SavedCard>;
  myCart: Array<CartItem>;
  myCartByStore: Array<CartItem>;
  myDeliveries: Array<Delivery>;
  myOrders: Array<Order>;
  myPayments: Array<Payment>;
  myPromotions: Array<Promotion>;
  myStores: Array<Store>;
  nearbyStores: Array<Store>;
  notificationLogs: Array<NotificationLog>;
  onlineDeliverersCount: Scalars['Int']['output'];
  order: Order;
  pendingAppApprovals: Array<AppUser>;
  pendingVendorApprovals: Array<VendorUser>;
  platformConfigs: Array<PlatformConfig>;
  popularProducts: Array<PopularProduct>;
  product: Product;
  productsByStore: Array<Product>;
  productsByStoreAll: Array<Product>;
  promoPricePerDay: Scalars['Float']['output'];
  ratingForAppointment?: Maybe<ServiceRating>;
  reorderSuggestions: Array<ReorderProduct>;
  searchCatalog: Array<Product>;
  searchProductImages: Array<Scalars['String']['output']>;
  searchProducts: Array<Product>;
  searchServices: Array<Service>;
  service: Service;
  serviceRatings: Array<ServiceRating>;
  servicesByStore: Array<Service>;
  simulateAnticipation: AnticipationSimulation;
  store: Store;
  storeAppointments: Array<Appointment>;
  storeCartSummary: Array<CartProductSummary>;
  storeCoupons: Array<Coupon>;
  storeOrders: Array<Order>;
  storeSchedule: Array<Schedule>;
  stores: Array<Store>;
  topStoresWeekly: Array<WeeklyTopStore>;
  validateCoupon: CouponValidation;
};


export type QueryAllPaymentsArgs = {
  limit?: InputMaybe<Scalars['Float']['input']>;
  offset?: InputMaybe<Scalars['Float']['input']>;
};


export type QueryAllServicesByStoreArgs = {
  storeId: Scalars['String']['input'];
};


export type QueryAppointmentArgs = {
  id: Scalars['String']['input'];
};


export type QueryAvailableSlotsArgs = {
  date: Scalars['String']['input'];
  serviceId: Scalars['String']['input'];
  storeId: Scalars['String']['input'];
};


export type QueryAverageStoreRatingArgs = {
  storeId: Scalars['String']['input'];
};


export type QueryCalculateDeliveryFeeArgs = {
  customerLatitude: Scalars['Float']['input'];
  customerLongitude: Scalars['Float']['input'];
  storeId: Scalars['String']['input'];
};


export type QueryCategoriesByStoreArgs = {
  storeId: Scalars['String']['input'];
};


export type QueryContractContentArgs = {
  type: Scalars['String']['input'];
};


export type QueryContractUpdatedAtArgs = {
  type: Scalars['String']['input'];
};


export type QueryDeletedProductsByStoreArgs = {
  storeId: Scalars['String']['input'];
};


export type QueryEstimatedDeliveryTimeArgs = {
  customerLatitude: Scalars['Float']['input'];
  customerLongitude: Scalars['Float']['input'];
  storeId: Scalars['String']['input'];
};


export type QueryFollowerCountArgs = {
  storeId: Scalars['String']['input'];
};


export type QueryFrequentStoresArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryIsFollowingStoreArgs = {
  storeId: Scalars['String']['input'];
};


export type QueryLookupBarcodeArgs = {
  barcode: Scalars['String']['input'];
};


export type QueryMyCartByStoreArgs = {
  storeId: Scalars['String']['input'];
};


export type QueryNearbyStoresArgs = {
  latitude: Scalars['Float']['input'];
  longitude: Scalars['Float']['input'];
  radiusKm?: InputMaybe<Scalars['Float']['input']>;
};


export type QueryOrderArgs = {
  id: Scalars['String']['input'];
};


export type QueryPopularProductsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryProductArgs = {
  id: Scalars['String']['input'];
};


export type QueryProductsByStoreArgs = {
  storeId: Scalars['String']['input'];
};


export type QueryProductsByStoreAllArgs = {
  storeId: Scalars['String']['input'];
};


export type QueryRatingForAppointmentArgs = {
  appointmentId: Scalars['String']['input'];
};


export type QueryReorderSuggestionsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QuerySearchCatalogArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};


export type QuerySearchProductImagesArgs = {
  query: Scalars['String']['input'];
};


export type QuerySearchProductsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};


export type QuerySearchServicesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};


export type QueryServiceArgs = {
  id: Scalars['String']['input'];
};


export type QueryServiceRatingsArgs = {
  storeId: Scalars['String']['input'];
};


export type QueryServicesByStoreArgs = {
  storeId: Scalars['String']['input'];
};


export type QueryStoreArgs = {
  id: Scalars['String']['input'];
};


export type QueryStoreAppointmentsArgs = {
  date?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<AppointmentStatus>;
  storeId: Scalars['String']['input'];
};


export type QueryStoreCartSummaryArgs = {
  storeId: Scalars['String']['input'];
};


export type QueryStoreCouponsArgs = {
  storeId: Scalars['String']['input'];
};


export type QueryStoreOrdersArgs = {
  storeId: Scalars['String']['input'];
};


export type QueryStoreScheduleArgs = {
  storeId: Scalars['String']['input'];
};


export type QueryTopStoresWeeklyArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryValidateCouponArgs = {
  code: Scalars['String']['input'];
  storeId: Scalars['String']['input'];
  subtotal: Scalars['Float']['input'];
};

export type RecentOrder = {
  __typename?: 'RecentOrder';
  createdAt: Scalars['DateTime']['output'];
  customerName: Scalars['String']['output'];
  id: Scalars['String']['output'];
  orderNumber: Scalars['String']['output'];
  status: Scalars['String']['output'];
  storeName: Scalars['String']['output'];
  total: Scalars['Float']['output'];
};

export type RecipientBalance = {
  __typename?: 'RecipientBalance';
  autoAnticipationEnabled: Scalars['Boolean']['output'];
  availableAmount: Scalars['Float']['output'];
  transferredAmount: Scalars['Float']['output'];
  waitingFundsAmount: Scalars['Float']['output'];
};

export type RegisterAppInput = {
  cpf: Scalars['String']['input'];
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
  phone: Scalars['String']['input'];
};

export type RegisterDelivererInput = {
  birthDate: Scalars['String']['input'];
  cnhNumber?: InputMaybe<Scalars['String']['input']>;
  identityPhotoBackUrl?: InputMaybe<Scalars['String']['input']>;
  identityPhotoUrl?: InputMaybe<Scalars['String']['input']>;
  profilePhotoUrl?: InputMaybe<Scalars['String']['input']>;
  vehiclePlate?: InputMaybe<Scalars['String']['input']>;
  vehicleType: Scalars['String']['input'];
};

export type RegisterVendorInput = {
  cpf: Scalars['String']['input'];
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
  phone: Scalars['String']['input'];
};

export type ReorderProduct = {
  __typename?: 'ReorderProduct';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  isAvailable: Scalars['Boolean']['output'];
  lastOrderedAt: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  price: Scalars['Float']['output'];
  promotionalPrice?: Maybe<Scalars['Float']['output']>;
  storeId: Scalars['String']['output'];
  storeIsOpen: Scalars['Boolean']['output'];
  storeLogoUrl?: Maybe<Scalars['String']['output']>;
  storeName: Scalars['String']['output'];
};

export type RequestQuoteInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  description: Scalars['String']['input'];
  latitude?: InputMaybe<Scalars['Float']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  serviceId: Scalars['String']['input'];
  storeId: Scalars['String']['input'];
};

export type RoleCount = {
  __typename?: 'RoleCount';
  count: Scalars['Int']['output'];
  role: Scalars['String']['output'];
};

export type SavedCard = {
  __typename?: 'SavedCard';
  brand: Scalars['String']['output'];
  expMonth: Scalars['Int']['output'];
  expYear: Scalars['Int']['output'];
  holderName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastFourDigits: Scalars['String']['output'];
};

export type Schedule = {
  __typename?: 'Schedule';
  dayOfWeek: Scalars['Int']['output'];
  endTime: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  startTime: Scalars['String']['output'];
  store: Store;
};

export type ScheduleEntryInput = {
  dayOfWeek: Scalars['Int']['input'];
  endTime: Scalars['String']['input'];
  isActive?: Scalars['Boolean']['input'];
  startTime: Scalars['String']['input'];
};

export type SendCodeInput = {
  channel: Scalars['String']['input'];
  fallbackEmail?: InputMaybe<Scalars['String']['input']>;
  value: Scalars['String']['input'];
};

export type Service = {
  __typename?: 'Service';
  category?: Maybe<Category>;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  estimatedDuration: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  isAvailable: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  price?: Maybe<Scalars['Float']['output']>;
  requiresQuote: Scalars['Boolean']['output'];
  store: Store;
  updatedAt: Scalars['DateTime']['output'];
};

export type ServiceRating = {
  __typename?: 'ServiceRating';
  appointment: Appointment;
  comment?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  customer: AppUser;
  id: Scalars['ID']['output'];
  photoUrls?: Maybe<Array<Scalars['String']['output']>>;
  rating: Scalars['Int']['output'];
  service: Service;
  store: Store;
};

export type SessionKickedPayload = {
  __typename?: 'SessionKickedPayload';
  userId: Scalars['String']['output'];
  userType: Scalars['String']['output'];
};

export type SetScheduleInput = {
  entries: Array<ScheduleEntryInput>;
  storeId: Scalars['String']['input'];
};

export type StatusCount = {
  __typename?: 'StatusCount';
  count: Scalars['Int']['output'];
  status: Scalars['String']['output'];
};

export type Store = {
  __typename?: 'Store';
  badgeClaimCount: Scalars['Int']['output'];
  bannerUrl?: Maybe<Scalars['String']['output']>;
  categories?: Maybe<Array<Category>>;
  city: Scalars['String']['output'];
  commissionReductionExpiresAt?: Maybe<Scalars['DateTime']['output']>;
  commissionReductionPercent: Scalars['Float']['output'];
  complement?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deliveryEndTime?: Maybe<Scalars['String']['output']>;
  deliveryFee: Scalars['Float']['output'];
  deliveryStartTime?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  estimatedDeliveryMinutes: Scalars['Float']['output'];
  freeDelivery: Scalars['Boolean']['output'];
  freeDeliveryAbove?: Maybe<Scalars['Float']['output']>;
  freePromoDaysCredit: Scalars['Int']['output'];
  hasOwnDelivery: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isOpen: Scalars['Boolean']['output'];
  lastClaimedScore: Scalars['Int']['output'];
  latitude: Scalars['Float']['output'];
  logoUrl?: Maybe<Scalars['String']['output']>;
  longitude: Scalars['Float']['output'];
  minimumOrder: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  neighborhood: Scalars['String']['output'];
  number: Scalars['String']['output'];
  owner: VendorUser;
  ownerPaymentConnected: Scalars['Boolean']['output'];
  phone: Scalars['String']['output'];
  products?: Maybe<Array<Product>>;
  services?: Maybe<Array<Service>>;
  state: Scalars['String']['output'];
  storeType: StoreType;
  street: Scalars['String']['output'];
  totalProducts: Scalars['Int']['output'];
  totalSales: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
  verificationLevel: VerificationLevel;
  verificationScore: Scalars['Int']['output'];
  zipCode: Scalars['String']['output'];
};

export enum StoreType {
  Products = 'PRODUCTS',
  Services = 'SERVICES'
}

export type Subscription = {
  __typename?: 'Subscription';
  deliveryUpdated: Delivery;
  orderCreated: Order;
  orderUpdated: Order;
  productDeleted: ProductDeletedPayload;
  productUpdated: Product;
  promotionUpdated: Promotion;
  sessionKicked: SessionKickedPayload;
  storeUpdated: Store;
};


export type SubscriptionDeliveryUpdatedArgs = {
  orderId?: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionOrderCreatedArgs = {
  storeId?: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionOrderUpdatedArgs = {
  orderId?: InputMaybe<Scalars['String']['input']>;
  storeId?: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionProductDeletedArgs = {
  storeId?: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionProductUpdatedArgs = {
  storeId?: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionSessionKickedArgs = {
  userId: Scalars['String']['input'];
  userType?: Scalars['String']['input'];
};


export type SubscriptionStoreUpdatedArgs = {
  storeId?: InputMaybe<Scalars['String']['input']>;
};

export type TopStore = {
  __typename?: 'TopStore';
  orderCount: Scalars['Int']['output'];
  revenue: Scalars['Float']['output'];
  storeId: Scalars['String']['output'];
  storeName: Scalars['String']['output'];
};

export type UpdateAddressInput = {
  city?: InputMaybe<Scalars['String']['input']>;
  complement?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  latitude?: InputMaybe<Scalars['Float']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  neighborhood?: InputMaybe<Scalars['String']['input']>;
  number?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
  street?: InputMaybe<Scalars['String']['input']>;
  zipCode?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateCartItemInput = {
  cartItemId: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  quantity?: InputMaybe<Scalars['Int']['input']>;
  weightGrams?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateCouponInput = {
  code?: InputMaybe<Scalars['String']['input']>;
  discountType?: InputMaybe<Scalars['String']['input']>;
  discountValue?: InputMaybe<Scalars['Float']['input']>;
  expiresAt?: InputMaybe<Scalars['DateTime']['input']>;
  id: Scalars['String']['input'];
  maxDiscount?: InputMaybe<Scalars['Float']['input']>;
  maxUses?: InputMaybe<Scalars['Int']['input']>;
  minimumOrder?: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateProductInput = {
  barcode?: InputMaybe<Scalars['String']['input']>;
  categoryId?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  isVariableWeight?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  price?: InputMaybe<Scalars['Float']['input']>;
  stock?: InputMaybe<Scalars['Float']['input']>;
  unit?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateServiceInput = {
  categoryId?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  estimatedDuration?: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['String']['input'];
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  isAvailable?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  price?: InputMaybe<Scalars['Float']['input']>;
  requiresQuote?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateStoreInput = {
  bannerUrl?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  complement?: InputMaybe<Scalars['String']['input']>;
  deliveryEndTime?: InputMaybe<Scalars['String']['input']>;
  deliveryFee?: InputMaybe<Scalars['Float']['input']>;
  deliveryStartTime?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  estimatedDeliveryMinutes?: InputMaybe<Scalars['Float']['input']>;
  freeDelivery?: InputMaybe<Scalars['Boolean']['input']>;
  freeDeliveryAbove?: InputMaybe<Scalars['Float']['input']>;
  hasOwnDelivery?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['String']['input'];
  latitude?: InputMaybe<Scalars['Float']['input']>;
  logoUrl?: InputMaybe<Scalars['String']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  minimumOrder?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  neighborhood?: InputMaybe<Scalars['String']['input']>;
  number?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
  storeType?: InputMaybe<StoreType>;
  street?: InputMaybe<Scalars['String']['input']>;
  zipCode?: InputMaybe<Scalars['String']['input']>;
};

export enum UserRole {
  Admin = 'ADMIN',
  Customer = 'CUSTOMER',
  Deliverer = 'DELIVERER',
  Superadmin = 'SUPERADMIN',
  Vendor = 'VENDOR'
}

export type ValidationResult = {
  __typename?: 'ValidationResult';
  cpfError?: Maybe<Scalars['String']['output']>;
  emailError?: Maybe<Scalars['String']['output']>;
  phoneError?: Maybe<Scalars['String']['output']>;
  valid: Scalars['Boolean']['output'];
};

export type VendorAuthResponse = {
  __typename?: 'VendorAuthResponse';
  accessToken: Scalars['String']['output'];
  user: VendorUser;
};

export enum VendorPlan {
  Custom = 'CUSTOM',
  Enterprise = 'ENTERPRISE',
  Free = 'FREE',
  Premium = 'PREMIUM',
  Pro = 'PRO'
}

export type VendorUser = {
  __typename?: 'VendorUser';
  acceptedSubscriptionTermsAt?: Maybe<Scalars['DateTime']['output']>;
  acceptedTermsAt?: Maybe<Scalars['DateTime']['output']>;
  approvedAt?: Maybe<Scalars['DateTime']['output']>;
  avatarUrl?: Maybe<Scalars['String']['output']>;
  cpf?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  emailVerified: Scalars['Boolean']['output'];
  googleId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  pagarmeRecipientId?: Maybe<Scalars['String']['output']>;
  paymentConnected: Scalars['Boolean']['output'];
  pendingRole?: Maybe<Scalars['String']['output']>;
  phone: Scalars['String']['output'];
  phoneVerified: Scalars['Boolean']['output'];
  planExpiresAt?: Maybe<Scalars['DateTime']['output']>;
  rejectedAt?: Maybe<Scalars['DateTime']['output']>;
  rejectionReason?: Maybe<Scalars['String']['output']>;
  role: UserRole;
  stores?: Maybe<Array<Store>>;
  updatedAt: Scalars['DateTime']['output'];
  vendorPlan?: Maybe<VendorPlan>;
};

export enum VerificationLevel {
  Bronze = 'BRONZE',
  Diamond = 'DIAMOND',
  Gold = 'GOLD',
  None = 'NONE',
  Silver = 'SILVER'
}

export type VerifyCodeInput = {
  channel: Scalars['String']['input'];
  code: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export type WeeklyTopStore = {
  __typename?: 'WeeklyTopStore';
  bannerUrl?: Maybe<Scalars['String']['output']>;
  deliveryFee: Scalars['Float']['output'];
  description?: Maybe<Scalars['String']['output']>;
  freeDelivery: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  isOpen: Scalars['Boolean']['output'];
  logoUrl?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  orderCount: Scalars['Int']['output'];
  totalRevenue: Scalars['Float']['output'];
  verificationLevel?: Maybe<Scalars['String']['output']>;
};

export type LoginVendorMutationVariables = Exact<{
  input: LoginInput;
  forceLogin?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type LoginVendorMutation = { __typename?: 'Mutation', loginVendor: { __typename?: 'VendorAuthResponse', accessToken: string, user: { __typename?: 'VendorUser', id: string, name: string, email: string, role: UserRole, emailVerified: boolean, phoneVerified: boolean } } };

export type RegisterVendorMutationVariables = Exact<{
  input: RegisterVendorInput;
}>;


export type RegisterVendorMutation = { __typename?: 'Mutation', registerVendor: { __typename?: 'VendorAuthResponse', accessToken: string, user: { __typename?: 'VendorUser', id: string, name: string, email: string, role: UserRole, cpf?: string | null, emailVerified: boolean, phoneVerified: boolean } } };

export type ValidateRegistrationMutationVariables = Exact<{
  email: Scalars['String']['input'];
  cpf: Scalars['String']['input'];
  phone: Scalars['String']['input'];
  userType?: InputMaybe<Scalars['String']['input']>;
}>;


export type ValidateRegistrationMutation = { __typename?: 'Mutation', validateRegistration: { __typename?: 'ValidationResult', valid: boolean, emailError?: string | null, cpfError?: string | null, phoneError?: string | null } };

export type SendVerificationCodeMutationVariables = Exact<{
  input: SendCodeInput;
}>;


export type SendVerificationCodeMutation = { __typename?: 'Mutation', sendVerificationCode: string };

export type VerifyCodeMutationVariables = Exact<{
  input: VerifyCodeInput;
}>;


export type VerifyCodeMutation = { __typename?: 'Mutation', verifyCode: boolean };

export type SendEmailVerificationMutationVariables = Exact<{
  userType?: InputMaybe<Scalars['String']['input']>;
}>;


export type SendEmailVerificationMutation = { __typename?: 'Mutation', sendEmailVerification: boolean };

export type ConfirmEmailVerificationMutationVariables = Exact<{
  code: Scalars['String']['input'];
  userType?: InputMaybe<Scalars['String']['input']>;
}>;


export type ConfirmEmailVerificationMutation = { __typename?: 'Mutation', confirmEmailVerification: boolean };

export type MyStoresQueryVariables = Exact<{ [key: string]: never; }>;


export type MyStoresQuery = { __typename?: 'Query', myStores: Array<{ __typename?: 'Store', id: string, name: string, description?: string | null, isOpen: boolean, hasOwnDelivery: boolean, freeDelivery: boolean, deliveryFee: number, estimatedDeliveryMinutes: number, minimumOrder: number, deliveryStartTime?: string | null, deliveryEndTime?: string | null, freeDeliveryAbove?: number | null, phone: string, street: string, number: string, complement?: string | null, neighborhood: string, city: string, state: string, zipCode: string, logoUrl?: string | null, bannerUrl?: string | null, latitude: number, longitude: number, storeType: StoreType, verificationLevel: VerificationLevel, verificationScore: number, totalSales: number, totalProducts: number, createdAt: any, badgeClaimCount: number, lastClaimedScore: number, freePromoDaysCredit: number, commissionReductionPercent: number, commissionReductionExpiresAt?: any | null, products?: Array<{ __typename?: 'Product', id: string, name: string, price: number, isAvailable: boolean, isActive: boolean, stock: number, imageUrl?: string | null, barcode?: string | null, isVariableWeight: boolean, category?: { __typename?: 'Category', id: string, name: string } | null }> | null, categories?: Array<{ __typename?: 'Category', id: string, name: string, requiresAgeVerification: boolean }> | null }> };

export type UpdateStoreMutationVariables = Exact<{
  input: UpdateStoreInput;
}>;


export type UpdateStoreMutation = { __typename?: 'Mutation', updateStore: { __typename?: 'Store', id: string, name: string, description?: string | null, phone: string, street: string, number: string, complement?: string | null, neighborhood: string, city: string, state: string, zipCode: string, hasOwnDelivery: boolean, freeDelivery: boolean, deliveryFee: number, estimatedDeliveryMinutes: number, minimumOrder: number, deliveryStartTime?: string | null, deliveryEndTime?: string | null, freeDeliveryAbove?: number | null, logoUrl?: string | null, bannerUrl?: string | null, latitude: number, longitude: number, storeType: StoreType } };

export type StoreOrdersQueryVariables = Exact<{
  storeId: Scalars['String']['input'];
}>;


export type StoreOrdersQuery = { __typename?: 'Query', storeOrders: Array<{ __typename?: 'Order', id: string, orderNumber: string, status: OrderStatus, total: number, subtotal: number, discount?: number | null, couponCode?: string | null, createdAt: any, updatedAt: any, vendorConfirmedPickupAt?: any | null, deliveryAddress?: string | null, deliveryLatitude?: number | null, deliveryLongitude?: number | null, store: { __typename?: 'Store', id: string, name: string }, customer: { __typename?: 'AppUser', id: string, name: string, phone: string, avatarUrl?: string | null }, items: Array<{ __typename?: 'OrderItem', id: string, quantity: number, weightGrams?: number | null, unitPrice: number, totalPrice: number, product?: { __typename?: 'Product', name: string, price: number, promotionalPrice?: number | null, isVariableWeight: boolean, imageUrl?: string | null } | null }>, delivery?: { __typename?: 'Delivery', id: string, currentLatitude?: number | null, currentLongitude?: number | null, deliverer?: { __typename?: 'AppUser', name: string, phone: string, profilePhotoUrl?: string | null } | null } | null }> };

export type AdjustOrderItemWeightMutationVariables = Exact<{
  orderItemId: Scalars['String']['input'];
  actualWeightGrams: Scalars['Int']['input'];
}>;


export type AdjustOrderItemWeightMutation = { __typename?: 'Mutation', adjustOrderItemWeight: { __typename?: 'Order', id: string, subtotal: number, total: number, items: Array<{ __typename?: 'OrderItem', id: string, quantity: number, weightGrams?: number | null, unitPrice: number, totalPrice: number, product?: { __typename?: 'Product', id: string, name: string, isVariableWeight: boolean } | null }> } };

export type CreateStoreMutationVariables = Exact<{
  input: CreateStoreInput;
}>;


export type CreateStoreMutation = { __typename?: 'Mutation', createStore: { __typename?: 'Store', id: string, name: string } };

export type CreateProductMutationVariables = Exact<{
  input: CreateProductInput;
}>;


export type CreateProductMutation = { __typename?: 'Mutation', createProduct: { __typename?: 'Product', id: string, name: string, price: number, isVariableWeight: boolean } };

export type CreateCategoryMutationVariables = Exact<{
  name: Scalars['String']['input'];
  storeId: Scalars['String']['input'];
  requiresAgeVerification?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type CreateCategoryMutation = { __typename?: 'Mutation', createCategory: { __typename?: 'Category', id: string, name: string, requiresAgeVerification: boolean } };

export type UpdateCategoryMutationVariables = Exact<{
  id: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  requiresAgeVerification?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type UpdateCategoryMutation = { __typename?: 'Mutation', updateCategory: { __typename?: 'Category', id: string, name: string, requiresAgeVerification: boolean } };

export type UploadImageMutationVariables = Exact<{
  base64: Scalars['String']['input'];
  folder?: InputMaybe<Scalars['String']['input']>;
}>;


export type UploadImageMutation = { __typename?: 'Mutation', uploadImage: string };

export type SearchProductImagesQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type SearchProductImagesQuery = { __typename?: 'Query', searchProductImages: Array<string> };

export type UploadFromUrlMutationVariables = Exact<{
  url: Scalars['String']['input'];
  folder?: InputMaybe<Scalars['String']['input']>;
}>;


export type UploadFromUrlMutation = { __typename?: 'Mutation', uploadFromUrl: string };

export type DeleteProductMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteProductMutation = { __typename?: 'Mutation', deleteProduct: boolean };

export type DeletedProductsByStoreQueryVariables = Exact<{
  storeId: Scalars['String']['input'];
}>;


export type DeletedProductsByStoreQuery = { __typename?: 'Query', deletedProductsByStore: Array<{ __typename?: 'Product', id: string, name: string, price: number, unit?: string | null, imageUrl?: string | null, barcode?: string | null, deletedAt?: any | null, category?: { __typename?: 'Category', id: string, name: string } | null }> };

export type RestoreProductMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type RestoreProductMutation = { __typename?: 'Mutation', restoreProduct: { __typename?: 'Product', id: string, name: string } };

export type UpdateProductMutationVariables = Exact<{
  input: UpdateProductInput;
}>;


export type UpdateProductMutation = { __typename?: 'Mutation', updateProduct: { __typename?: 'Product', id: string, name: string, price: number, description?: string | null, unit?: string | null, imageUrl?: string | null, stock: number, isVariableWeight: boolean } };

export type ToggleProductAvailabilityMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type ToggleProductAvailabilityMutation = { __typename?: 'Mutation', toggleProductAvailability: { __typename?: 'Product', id: string, isAvailable: boolean } };

export type ToggleProductActiveMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type ToggleProductActiveMutation = { __typename?: 'Mutation', toggleProductActive: { __typename?: 'Product', id: string, isActive: boolean, isAvailable: boolean } };

export type DeleteCategoryMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteCategoryMutation = { __typename?: 'Mutation', deleteCategory: boolean };

export type UpdateOrderStatusMutationVariables = Exact<{
  id: Scalars['String']['input'];
  status: OrderStatus;
}>;


export type UpdateOrderStatusMutation = { __typename?: 'Mutation', updateOrderStatus: { __typename?: 'Order', id: string, status: OrderStatus } };

export type RejectOrderMutationVariables = Exact<{
  orderId: Scalars['String']['input'];
  reason: Scalars['String']['input'];
}>;


export type RejectOrderMutation = { __typename?: 'Mutation', rejectOrder: { __typename?: 'Order', id: string, status: OrderStatus } };

export type VendorCancelOrderMutationVariables = Exact<{
  orderId: Scalars['String']['input'];
  reason: Scalars['String']['input'];
}>;


export type VendorCancelOrderMutation = { __typename?: 'Mutation', vendorCancelOrder: { __typename?: 'Order', id: string, status: OrderStatus } };

export type RequestCancelDisputeMutationVariables = Exact<{
  orderId: Scalars['String']['input'];
}>;


export type RequestCancelDisputeMutation = { __typename?: 'Mutation', requestCancelDispute: { __typename?: 'Order', id: string, status: OrderStatus } };

export type VendorConfirmPickupMutationVariables = Exact<{
  orderId: Scalars['String']['input'];
}>;


export type VendorConfirmPickupMutation = { __typename?: 'Mutation', vendorConfirmPickup: { __typename?: 'Order', id: string, status: OrderStatus } };

export type ToggleStoreOpenMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type ToggleStoreOpenMutation = { __typename?: 'Mutation', toggleStoreOpen: { __typename?: 'Store', id: string, isOpen: boolean } };

export type RequestVendorStoreDeleteMutationVariables = Exact<{
  storeId: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type RequestVendorStoreDeleteMutation = { __typename?: 'Mutation', requestVendorStoreDelete: boolean };

export type MeVendorQueryVariables = Exact<{ [key: string]: never; }>;


export type MeVendorQuery = { __typename?: 'Query', meVendor: { __typename?: 'VendorUser', id: string, name: string, cpf?: string | null, vendorPlan?: VendorPlan | null, planExpiresAt?: any | null, paymentConnected: boolean, acceptedTermsAt?: any | null, acceptedSubscriptionTermsAt?: any | null, emailVerified: boolean, phoneVerified: boolean, stores?: Array<{ __typename?: 'Store', id: string }> | null } };

export type MyVendorProfileQueryVariables = Exact<{ [key: string]: never; }>;


export type MyVendorProfileQuery = { __typename?: 'Query', meVendor: { __typename?: 'VendorUser', id: string, name: string, email: string, phone: string, vendorPlan?: VendorPlan | null, emailVerified: boolean, googleId?: string | null } };

export type UpdateVendorProfileMutationVariables = Exact<{
  name?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  currentPassword?: InputMaybe<Scalars['String']['input']>;
  newPassword?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateVendorProfileMutation = { __typename?: 'Mutation', updateVendorProfile: { __typename?: 'VendorUser', id: string, name: string, phone: string, email: string, emailVerified: boolean } };

export type GoogleAuthVendorMutationVariables = Exact<{
  idToken: Scalars['String']['input'];
  forceLogin?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GoogleAuthVendorMutation = { __typename?: 'Mutation', googleAuthVendor: { __typename?: 'VendorAuthResponse', accessToken: string, user: { __typename?: 'VendorUser', id: string, name: string, email: string, role: UserRole, cpf?: string | null, emailVerified: boolean, phoneVerified: boolean } } };

export type RegisterVendorWithGoogleMutationVariables = Exact<{
  idToken: Scalars['String']['input'];
  phone: Scalars['String']['input'];
  cpf: Scalars['String']['input'];
}>;


export type RegisterVendorWithGoogleMutation = { __typename?: 'Mutation', registerVendorWithGoogle: { __typename?: 'VendorAuthResponse', accessToken: string, user: { __typename?: 'VendorUser', id: string, name: string, email: string, role: UserRole, cpf?: string | null, emailVerified: boolean, phoneVerified: boolean } } };

export type ContractContentQueryVariables = Exact<{
  type: Scalars['String']['input'];
}>;


export type ContractContentQuery = { __typename?: 'Query', contractContent: string };

export type AcceptVendorTermsMutationVariables = Exact<{ [key: string]: never; }>;


export type AcceptVendorTermsMutation = { __typename?: 'Mutation', acceptVendorTerms: { __typename?: 'VendorUser', id: string, acceptedTermsAt?: any | null } };

export type AcceptSubscriptionTermsMutationVariables = Exact<{ [key: string]: never; }>;


export type AcceptSubscriptionTermsMutation = { __typename?: 'Mutation', acceptSubscriptionTerms: { __typename?: 'VendorUser', id: string, acceptedSubscriptionTermsAt?: any | null } };

export type DisconnectPaymentMutationVariables = Exact<{ [key: string]: never; }>;


export type DisconnectPaymentMutation = { __typename?: 'Mutation', disconnectPayment: boolean };

export type AvailablePlansQueryVariables = Exact<{ [key: string]: never; }>;


export type AvailablePlansQuery = { __typename?: 'Query', availablePlans: Array<{ __typename?: 'PlanInfo', plan: VendorPlan, maxStores: number, monthlyPrice: number, quarterlyPrice: number, semiannualPrice: number, annualPrice: number, commissionPercent: number, freePromosPerWeek: number, maxProductsPerStore: number, maxEmailsPerMonth: number, listingPriority: number, highlightDaysPerMonth: number, canUseCoupons: boolean, hasAnalytics: boolean, supportLevel: string, isContactSales: boolean }> };

export type CreatePromotionMutationVariables = Exact<{
  input: CreatePromotionInput;
}>;


export type CreatePromotionMutation = { __typename?: 'Mutation', createPromotion: { __typename?: 'Promotion', id: string, title: string, checkoutUrl?: string | null } };

export type MyPromotionsQueryVariables = Exact<{ [key: string]: never; }>;


export type MyPromotionsQuery = { __typename?: 'Query', myPromotions: Array<{ __typename?: 'Promotion', id: string, title: string, description?: string | null, imageUrl?: string | null, startDate: any, endDate: any, isActive: boolean, isPaid: boolean, promotionalPrice: number, adCost: number, store: { __typename?: 'Store', id: string, name: string }, product?: { __typename?: 'Product', id: string, name: string, imageUrl?: string | null, price: number } | null }> };

export type PromoPricePerDayQueryVariables = Exact<{ [key: string]: never; }>;


export type PromoPricePerDayQuery = { __typename?: 'Query', promoPricePerDay: number };

export type DeletePromotionMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeletePromotionMutation = { __typename?: 'Mutation', deletePromotion: boolean };

export type SwapPromotionProductMutationVariables = Exact<{
  id: Scalars['String']['input'];
  productId: Scalars['String']['input'];
  promotionalPrice: Scalars['Float']['input'];
  title: Scalars['String']['input'];
}>;


export type SwapPromotionProductMutation = { __typename?: 'Mutation', swapPromotionProduct: { __typename?: 'Promotion', id: string, title: string, promotionalPrice: number, imageUrl?: string | null, product?: { __typename?: 'Product', id: string, name: string, imageUrl?: string | null, price: number } | null } };

export type CreatePlanUpgradeMutationVariables = Exact<{
  plan: VendorPlan;
  billingPeriod?: InputMaybe<Scalars['String']['input']>;
}>;


export type CreatePlanUpgradeMutation = { __typename?: 'Mutation', createPlanUpgrade: { __typename?: 'Payment', id: string, checkoutUrl?: string | null, status: string } };

export type StoreCouponsQueryVariables = Exact<{
  storeId: Scalars['String']['input'];
}>;


export type StoreCouponsQuery = { __typename?: 'Query', storeCoupons: Array<{ __typename?: 'Coupon', id: string, code: string, discountType: string, discountValue: number, minimumOrder?: number | null, maxDiscount?: number | null, maxUses: number, usesCount: number, isActive: boolean, expiresAt?: any | null, createdAt: any, store: { __typename?: 'Store', id: string, name: string } }> };

export type CreateCouponMutationVariables = Exact<{
  input: CreateCouponInput;
}>;


export type CreateCouponMutation = { __typename?: 'Mutation', createCoupon: { __typename?: 'Coupon', id: string, code: string, discountType: string, discountValue: number, minimumOrder?: number | null, maxDiscount?: number | null, maxUses: number, isActive: boolean, expiresAt?: any | null } };

export type UpdateCouponMutationVariables = Exact<{
  input: UpdateCouponInput;
}>;


export type UpdateCouponMutation = { __typename?: 'Mutation', updateCoupon: { __typename?: 'Coupon', id: string, code: string, discountType: string, discountValue: number, minimumOrder?: number | null, maxDiscount?: number | null, maxUses: number, isActive: boolean, expiresAt?: any | null } };

export type ToggleCouponActiveMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type ToggleCouponActiveMutation = { __typename?: 'Mutation', toggleCouponActive: { __typename?: 'Coupon', id: string, isActive: boolean } };

export type DeleteCouponMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteCouponMutation = { __typename?: 'Mutation', deleteCoupon: boolean };

export type LookupBarcodeQueryVariables = Exact<{
  barcode: Scalars['String']['input'];
}>;


export type LookupBarcodeQuery = { __typename?: 'Query', lookupBarcode: { __typename?: 'BarcodeLookupResult', barcode: string, name?: string | null, description?: string | null, imageUrl?: string | null, brand?: string | null, quantity?: string | null } };

export type SearchCatalogQueryVariables = Exact<{
  query: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type SearchCatalogQuery = { __typename?: 'Query', searchCatalog: Array<{ __typename?: 'Product', id: string, name: string, description?: string | null, price: number, imageUrl?: string | null, unit?: string | null, barcode?: string | null, store: { __typename?: 'Store', id: string, name: string } }> };

export type BulkCreateProductsMutationVariables = Exact<{
  input: BulkCreateProductsInput;
}>;


export type BulkCreateProductsMutation = { __typename?: 'Mutation', bulkCreateProducts: { __typename?: 'BulkImportResult', created: number, errors: Array<string> } };

export type ClaimBadgeRewardMutationVariables = Exact<{
  storeId: Scalars['String']['input'];
  level: Scalars['String']['input'];
}>;


export type ClaimBadgeRewardMutation = { __typename?: 'Mutation', claimBadgeReward: { __typename?: 'Store', id: string, verificationLevel: VerificationLevel, verificationScore: number, badgeClaimCount: number, lastClaimedScore: number, freePromoDaysCredit: number, commissionReductionPercent: number, commissionReductionExpiresAt?: any | null } };

export type StoreCartSummaryQueryVariables = Exact<{
  storeId: Scalars['String']['input'];
}>;


export type StoreCartSummaryQuery = { __typename?: 'Query', storeCartSummary: Array<{ __typename?: 'CartProductSummary', productId: string, productName: string, productImageUrl?: string | null, totalPeople: number, totalQuantity: number }> };

export type BadgeConfigQueryVariables = Exact<{ [key: string]: never; }>;


export type BadgeConfigQuery = { __typename?: 'Query', badgeConfig: string };

export type OrderCreatedSubscriptionVariables = Exact<{
  storeId?: InputMaybe<Scalars['String']['input']>;
}>;


export type OrderCreatedSubscription = { __typename?: 'Subscription', orderCreated: { __typename?: 'Order', id: string, orderNumber: string, status: OrderStatus, total: number, createdAt: any, customer: { __typename?: 'AppUser', name: string, phone: string }, items: Array<{ __typename?: 'OrderItem', id: string, quantity: number, totalPrice: number, product?: { __typename?: 'Product', name: string } | null }> } };

export type OrderUpdatedSubscriptionVariables = Exact<{
  storeId?: InputMaybe<Scalars['String']['input']>;
}>;


export type OrderUpdatedSubscription = { __typename?: 'Subscription', orderUpdated: { __typename?: 'Order', id: string, orderNumber: string, status: OrderStatus, total: number, createdAt: any, deliveryAddress?: string | null, deliveryLatitude?: number | null, deliveryLongitude?: number | null, customer: { __typename?: 'AppUser', name: string, phone: string }, items: Array<{ __typename?: 'OrderItem', id: string, quantity: number, totalPrice: number, product?: { __typename?: 'Product', name: string } | null }>, delivery?: { __typename?: 'Delivery', id: string, currentLatitude?: number | null, currentLongitude?: number | null, deliverer?: { __typename?: 'AppUser', name: string, phone: string, profilePhotoUrl?: string | null } | null } | null } };

export type StoreUpdatedSubscriptionVariables = Exact<{
  storeId?: InputMaybe<Scalars['String']['input']>;
}>;


export type StoreUpdatedSubscription = { __typename?: 'Subscription', storeUpdated: { __typename?: 'Store', id: string, name: string, isOpen: boolean, isActive: boolean } };

export type ProductUpdatedSubscriptionVariables = Exact<{
  storeId?: InputMaybe<Scalars['String']['input']>;
}>;


export type ProductUpdatedSubscription = { __typename?: 'Subscription', productUpdated: { __typename?: 'Product', id: string, name: string, price: number, isAvailable: boolean, stock: number, imageUrl?: string | null, category?: { __typename?: 'Category', id: string, name: string } | null } };

export type RegisterRecipientMutationVariables = Exact<{
  recipientData: Scalars['String']['input'];
}>;


export type RegisterRecipientMutation = { __typename?: 'Mutation', registerRecipient: boolean };

export type MyBalanceQueryVariables = Exact<{ [key: string]: never; }>;


export type MyBalanceQuery = { __typename?: 'Query', myBalance: { __typename?: 'RecipientBalance', availableAmount: number, waitingFundsAmount: number, transferredAmount: number, autoAnticipationEnabled: boolean } };

export type SimulateAnticipationQueryVariables = Exact<{ [key: string]: never; }>;


export type SimulateAnticipationQuery = { __typename?: 'Query', simulateAnticipation: { __typename?: 'AnticipationSimulation', originalAmount: number, anticipatedAmount: number, fee: number, feePercentage: number } };

export type RequestAnticipationMutationVariables = Exact<{ [key: string]: never; }>;


export type RequestAnticipationMutation = { __typename?: 'Mutation', requestAnticipation: { __typename?: 'AnticipationResult', id: string, status: string, requestedAmount: number, approvedAmount: number, fee: number, createdAt: string } };

export type ToggleAutoAnticipationMutationVariables = Exact<{
  enabled: Scalars['Boolean']['input'];
}>;


export type ToggleAutoAnticipationMutation = { __typename?: 'Mutation', toggleAutoAnticipation: boolean };

export type RequestPasswordResetVendorMutationVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type RequestPasswordResetVendorMutation = { __typename?: 'Mutation', requestPasswordResetVendor: string };

export type ResetPasswordMutationVariables = Exact<{
  token: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
}>;


export type ResetPasswordMutation = { __typename?: 'Mutation', resetPassword: boolean };

export type SessionKickedSubscriptionVariables = Exact<{
  userId: Scalars['String']['input'];
  userType?: InputMaybe<Scalars['String']['input']>;
}>;


export type SessionKickedSubscription = { __typename?: 'Subscription', sessionKicked: { __typename?: 'SessionKickedPayload', userId: string, userType: string } };

export type CreateServiceMutationVariables = Exact<{
  input: CreateServiceInput;
}>;


export type CreateServiceMutation = { __typename?: 'Mutation', createService: { __typename?: 'Service', id: string, name: string, description?: string | null, price?: number | null, estimatedDuration: number, imageUrl?: string | null, isAvailable: boolean, isActive: boolean, requiresQuote: boolean, category?: { __typename?: 'Category', id: string, name: string } | null } };

export type UpdateServiceMutationVariables = Exact<{
  input: UpdateServiceInput;
}>;


export type UpdateServiceMutation = { __typename?: 'Mutation', updateService: { __typename?: 'Service', id: string, name: string, description?: string | null, price?: number | null, estimatedDuration: number, imageUrl?: string | null, isAvailable: boolean, isActive: boolean, requiresQuote: boolean, category?: { __typename?: 'Category', id: string, name: string } | null } };

export type DeleteServiceMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteServiceMutation = { __typename?: 'Mutation', deleteService: boolean };

export type AllServicesByStoreQueryVariables = Exact<{
  storeId: Scalars['String']['input'];
}>;


export type AllServicesByStoreQuery = { __typename?: 'Query', allServicesByStore: Array<{ __typename?: 'Service', id: string, name: string, description?: string | null, price?: number | null, estimatedDuration: number, imageUrl?: string | null, isAvailable: boolean, isActive: boolean, requiresQuote: boolean, category?: { __typename?: 'Category', id: string, name: string } | null }> };

export type SetScheduleMutationVariables = Exact<{
  input: SetScheduleInput;
}>;


export type SetScheduleMutation = { __typename?: 'Mutation', setSchedule: Array<{ __typename?: 'Schedule', id: string, dayOfWeek: number, startTime: string, endTime: string, isActive: boolean }> };

export type StoreScheduleQueryVariables = Exact<{
  storeId: Scalars['String']['input'];
}>;


export type StoreScheduleQuery = { __typename?: 'Query', storeSchedule: Array<{ __typename?: 'Schedule', id: string, dayOfWeek: number, startTime: string, endTime: string, isActive: boolean }> };

export type StoreAppointmentsQueryVariables = Exact<{
  storeId: Scalars['String']['input'];
  date?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<AppointmentStatus>;
}>;


export type StoreAppointmentsQuery = { __typename?: 'Query', storeAppointments: Array<{ __typename?: 'Appointment', id: string, appointmentNumber: string, scheduledDate: string, scheduledTime: string, endTime: string, status: AppointmentStatus, price?: number | null, notes?: string | null, address?: string | null, quoteDescription?: string | null, quoteResponse?: string | null, paymentMethod?: string | null, createdAt: any, customer: { __typename?: 'AppUser', id: string, name: string, phone: string }, service: { __typename?: 'Service', id: string, name: string, estimatedDuration: number } }> };

export type ConfirmAppointmentMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type ConfirmAppointmentMutation = { __typename?: 'Mutation', confirmAppointment: { __typename?: 'Appointment', id: string, status: AppointmentStatus } };

export type VendorCancelAppointmentMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type VendorCancelAppointmentMutation = { __typename?: 'Mutation', vendorCancelAppointment: { __typename?: 'Appointment', id: string, status: AppointmentStatus } };

export type CompleteAppointmentMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type CompleteAppointmentMutation = { __typename?: 'Mutation', completeAppointment: { __typename?: 'Appointment', id: string, status: AppointmentStatus } };

export type MarkNoShowMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type MarkNoShowMutation = { __typename?: 'Mutation', markNoShow: { __typename?: 'Appointment', id: string, status: AppointmentStatus } };

export type RespondQuoteMutationVariables = Exact<{
  id: Scalars['String']['input'];
  price: Scalars['Float']['input'];
  response: Scalars['String']['input'];
}>;


export type RespondQuoteMutation = { __typename?: 'Mutation', respondQuote: { __typename?: 'Appointment', id: string, status: AppointmentStatus, price?: number | null, quoteResponse?: string | null } };

export type ServiceRatingsQueryVariables = Exact<{
  storeId: Scalars['String']['input'];
}>;


export type ServiceRatingsQuery = { __typename?: 'Query', serviceRatings: Array<{ __typename?: 'ServiceRating', id: string, rating: number, comment?: string | null, photoUrls?: Array<string> | null, createdAt: any, customer: { __typename?: 'AppUser', id: string, name: string }, service: { __typename?: 'Service', id: string, name: string } }> };

export type AverageStoreRatingQueryVariables = Exact<{
  storeId: Scalars['String']['input'];
}>;


export type AverageStoreRatingQuery = { __typename?: 'Query', averageStoreRating: number };


export const LoginVendorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LoginVendor"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LoginInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"forceLogin"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"loginVendor"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}},{"kind":"Argument","name":{"kind":"Name","value":"forceLogin"},"value":{"kind":"Variable","name":{"kind":"Name","value":"forceLogin"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"phoneVerified"}}]}}]}}]}}]} as unknown as DocumentNode<LoginVendorMutation, LoginVendorMutationVariables>;
export const RegisterVendorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RegisterVendor"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RegisterVendorInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"registerVendor"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"cpf"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"phoneVerified"}}]}}]}}]}}]} as unknown as DocumentNode<RegisterVendorMutation, RegisterVendorMutationVariables>;
export const ValidateRegistrationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ValidateRegistration"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cpf"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"phone"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userType"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"validateRegistration"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"cpf"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cpf"}}},{"kind":"Argument","name":{"kind":"Name","value":"phone"},"value":{"kind":"Variable","name":{"kind":"Name","value":"phone"}}},{"kind":"Argument","name":{"kind":"Name","value":"userType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"valid"}},{"kind":"Field","name":{"kind":"Name","value":"emailError"}},{"kind":"Field","name":{"kind":"Name","value":"cpfError"}},{"kind":"Field","name":{"kind":"Name","value":"phoneError"}}]}}]}}]} as unknown as DocumentNode<ValidateRegistrationMutation, ValidateRegistrationMutationVariables>;
export const SendVerificationCodeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SendVerificationCode"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SendCodeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendVerificationCode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<SendVerificationCodeMutation, SendVerificationCodeMutationVariables>;
export const VerifyCodeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"VerifyCode"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"VerifyCodeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verifyCode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<VerifyCodeMutation, VerifyCodeMutationVariables>;
export const SendEmailVerificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SendEmailVerification"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userType"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendEmailVerification"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userType"}}}]}]}}]} as unknown as DocumentNode<SendEmailVerificationMutation, SendEmailVerificationMutationVariables>;
export const ConfirmEmailVerificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ConfirmEmailVerification"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"code"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userType"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"confirmEmailVerification"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"code"},"value":{"kind":"Variable","name":{"kind":"Name","value":"code"}}},{"kind":"Argument","name":{"kind":"Name","value":"userType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userType"}}}]}]}}]} as unknown as DocumentNode<ConfirmEmailVerificationMutation, ConfirmEmailVerificationMutationVariables>;
export const MyStoresDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyStores"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myStores"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isOpen"}},{"kind":"Field","name":{"kind":"Name","value":"hasOwnDelivery"}},{"kind":"Field","name":{"kind":"Name","value":"freeDelivery"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryFee"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedDeliveryMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"minimumOrder"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryStartTime"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryEndTime"}},{"kind":"Field","name":{"kind":"Name","value":"freeDeliveryAbove"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"street"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"complement"}},{"kind":"Field","name":{"kind":"Name","value":"neighborhood"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"zipCode"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"bannerUrl"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"storeType"}},{"kind":"Field","name":{"kind":"Name","value":"verificationLevel"}},{"kind":"Field","name":{"kind":"Name","value":"verificationScore"}},{"kind":"Field","name":{"kind":"Name","value":"totalSales"}},{"kind":"Field","name":{"kind":"Name","value":"totalProducts"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"badgeClaimCount"}},{"kind":"Field","name":{"kind":"Name","value":"lastClaimedScore"}},{"kind":"Field","name":{"kind":"Name","value":"freePromoDaysCredit"}},{"kind":"Field","name":{"kind":"Name","value":"commissionReductionPercent"}},{"kind":"Field","name":{"kind":"Name","value":"commissionReductionExpiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"products"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"isAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"barcode"}},{"kind":"Field","name":{"kind":"Name","value":"isVariableWeight"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"categories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"requiresAgeVerification"}}]}}]}}]}}]} as unknown as DocumentNode<MyStoresQuery, MyStoresQueryVariables>;
export const UpdateStoreDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateStore"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateStoreInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateStore"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"street"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"complement"}},{"kind":"Field","name":{"kind":"Name","value":"neighborhood"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"zipCode"}},{"kind":"Field","name":{"kind":"Name","value":"hasOwnDelivery"}},{"kind":"Field","name":{"kind":"Name","value":"freeDelivery"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryFee"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedDeliveryMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"minimumOrder"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryStartTime"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryEndTime"}},{"kind":"Field","name":{"kind":"Name","value":"freeDeliveryAbove"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"bannerUrl"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"storeType"}}]}}]}}]} as unknown as DocumentNode<UpdateStoreMutation, UpdateStoreMutationVariables>;
export const StoreOrdersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StoreOrders"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"storeOrders"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"orderNumber"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"subtotal"}},{"kind":"Field","name":{"kind":"Name","value":"discount"}},{"kind":"Field","name":{"kind":"Name","value":"couponCode"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"vendorConfirmedPickupAt"}},{"kind":"Field","name":{"kind":"Name","value":"store"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"customer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"weightGrams"}},{"kind":"Field","name":{"kind":"Name","value":"unitPrice"}},{"kind":"Field","name":{"kind":"Name","value":"totalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"promotionalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"isVariableWeight"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"deliveryAddress"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryLatitude"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryLongitude"}},{"kind":"Field","name":{"kind":"Name","value":"delivery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"currentLatitude"}},{"kind":"Field","name":{"kind":"Name","value":"currentLongitude"}},{"kind":"Field","name":{"kind":"Name","value":"deliverer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"profilePhotoUrl"}}]}}]}}]}}]}}]} as unknown as DocumentNode<StoreOrdersQuery, StoreOrdersQueryVariables>;
export const AdjustOrderItemWeightDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdjustOrderItemWeight"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderItemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"actualWeightGrams"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adjustOrderItemWeight"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orderItemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderItemId"}}},{"kind":"Argument","name":{"kind":"Name","value":"actualWeightGrams"},"value":{"kind":"Variable","name":{"kind":"Name","value":"actualWeightGrams"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"subtotal"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"weightGrams"}},{"kind":"Field","name":{"kind":"Name","value":"unitPrice"}},{"kind":"Field","name":{"kind":"Name","value":"totalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isVariableWeight"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AdjustOrderItemWeightMutation, AdjustOrderItemWeightMutationVariables>;
export const CreateStoreDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateStore"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateStoreInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createStore"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<CreateStoreMutation, CreateStoreMutationVariables>;
export const CreateProductDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateProduct"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateProductInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createProduct"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"isVariableWeight"}}]}}]}}]} as unknown as DocumentNode<CreateProductMutation, CreateProductMutationVariables>;
export const CreateCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"requiresAgeVerification"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"requiresAgeVerification"},"value":{"kind":"Variable","name":{"kind":"Name","value":"requiresAgeVerification"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"requiresAgeVerification"}}]}}]}}]} as unknown as DocumentNode<CreateCategoryMutation, CreateCategoryMutationVariables>;
export const UpdateCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"requiresAgeVerification"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"requiresAgeVerification"},"value":{"kind":"Variable","name":{"kind":"Name","value":"requiresAgeVerification"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"requiresAgeVerification"}}]}}]}}]} as unknown as DocumentNode<UpdateCategoryMutation, UpdateCategoryMutationVariables>;
export const UploadImageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UploadImage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"base64"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folder"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uploadImage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"base64"},"value":{"kind":"Variable","name":{"kind":"Name","value":"base64"}}},{"kind":"Argument","name":{"kind":"Name","value":"folder"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folder"}}}]}]}}]} as unknown as DocumentNode<UploadImageMutation, UploadImageMutationVariables>;
export const SearchProductImagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchProductImages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchProductImages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}}]}]}}]} as unknown as DocumentNode<SearchProductImagesQuery, SearchProductImagesQueryVariables>;
export const UploadFromUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UploadFromUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"url"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folder"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uploadFromUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"url"},"value":{"kind":"Variable","name":{"kind":"Name","value":"url"}}},{"kind":"Argument","name":{"kind":"Name","value":"folder"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folder"}}}]}]}}]} as unknown as DocumentNode<UploadFromUrlMutation, UploadFromUrlMutationVariables>;
export const DeleteProductDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteProduct"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteProduct"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteProductMutation, DeleteProductMutationVariables>;
export const DeletedProductsByStoreDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DeletedProductsByStore"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletedProductsByStore"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"barcode"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<DeletedProductsByStoreQuery, DeletedProductsByStoreQueryVariables>;
export const RestoreProductDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RestoreProduct"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"restoreProduct"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<RestoreProductMutation, RestoreProductMutationVariables>;
export const UpdateProductDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProduct"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateProductInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateProduct"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"isVariableWeight"}}]}}]}}]} as unknown as DocumentNode<UpdateProductMutation, UpdateProductMutationVariables>;
export const ToggleProductAvailabilityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ToggleProductAvailability"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toggleProductAvailability"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isAvailable"}}]}}]}}]} as unknown as DocumentNode<ToggleProductAvailabilityMutation, ToggleProductAvailabilityMutationVariables>;
export const ToggleProductActiveDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ToggleProductActive"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toggleProductActive"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isAvailable"}}]}}]}}]} as unknown as DocumentNode<ToggleProductActiveMutation, ToggleProductActiveMutationVariables>;
export const DeleteCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteCategoryMutation, DeleteCategoryMutationVariables>;
export const UpdateOrderStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateOrderStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderStatus"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateOrderStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<UpdateOrderStatusMutation, UpdateOrderStatusMutationVariables>;
export const RejectOrderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RejectOrder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reason"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rejectOrder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderId"}}},{"kind":"Argument","name":{"kind":"Name","value":"reason"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reason"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<RejectOrderMutation, RejectOrderMutationVariables>;
export const VendorCancelOrderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"VendorCancelOrder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reason"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"vendorCancelOrder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderId"}}},{"kind":"Argument","name":{"kind":"Name","value":"reason"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reason"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<VendorCancelOrderMutation, VendorCancelOrderMutationVariables>;
export const RequestCancelDisputeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestCancelDispute"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestCancelDispute"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<RequestCancelDisputeMutation, RequestCancelDisputeMutationVariables>;
export const VendorConfirmPickupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"VendorConfirmPickup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"vendorConfirmPickup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<VendorConfirmPickupMutation, VendorConfirmPickupMutationVariables>;
export const ToggleStoreOpenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ToggleStoreOpen"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toggleStoreOpen"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isOpen"}}]}}]}}]} as unknown as DocumentNode<ToggleStoreOpenMutation, ToggleStoreOpenMutationVariables>;
export const RequestVendorStoreDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestVendorStoreDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestVendorStoreDelete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"password"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password"}}}]}]}}]} as unknown as DocumentNode<RequestVendorStoreDeleteMutation, RequestVendorStoreDeleteMutationVariables>;
export const MeVendorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MeVendor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meVendor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"cpf"}},{"kind":"Field","name":{"kind":"Name","value":"vendorPlan"}},{"kind":"Field","name":{"kind":"Name","value":"planExpiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"paymentConnected"}},{"kind":"Field","name":{"kind":"Name","value":"acceptedTermsAt"}},{"kind":"Field","name":{"kind":"Name","value":"acceptedSubscriptionTermsAt"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"phoneVerified"}},{"kind":"Field","name":{"kind":"Name","value":"stores"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<MeVendorQuery, MeVendorQueryVariables>;
export const MyVendorProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyVendorProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meVendor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"vendorPlan"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"googleId"}}]}}]}}]} as unknown as DocumentNode<MyVendorProfileQuery, MyVendorProfileQueryVariables>;
export const UpdateVendorProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateVendorProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"phone"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"currentPassword"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newPassword"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateVendorProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"phone"},"value":{"kind":"Variable","name":{"kind":"Name","value":"phone"}}},{"kind":"Argument","name":{"kind":"Name","value":"currentPassword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"currentPassword"}}},{"kind":"Argument","name":{"kind":"Name","value":"newPassword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newPassword"}}},{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}}]}}]}}]} as unknown as DocumentNode<UpdateVendorProfileMutation, UpdateVendorProfileMutationVariables>;
export const GoogleAuthVendorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GoogleAuthVendor"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"idToken"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"forceLogin"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"googleAuthVendor"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"idToken"},"value":{"kind":"Variable","name":{"kind":"Name","value":"idToken"}}},{"kind":"Argument","name":{"kind":"Name","value":"forceLogin"},"value":{"kind":"Variable","name":{"kind":"Name","value":"forceLogin"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"cpf"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"phoneVerified"}}]}}]}}]}}]} as unknown as DocumentNode<GoogleAuthVendorMutation, GoogleAuthVendorMutationVariables>;
export const RegisterVendorWithGoogleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RegisterVendorWithGoogle"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"idToken"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"phone"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cpf"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"registerVendorWithGoogle"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"idToken"},"value":{"kind":"Variable","name":{"kind":"Name","value":"idToken"}}},{"kind":"Argument","name":{"kind":"Name","value":"phone"},"value":{"kind":"Variable","name":{"kind":"Name","value":"phone"}}},{"kind":"Argument","name":{"kind":"Name","value":"cpf"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cpf"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"cpf"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"phoneVerified"}}]}}]}}]}}]} as unknown as DocumentNode<RegisterVendorWithGoogleMutation, RegisterVendorWithGoogleMutationVariables>;
export const ContractContentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ContractContent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"contractContent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}}]}]}}]} as unknown as DocumentNode<ContractContentQuery, ContractContentQueryVariables>;
export const AcceptVendorTermsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AcceptVendorTerms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"acceptVendorTerms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"acceptedTermsAt"}}]}}]}}]} as unknown as DocumentNode<AcceptVendorTermsMutation, AcceptVendorTermsMutationVariables>;
export const AcceptSubscriptionTermsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AcceptSubscriptionTerms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"acceptSubscriptionTerms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"acceptedSubscriptionTermsAt"}}]}}]}}]} as unknown as DocumentNode<AcceptSubscriptionTermsMutation, AcceptSubscriptionTermsMutationVariables>;
export const DisconnectPaymentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DisconnectPayment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"disconnectPayment"}}]}}]} as unknown as DocumentNode<DisconnectPaymentMutation, DisconnectPaymentMutationVariables>;
export const AvailablePlansDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AvailablePlans"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"availablePlans"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"plan"}},{"kind":"Field","name":{"kind":"Name","value":"maxStores"}},{"kind":"Field","name":{"kind":"Name","value":"monthlyPrice"}},{"kind":"Field","name":{"kind":"Name","value":"quarterlyPrice"}},{"kind":"Field","name":{"kind":"Name","value":"semiannualPrice"}},{"kind":"Field","name":{"kind":"Name","value":"annualPrice"}},{"kind":"Field","name":{"kind":"Name","value":"commissionPercent"}},{"kind":"Field","name":{"kind":"Name","value":"freePromosPerWeek"}},{"kind":"Field","name":{"kind":"Name","value":"maxProductsPerStore"}},{"kind":"Field","name":{"kind":"Name","value":"maxEmailsPerMonth"}},{"kind":"Field","name":{"kind":"Name","value":"listingPriority"}},{"kind":"Field","name":{"kind":"Name","value":"highlightDaysPerMonth"}},{"kind":"Field","name":{"kind":"Name","value":"canUseCoupons"}},{"kind":"Field","name":{"kind":"Name","value":"hasAnalytics"}},{"kind":"Field","name":{"kind":"Name","value":"supportLevel"}},{"kind":"Field","name":{"kind":"Name","value":"isContactSales"}}]}}]}}]} as unknown as DocumentNode<AvailablePlansQuery, AvailablePlansQueryVariables>;
export const CreatePromotionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreatePromotion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreatePromotionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPromotion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"checkoutUrl"}}]}}]}}]} as unknown as DocumentNode<CreatePromotionMutation, CreatePromotionMutationVariables>;
export const MyPromotionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyPromotions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myPromotions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isPaid"}},{"kind":"Field","name":{"kind":"Name","value":"promotionalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"adCost"}},{"kind":"Field","name":{"kind":"Name","value":"store"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"price"}}]}}]}}]}}]} as unknown as DocumentNode<MyPromotionsQuery, MyPromotionsQueryVariables>;
export const PromoPricePerDayDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PromoPricePerDay"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"promoPricePerDay"}}]}}]} as unknown as DocumentNode<PromoPricePerDayQuery, PromoPricePerDayQueryVariables>;
export const DeletePromotionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeletePromotion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletePromotion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeletePromotionMutation, DeletePromotionMutationVariables>;
export const SwapPromotionProductDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SwapPromotionProduct"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"productId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"promotionalPrice"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"title"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"swapPromotionProduct"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"productId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"productId"}}},{"kind":"Argument","name":{"kind":"Name","value":"promotionalPrice"},"value":{"kind":"Variable","name":{"kind":"Name","value":"promotionalPrice"}}},{"kind":"Argument","name":{"kind":"Name","value":"title"},"value":{"kind":"Variable","name":{"kind":"Name","value":"title"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"promotionalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"price"}}]}}]}}]}}]} as unknown as DocumentNode<SwapPromotionProductMutation, SwapPromotionProductMutationVariables>;
export const CreatePlanUpgradeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreatePlanUpgrade"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"plan"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"VendorPlan"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"billingPeriod"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPlanUpgrade"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"plan"},"value":{"kind":"Variable","name":{"kind":"Name","value":"plan"}}},{"kind":"Argument","name":{"kind":"Name","value":"billingPeriod"},"value":{"kind":"Variable","name":{"kind":"Name","value":"billingPeriod"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"checkoutUrl"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<CreatePlanUpgradeMutation, CreatePlanUpgradeMutationVariables>;
export const StoreCouponsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StoreCoupons"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"storeCoupons"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"discountType"}},{"kind":"Field","name":{"kind":"Name","value":"discountValue"}},{"kind":"Field","name":{"kind":"Name","value":"minimumOrder"}},{"kind":"Field","name":{"kind":"Name","value":"maxDiscount"}},{"kind":"Field","name":{"kind":"Name","value":"maxUses"}},{"kind":"Field","name":{"kind":"Name","value":"usesCount"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"store"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<StoreCouponsQuery, StoreCouponsQueryVariables>;
export const CreateCouponDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCoupon"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCouponInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCoupon"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"discountType"}},{"kind":"Field","name":{"kind":"Name","value":"discountValue"}},{"kind":"Field","name":{"kind":"Name","value":"minimumOrder"}},{"kind":"Field","name":{"kind":"Name","value":"maxDiscount"}},{"kind":"Field","name":{"kind":"Name","value":"maxUses"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]}}]} as unknown as DocumentNode<CreateCouponMutation, CreateCouponMutationVariables>;
export const UpdateCouponDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCoupon"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateCouponInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCoupon"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"discountType"}},{"kind":"Field","name":{"kind":"Name","value":"discountValue"}},{"kind":"Field","name":{"kind":"Name","value":"minimumOrder"}},{"kind":"Field","name":{"kind":"Name","value":"maxDiscount"}},{"kind":"Field","name":{"kind":"Name","value":"maxUses"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]}}]} as unknown as DocumentNode<UpdateCouponMutation, UpdateCouponMutationVariables>;
export const ToggleCouponActiveDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ToggleCouponActive"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toggleCouponActive"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]} as unknown as DocumentNode<ToggleCouponActiveMutation, ToggleCouponActiveMutationVariables>;
export const DeleteCouponDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteCoupon"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteCoupon"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteCouponMutation, DeleteCouponMutationVariables>;
export const LookupBarcodeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"LookupBarcode"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"barcode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lookupBarcode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"barcode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"barcode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"barcode"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"brand"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}}]}}]}}]} as unknown as DocumentNode<LookupBarcodeQuery, LookupBarcodeQueryVariables>;
export const SearchCatalogDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchCatalog"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchCatalog"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"barcode"}},{"kind":"Field","name":{"kind":"Name","value":"store"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<SearchCatalogQuery, SearchCatalogQueryVariables>;
export const BulkCreateProductsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BulkCreateProducts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BulkCreateProductsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bulkCreateProducts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"created"}},{"kind":"Field","name":{"kind":"Name","value":"errors"}}]}}]}}]} as unknown as DocumentNode<BulkCreateProductsMutation, BulkCreateProductsMutationVariables>;
export const ClaimBadgeRewardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ClaimBadgeReward"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"level"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"claimBadgeReward"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"level"},"value":{"kind":"Variable","name":{"kind":"Name","value":"level"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"verificationLevel"}},{"kind":"Field","name":{"kind":"Name","value":"verificationScore"}},{"kind":"Field","name":{"kind":"Name","value":"badgeClaimCount"}},{"kind":"Field","name":{"kind":"Name","value":"lastClaimedScore"}},{"kind":"Field","name":{"kind":"Name","value":"freePromoDaysCredit"}},{"kind":"Field","name":{"kind":"Name","value":"commissionReductionPercent"}},{"kind":"Field","name":{"kind":"Name","value":"commissionReductionExpiresAt"}}]}}]}}]} as unknown as DocumentNode<ClaimBadgeRewardMutation, ClaimBadgeRewardMutationVariables>;
export const StoreCartSummaryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StoreCartSummary"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"storeCartSummary"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"productId"}},{"kind":"Field","name":{"kind":"Name","value":"productName"}},{"kind":"Field","name":{"kind":"Name","value":"productImageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"totalPeople"}},{"kind":"Field","name":{"kind":"Name","value":"totalQuantity"}}]}}]}}]} as unknown as DocumentNode<StoreCartSummaryQuery, StoreCartSummaryQueryVariables>;
export const BadgeConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"BadgeConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"badgeConfig"}}]}}]} as unknown as DocumentNode<BadgeConfigQuery, BadgeConfigQueryVariables>;
export const OrderCreatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OrderCreated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"orderCreated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"orderNumber"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"customer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}}]}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"totalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<OrderCreatedSubscription, OrderCreatedSubscriptionVariables>;
export const OrderUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OrderUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"orderUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"orderNumber"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"customer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}}]}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"totalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"deliveryAddress"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryLatitude"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryLongitude"}},{"kind":"Field","name":{"kind":"Name","value":"delivery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"currentLatitude"}},{"kind":"Field","name":{"kind":"Name","value":"currentLongitude"}},{"kind":"Field","name":{"kind":"Name","value":"deliverer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"profilePhotoUrl"}}]}}]}}]}}]}}]} as unknown as DocumentNode<OrderUpdatedSubscription, OrderUpdatedSubscriptionVariables>;
export const StoreUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"StoreUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"storeUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isOpen"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]} as unknown as DocumentNode<StoreUpdatedSubscription, StoreUpdatedSubscriptionVariables>;
export const ProductUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"ProductUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"productUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"isAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<ProductUpdatedSubscription, ProductUpdatedSubscriptionVariables>;
export const RegisterRecipientDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RegisterRecipient"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"recipientData"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"registerRecipient"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"recipientData"},"value":{"kind":"Variable","name":{"kind":"Name","value":"recipientData"}}}]}]}}]} as unknown as DocumentNode<RegisterRecipientMutation, RegisterRecipientMutationVariables>;
export const MyBalanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyBalance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myBalance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"availableAmount"}},{"kind":"Field","name":{"kind":"Name","value":"waitingFundsAmount"}},{"kind":"Field","name":{"kind":"Name","value":"transferredAmount"}},{"kind":"Field","name":{"kind":"Name","value":"autoAnticipationEnabled"}}]}}]}}]} as unknown as DocumentNode<MyBalanceQuery, MyBalanceQueryVariables>;
export const SimulateAnticipationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SimulateAnticipation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"simulateAnticipation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"originalAmount"}},{"kind":"Field","name":{"kind":"Name","value":"anticipatedAmount"}},{"kind":"Field","name":{"kind":"Name","value":"fee"}},{"kind":"Field","name":{"kind":"Name","value":"feePercentage"}}]}}]}}]} as unknown as DocumentNode<SimulateAnticipationQuery, SimulateAnticipationQueryVariables>;
export const RequestAnticipationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestAnticipation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestAnticipation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"requestedAmount"}},{"kind":"Field","name":{"kind":"Name","value":"approvedAmount"}},{"kind":"Field","name":{"kind":"Name","value":"fee"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<RequestAnticipationMutation, RequestAnticipationMutationVariables>;
export const ToggleAutoAnticipationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ToggleAutoAnticipation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toggleAutoAnticipation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"enabled"},"value":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}}}]}]}}]} as unknown as DocumentNode<ToggleAutoAnticipationMutation, ToggleAutoAnticipationMutationVariables>;
export const RequestPasswordResetVendorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestPasswordResetVendor"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestPasswordResetVendor"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}]}]}}]} as unknown as DocumentNode<RequestPasswordResetVendorMutation, RequestPasswordResetVendorMutationVariables>;
export const ResetPasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResetPassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newPassword"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resetPassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}},{"kind":"Argument","name":{"kind":"Name","value":"newPassword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newPassword"}}},{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"StringValue","value":"vendor","block":false}}]}]}}]} as unknown as DocumentNode<ResetPasswordMutation, ResetPasswordMutationVariables>;
export const SessionKickedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SessionKicked"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userType"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sessionKicked"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"userType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"userType"}}]}}]}}]} as unknown as DocumentNode<SessionKickedSubscription, SessionKickedSubscriptionVariables>;
export const CreateServiceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateService"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateServiceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createService"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedDuration"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"requiresQuote"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<CreateServiceMutation, CreateServiceMutationVariables>;
export const UpdateServiceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateService"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateServiceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateService"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedDuration"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"requiresQuote"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateServiceMutation, UpdateServiceMutationVariables>;
export const DeleteServiceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteService"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteService"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteServiceMutation, DeleteServiceMutationVariables>;
export const AllServicesByStoreDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AllServicesByStore"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allServicesByStore"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedDuration"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"requiresQuote"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<AllServicesByStoreQuery, AllServicesByStoreQueryVariables>;
export const SetScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SetScheduleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setSchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"dayOfWeek"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]} as unknown as DocumentNode<SetScheduleMutation, SetScheduleMutationVariables>;
export const StoreScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StoreSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"storeSchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"dayOfWeek"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]} as unknown as DocumentNode<StoreScheduleQuery, StoreScheduleQueryVariables>;
export const StoreAppointmentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StoreAppointments"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"date"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"AppointmentStatus"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"storeAppointments"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"appointmentNumber"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledDate"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"quoteDescription"}},{"kind":"Field","name":{"kind":"Name","value":"quoteResponse"}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethod"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"customer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}}]}},{"kind":"Field","name":{"kind":"Name","value":"service"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedDuration"}}]}}]}}]}}]} as unknown as DocumentNode<StoreAppointmentsQuery, StoreAppointmentsQueryVariables>;
export const ConfirmAppointmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ConfirmAppointment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"confirmAppointment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<ConfirmAppointmentMutation, ConfirmAppointmentMutationVariables>;
export const VendorCancelAppointmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"VendorCancelAppointment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"vendorCancelAppointment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<VendorCancelAppointmentMutation, VendorCancelAppointmentMutationVariables>;
export const CompleteAppointmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CompleteAppointment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completeAppointment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<CompleteAppointmentMutation, CompleteAppointmentMutationVariables>;
export const MarkNoShowDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkNoShow"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markNoShow"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<MarkNoShowMutation, MarkNoShowMutationVariables>;
export const RespondQuoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RespondQuote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"price"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"response"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"respondQuote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"price"},"value":{"kind":"Variable","name":{"kind":"Name","value":"price"}}},{"kind":"Argument","name":{"kind":"Name","value":"response"},"value":{"kind":"Variable","name":{"kind":"Name","value":"response"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"quoteResponse"}}]}}]}}]} as unknown as DocumentNode<RespondQuoteMutation, RespondQuoteMutationVariables>;
export const ServiceRatingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ServiceRatings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serviceRatings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rating"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"photoUrls"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"customer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"service"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<ServiceRatingsQuery, ServiceRatingsQueryVariables>;
export const AverageStoreRatingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AverageStoreRating"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"averageStoreRating"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"storeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storeId"}}}]}]}}]} as unknown as DocumentNode<AverageStoreRatingQuery, AverageStoreRatingQueryVariables>;