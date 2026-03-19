import { gql } from '@apollo/client';

export const LOGIN = gql`
  mutation LoginVendor($input: LoginInput!, $forceLogin: Boolean) {
    loginVendor(input: $input, forceLogin: $forceLogin) {
      accessToken
      user { id name email role emailVerified phoneVerified }
    }
  }
`;

export const REGISTER = gql`
  mutation RegisterVendor($input: RegisterVendorInput!) {
    registerVendor(input: $input) {
      accessToken
      user { id name email role cpf emailVerified phoneVerified }
    }
  }
`;

export const VALIDATE_REGISTRATION = gql`
  mutation ValidateRegistration($email: String!, $cpf: String!, $phone: String!, $userType: String) {
    validateRegistration(email: $email, cpf: $cpf, phone: $phone, userType: $userType) {
      valid
      emailError
      cpfError
      phoneError
    }
  }
`;

export const SEND_VERIFICATION_CODE = gql`
  mutation SendVerificationCode($input: SendCodeInput!) {
    sendVerificationCode(input: $input)
  }
`;

export const VERIFY_CODE = gql`
  mutation VerifyCode($input: VerifyCodeInput!) {
    verifyCode(input: $input)
  }
`;

export const SEND_EMAIL_VERIFICATION = gql`
  mutation SendEmailVerification($userType: String) {
    sendEmailVerification(userType: $userType)
  }
`;

export const CONFIRM_EMAIL_VERIFICATION = gql`
  mutation ConfirmEmailVerification($code: String!, $userType: String) {
    confirmEmailVerification(code: $code, userType: $userType)
  }
`;

export const GET_MY_STORES = gql`
  query MyStores {
    myStores {
      id name description isOpen hasOwnDelivery freeDelivery deliveryFee
      estimatedDeliveryMinutes minimumOrder deliveryStartTime deliveryEndTime freeDeliveryAbove
      phone street number complement neighborhood city state zipCode
      logoUrl bannerUrl latitude longitude
      verificationLevel verificationScore totalSales totalProducts createdAt
      badgeClaimCount lastClaimedScore freePromoDaysCredit
      commissionReductionPercent commissionReductionExpiresAt
      products { id name price isAvailable isActive stock imageUrl barcode isVariableWeight category { id name } }
      categories { id name }
    }
  }
`;

export const UPDATE_STORE = gql`
  mutation UpdateStore($input: UpdateStoreInput!) {
    updateStore(input: $input) {
      id name description phone street number complement neighborhood city state zipCode
      hasOwnDelivery freeDelivery deliveryFee estimatedDeliveryMinutes minimumOrder
      deliveryStartTime deliveryEndTime freeDeliveryAbove logoUrl bannerUrl latitude longitude
    }
  }
`;

export const GET_STORE_ORDERS = gql`
  query StoreOrders($storeId: String!) {
    storeOrders(storeId: $storeId) {
      id orderNumber status total subtotal discount couponCode createdAt
      customer { id name phone avatarUrl }
      items { id quantity weightGrams unitPrice totalPrice product { name price promotionalPrice isVariableWeight imageUrl } }
      delivery { id deliverer { name phone } }
    }
  }
`;

export const ADJUST_ORDER_ITEM_WEIGHT = gql`
  mutation AdjustOrderItemWeight($orderItemId: ID!, $actualWeightGrams: Int!) {
    adjustOrderItemWeight(orderItemId: $orderItemId, actualWeightGrams: $actualWeightGrams) {
      id
      subtotal
      total
      items {
        id
        quantity
        weightGrams
        unitPrice
        totalPrice
        product { id name isVariableWeight }
      }
    }
  }
`;

export const CREATE_STORE = gql`
  mutation CreateStore($input: CreateStoreInput!) {
    createStore(input: $input) { id name }
  }
`;

export const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) { id name price isVariableWeight }
  }
`;

export const CREATE_CATEGORY = gql`
  mutation CreateCategory($name: String!, $storeId: String!) {
    createCategory(name: $name, storeId: $storeId) { id name }
  }
`;

export const UPLOAD_IMAGE = gql`
  mutation UploadImage($base64: String!, $folder: String) {
    uploadImage(base64: $base64, folder: $folder)
  }
`;

export const SEARCH_PRODUCT_IMAGES = gql`
  query SearchProductImages($query: String!) {
    searchProductImages(query: $query)
  }
`;

export const UPLOAD_FROM_URL = gql`
  mutation UploadFromUrl($url: String!, $folder: String) {
    uploadFromUrl(url: $url, folder: $folder)
  }
`;

export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: String!) {
    deleteProduct(id: $id)
  }
`;

export const GET_DELETED_PRODUCTS = gql`
  query DeletedProductsByStore($storeId: String!) {
    deletedProductsByStore(storeId: $storeId) {
      id name price unit imageUrl barcode deletedAt
      category { id name }
    }
  }
`;

export const RESTORE_PRODUCT = gql`
  mutation RestoreProduct($id: String!) {
    restoreProduct(id: $id) { id name }
  }
`;

export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($input: UpdateProductInput!) {
    updateProduct(input: $input) { id name price description unit imageUrl stock isVariableWeight }
  }
`;

export const TOGGLE_PRODUCT_AVAILABILITY = gql`
  mutation ToggleProductAvailability($id: String!) {
    toggleProductAvailability(id: $id) { id isAvailable }
  }
`;

export const TOGGLE_PRODUCT_ACTIVE = gql`
  mutation ToggleProductActive($id: String!) {
    toggleProductActive(id: $id) { id isActive isAvailable }
  }
`;

export const DELETE_CATEGORY = gql`
  mutation DeleteCategory($id: String!) {
    deleteCategory(id: $id)
  }
`;

export const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($id: String!, $status: OrderStatus!) {
    updateOrderStatus(id: $id, status: $status) { id status }
  }
`;

export const REJECT_ORDER = gql`
  mutation RejectOrder($orderId: String!, $reason: String!) {
    rejectOrder(orderId: $orderId, reason: $reason) { id status }
  }
`;

export const VENDOR_CONFIRM_PICKUP = gql`
  mutation VendorConfirmPickup($orderId: String!) {
    vendorConfirmPickup(orderId: $orderId) { id status }
  }
`;

export const TOGGLE_STORE_OPEN = gql`
  mutation ToggleStoreOpen($id: String!) {
    toggleStoreOpen(id: $id) { id isOpen }
  }
`;

export const REQUEST_VENDOR_STORE_DELETE = gql`
  mutation RequestVendorStoreDelete($storeId: String!, $password: String!) {
    requestVendorStoreDelete(storeId: $storeId, password: $password)
  }
`;

export const GET_MY_PLAN = gql`
  query MeVendor {
    meVendor {
      id name cpf vendorPlan planExpiresAt paymentConnected
      acceptedTermsAt acceptedSubscriptionTermsAt
      emailVerified phoneVerified
      stores { id }
    }
  }
`;

export const GET_MY_PROFILE = gql`
  query MyVendorProfile {
    meVendor {
      id name email phone vendorPlan emailVerified googleId
    }
  }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateVendorProfile($name: String, $phone: String, $currentPassword: String, $newPassword: String, $email: String) {
    updateVendorProfile(name: $name, phone: $phone, currentPassword: $currentPassword, newPassword: $newPassword, email: $email) {
      id name phone email emailVerified
    }
  }
`;

export const GOOGLE_AUTH_VENDOR = gql`
  mutation GoogleAuthVendor($idToken: String!, $forceLogin: Boolean) {
    googleAuthVendor(idToken: $idToken, forceLogin: $forceLogin) {
      accessToken
      user { id name email role cpf emailVerified phoneVerified }
    }
  }
`;

export const REGISTER_VENDOR_WITH_GOOGLE = gql`
  mutation RegisterVendorWithGoogle($idToken: String!, $phone: String!, $cpf: String!) {
    registerVendorWithGoogle(idToken: $idToken, phone: $phone, cpf: $cpf) {
      accessToken
      user { id name email role cpf emailVerified phoneVerified }
    }
  }
`;

export const GET_CONTRACT_CONTENT = gql`
  query ContractContent($type: String!) {
    contractContent(type: $type)
  }
`;

export const ACCEPT_TERMS = gql`
  mutation AcceptVendorTerms {
    acceptVendorTerms { id acceptedTermsAt }
  }
`;

export const ACCEPT_SUBSCRIPTION_TERMS = gql`
  mutation AcceptSubscriptionTerms {
    acceptSubscriptionTerms { id acceptedSubscriptionTermsAt }
  }
`;

export const DISCONNECT_PAYMENT = gql`
  mutation DisconnectPayment {
    disconnectPayment
  }
`;

export const GET_AVAILABLE_PLANS = gql`
  query AvailablePlans {
    availablePlans {
      plan maxStores monthlyPrice quarterlyPrice semiannualPrice annualPrice
      commissionPercent freePromosPerWeek maxProductsPerStore maxEmailsPerMonth
      listingPriority highlightDaysPerMonth canUseCoupons hasAnalytics
      supportLevel isContactSales
    }
  }
`;

export const CREATE_PROMOTION = gql`
  mutation CreatePromotion($input: CreatePromotionInput!) {
    createPromotion(input: $input) { id title checkoutUrl }
  }
`;

export const MY_PROMOTIONS = gql`
  query MyPromotions {
    myPromotions {
      id title description imageUrl startDate endDate isActive isPaid
      promotionalPrice adCost
      store { id name }
      product { id name imageUrl price }
    }
  }
`;

export const GET_PROMO_PRICE_PER_DAY = gql`
  query PromoPricePerDay {
    promoPricePerDay
  }
`;

export const DELETE_PROMOTION = gql`
  mutation DeletePromotion($id: String!) {
    deletePromotion(id: $id)
  }
`;

export const SWAP_PROMOTION_PRODUCT = gql`
  mutation SwapPromotionProduct($id: String!, $productId: String!, $promotionalPrice: Float!, $title: String!) {
    swapPromotionProduct(id: $id, productId: $productId, promotionalPrice: $promotionalPrice, title: $title) {
      id title promotionalPrice imageUrl
      product { id name imageUrl price }
    }
  }
`;

export const CREATE_PLAN_UPGRADE = gql`
  mutation CreatePlanUpgrade($plan: VendorPlan!, $billingPeriod: String) {
    createPlanUpgrade(plan: $plan, billingPeriod: $billingPeriod) {
      id checkoutUrl status
    }
  }
`;

export const GET_ACTIVE_PROMOTIONS = gql`
  query ActivePromotions {
    activePromotions {
      id title description imageUrl startDate endDate isActive isPaid price
      store { id name }
    }
  }
`;

// ─── Coupons ───

export const GET_STORE_COUPONS = gql`
  query StoreCoupons($storeId: String!) {
    storeCoupons(storeId: $storeId) {
      id code discountType discountValue minimumOrder maxDiscount maxUses usesCount isActive expiresAt createdAt
      store { id name }
    }
  }
`;

export const CREATE_COUPON = gql`
  mutation CreateCoupon($input: CreateCouponInput!) {
    createCoupon(input: $input) {
      id code discountType discountValue minimumOrder maxDiscount maxUses isActive expiresAt
    }
  }
`;

export const UPDATE_COUPON = gql`
  mutation UpdateCoupon($input: UpdateCouponInput!) {
    updateCoupon(input: $input) {
      id code discountType discountValue minimumOrder maxDiscount maxUses isActive expiresAt
    }
  }
`;

export const TOGGLE_COUPON_ACTIVE = gql`
  mutation ToggleCouponActive($id: String!) {
    toggleCouponActive(id: $id) { id isActive }
  }
`;

export const DELETE_COUPON = gql`
  mutation DeleteCoupon($id: String!) {
    deleteCoupon(id: $id)
  }
`;

// ─── Barcode & Bulk Import ───

export const LOOKUP_BARCODE = gql`
  query LookupBarcode($barcode: String!) {
    lookupBarcode(barcode: $barcode) {
      barcode name description imageUrl brand quantity
    }
  }
`;

export const SEARCH_CATALOG = gql`
  query SearchCatalog($query: String!, $limit: Int) {
    searchCatalog(query: $query, limit: $limit) {
      id name description price imageUrl unit barcode
      store { id name }
    }
  }
`;

export const BULK_CREATE_PRODUCTS = gql`
  mutation BulkCreateProducts($input: BulkCreateProductsInput!) {
    bulkCreateProducts(input: $input) {
      created errors
    }
  }
`;

export const CLAIM_BADGE_REWARD = gql`
  mutation ClaimBadgeReward($storeId: String!, $level: String!) {
    claimBadgeReward(storeId: $storeId, level: $level) {
      id verificationLevel verificationScore
      badgeClaimCount lastClaimedScore freePromoDaysCredit
      commissionReductionPercent commissionReductionExpiresAt
    }
  }
`;

// ─── Cart Summary ───

export const GET_STORE_CART_SUMMARY = gql`
  query StoreCartSummary($storeId: String!) {
    storeCartSummary(storeId: $storeId) {
      productId
      productName
      productImageUrl
      totalPeople
      totalQuantity
    }
  }
`;

// ─── Badge Config ───

export const GET_BADGE_CONFIG = gql`
  query BadgeConfig {
    badgeConfig
  }
`;

// ─── Subscriptions ───

export const ORDER_CREATED_SUB = gql`
  subscription OrderCreated($storeId: String) {
    orderCreated(storeId: $storeId) {
      id orderNumber status total createdAt
      customer { name phone }
      items { id quantity totalPrice product { name } }
    }
  }
`;

export const ORDER_UPDATED_SUB = gql`
  subscription OrderUpdated($storeId: String) {
    orderUpdated(storeId: $storeId) {
      id orderNumber status total createdAt
      customer { name phone }
      items { id quantity totalPrice product { name } }
      delivery { id deliverer { name phone } }
    }
  }
`;

export const STORE_UPDATED_SUB = gql`
  subscription StoreUpdated($storeId: String) {
    storeUpdated(storeId: $storeId) {
      id name isOpen isActive
    }
  }
`;

export const PRODUCT_UPDATED_SUB = gql`
  subscription ProductUpdated($storeId: String) {
    productUpdated(storeId: $storeId) {
      id name price isAvailable stock imageUrl
      category { id name }
    }
  }
`;

// ─── Recipient / Earnings ───

export const REGISTER_RECIPIENT = gql`
  mutation RegisterRecipient($recipientData: String!) {
    registerRecipient(recipientData: $recipientData)
  }
`;

export const MY_BALANCE = gql`
  query MyBalance {
    myBalance {
      availableAmount
      waitingFundsAmount
      transferredAmount
    }
  }
`;

export const SIMULATE_ANTICIPATION = gql`
  query SimulateAnticipation {
    simulateAnticipation {
      originalAmount
      anticipatedAmount
      fee
      feePercentage
    }
  }
`;

export const REQUEST_ANTICIPATION = gql`
  mutation RequestAnticipation {
    requestAnticipation {
      id
      status
      requestedAmount
      approvedAmount
      fee
      createdAt
    }
  }
`;

export const TOGGLE_AUTO_ANTICIPATION = gql`
  mutation ToggleAutoAnticipation($enabled: Boolean!) {
    toggleAutoAnticipation(enabled: $enabled)
  }
`;

export const REQUEST_PASSWORD_RESET = gql`
  mutation RequestPasswordResetVendor($email: String!) {
    requestPasswordResetVendor(email: $email)
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword, type: "vendor")
  }
`;

export const SESSION_KICKED_SUB = gql`
  subscription SessionKicked($userId: String!, $userType: String) {
    sessionKicked(userId: $userId, userType: $userType) {
      userId
      userType
    }
  }
`;
