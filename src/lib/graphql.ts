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
      id name description isOpen deliveryFee estimatedDeliveryMinutes
      products { id name price isAvailable stock }
      categories { id name }
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
      id vendorPlan planExpiresAt
      stores { id }
    }
  }
`;

export const GET_AVAILABLE_PLANS = gql`
  query AvailablePlans {
    availablePlans {
      plan maxStores commissionRate platformDeliveryFee canPromote monthlyPrice
    }
  }
`;

export const CREATE_PROMOTION = gql`
  mutation CreatePromotion($input: CreatePromotionInput!) {
    createPromotion(input: $input) { id title }
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
