import { gql } from '@apollo/client';

export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      user { id name email role }
    }
  }
`;

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      user { id name email role }
    }
  }
`;

export const GET_MY_STORES = gql`
  query MyStores {
    myStores {
      id name description isOpen hasOwnDelivery freeDelivery deliveryFee
      estimatedDeliveryMinutes minimumOrder deliveryStartTime deliveryEndTime freeDeliveryAbove
      phone street number complement neighborhood city state zipCode
      logoUrl bannerUrl
      products { id name price isAvailable stock imageUrl category { id name } }
      categories { id name }
    }
  }
`;

export const UPDATE_STORE = gql`
  mutation UpdateStore($input: UpdateStoreInput!) {
    updateStore(input: $input) {
      id name description phone street number complement neighborhood city state zipCode
      hasOwnDelivery freeDelivery deliveryFee estimatedDeliveryMinutes minimumOrder
      deliveryStartTime deliveryEndTime freeDeliveryAbove logoUrl bannerUrl
    }
  }
`;

export const GET_STORE_ORDERS = gql`
  query StoreOrders($storeId: String!) {
    storeOrders(storeId: $storeId) {
      id orderNumber status total createdAt
      customer { name phone }
      items { id quantity totalPrice product { name } }
      delivery { id deliverer { name phone } }
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
    createProduct(input: $input) { id name price }
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

export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($input: UpdateProductInput!) {
    updateProduct(input: $input) { id name price description unit imageUrl stock }
  }
`;

export const TOGGLE_PRODUCT_AVAILABILITY = gql`
  mutation ToggleProductAvailability($id: String!) {
    toggleProductAvailability(id: $id) { id isAvailable }
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

export const TOGGLE_STORE_OPEN = gql`
  mutation ToggleStoreOpen($id: String!) {
    toggleStoreOpen(id: $id) { id isOpen }
  }
`;

export const GET_MY_PLAN = gql`
  query Me {
    me {
      id vendorPlan planExpiresAt mpConnected
      stores { id }
    }
  }
`;

export const GET_MP_CONNECT_URL = gql`
  query MpConnectUrl {
    mpConnectUrl
  }
`;

export const DISCONNECT_MP = gql`
  mutation DisconnectMercadoPago {
    disconnectMercadoPago
  }
`;

export const GET_AVAILABLE_PLANS = gql`
  query AvailablePlans {
    availablePlans {
      plan maxStores canPromote monthlyPrice
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
  mutation CreatePlanUpgrade($plan: VendorPlan!) {
    createPlanUpgrade(plan: $plan) {
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
