export interface ProviderServiceDto {
  service: string;
  name: string;
  type?: string;
  category: string;
  rate: number;
  min: number;
  max: number;
  dripfeed?: boolean;
  refill?: boolean;
  cancel?: boolean;
}

export interface CreateOrderParams {
  serviceId: string;
  link: string;
  quantity: number;
  runs?: number;
  interval?: number;
}

export interface OrderStatusResult {
  charge?: number;
  startCount?: number;
  status: 'Pending' | 'Processing' | 'In progress' | 'Completed' | 'Partial' | 'Canceled' | 'Refunded';
  remains?: number;
  currency?: string;
}

export interface ProviderInterface {
  getBalance(): Promise<{ balance: number; currency: string }>;
  getServices(): Promise<ProviderServiceDto[]>;
  createOrder(params: CreateOrderParams): Promise<{ providerOrderId: string }>;
  getOrderStatus(providerOrderId: string): Promise<OrderStatusResult>;
  cancelOrder(providerOrderId: string): Promise<boolean>;
  refillOrder(providerOrderId: string): Promise<boolean>;
}
