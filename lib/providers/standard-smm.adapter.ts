import { ProviderInterface, ProviderServiceDto, CreateOrderParams, OrderStatusResult } from './provider.interface';
import { decryptText } from '../crypto';

export interface SmmAdapterOptions {
  version?: 'v2' | 'v3' | string;
}

export class StandardSmmAdapter implements ProviderInterface {
  private apiUrl: string;
  private apiKey: string;
  public isV3: boolean;

  constructor(apiUrl: string, apiKey: string, options?: SmmAdapterOptions) {
    this.apiUrl = apiUrl.trim();
    this.apiKey = decryptText(apiKey);
    this.isV3 =
      options?.version === 'v3' ||
      options?.version === 'STANDARD_SMM_V3' ||
      this.apiUrl.includes('/v3') ||
      this.apiUrl.includes('/api/v3');
  }

  private getBaseRestUrl(): string {
    return this.apiUrl.replace(/\/+$/, '').replace(/\/(services|balance|account|orders)$/i, '');
  }

  private formatError(errorPayload: any): string {
    if (!errorPayload) return 'خطأ غير محدد من المزود';
    if (typeof errorPayload === 'string') return errorPayload;
    if (typeof errorPayload === 'object') {
      return errorPayload.message || errorPayload.error || errorPayload.code || JSON.stringify(errorPayload);
    }
    return String(errorPayload);
  }

  private async request(params: Record<string, any>): Promise<any> {
    const payload: Record<string, any> = {
      key: this.apiKey,
      ...params,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'User-Agent': 'ESAAD-SMM-Engine/3.0',
    };

    if (this.isV3) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const bodyUrlEncoded = new URLSearchParams(payload);

    try {
      let response = await fetch(this.apiUrl, {
        method: 'POST',
        headers,
        body: bodyUrlEncoded.toString(),
        signal: AbortSignal.timeout(15000), // 15-second timeout protection
      });

      // If provider rejects urlencoded (e.g., HTTP 415 or 400 for strict JSON v3 APIs), retry with JSON payload
      if (response.status === 415 || (response.status === 400 && this.isV3)) {
        response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'User-Agent': 'ESAAD-SMM-Engine/3.0',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(15000),
        });
      }

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        if (!response.ok) {
          throw new Error(`خطأ من خادم المزود (${this.isV3 ? 'v3' : 'v2'}): HTTP ${response.status} ${response.statusText}`);
        }
        throw new Error(`استجابة المزود غير صالحة (ليست JSON): ${text.slice(0, 100)}`);
      }

      if (data && data.error) {
        throw new Error(`خطأ من المزود: ${this.formatError(data.error)}`);
      }

      if (!response.ok) {
        throw new Error(`خطأ من خادم المزود: HTTP ${response.status} ${response.statusText}`);
      }

      return data;
    } catch (error: any) {
      console.error(`StandardSmmAdapter (${this.isV3 ? 'v3' : 'v2'}) request failed:`, error);
      throw error;
    }
  }

  async getBalance(): Promise<{ balance: number; currency: string }> {
    // 1. If v3, try modern RESTful /account endpoint first
    if (this.isV3) {
      try {
        const restRes = await fetch(`${this.getBaseRestUrl()}/account`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/json',
            'User-Agent': 'ESAAD-SMM-Engine/3.0',
          },
          signal: AbortSignal.timeout(10000),
        });

        if (restRes.ok) {
          const restData = await restRes.json();
          if (restData && (restData.balance !== undefined || restData.object === 'account')) {
            return {
              balance: parseFloat(String(restData.balance ?? '0')),
              currency: String(restData.currency ?? 'USD'),
            };
          }
        }
      } catch (e) {
        console.warn('REST v3 /account attempt fallback to RPC:', e);
      }
    }

    // 2. Standard RPC fallback (action=balance)
    const res = await this.request({ action: 'balance' });
    const balanceVal = res.balance ?? res.data?.balance ?? res.result?.balance ?? '0';
    const currencyVal = res.currency ?? res.data?.currency ?? res.result?.currency ?? 'USD';
    return {
      balance: parseFloat(String(balanceVal)),
      currency: String(currencyVal),
    };
  }

  async getServices(): Promise<ProviderServiceDto[]> {
    // 1. If v3, try modern RESTful /services endpoint with pagination first
    if (this.isV3) {
      try {
        let allRestServices: any[] = [];
        let startingAfter: any = null;
        let hasMore = true;
        let page = 1;
        let isRestfulV3 = false;

        while (hasMore && page <= 10) {
          let url = `${this.getBaseRestUrl()}/services?limit=500`;
          if (startingAfter) {
            url += `&starting_after=${encodeURIComponent(startingAfter)}`;
          }

          const res = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Accept': 'application/json',
              'User-Agent': 'ESAAD-SMM-Engine/3.0',
            },
            signal: AbortSignal.timeout(15000),
          });

          if (!res.ok) {
            // Not a RESTful v3 or error - stop and fallback to RPC
            break;
          }

          const data = await res.json();
          const items = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : null;

          if (items && items.length > 0) {
            isRestfulV3 = true;
            allRestServices.push(...items);
            hasMore = Boolean(data.has_more);
            startingAfter = items[items.length - 1]?.id;
            page++;
          } else {
            break;
          }
        }

        if (isRestfulV3 && allRestServices.length > 0) {
          return allRestServices.map((item: any) => ({
            service: String(item.id ?? item.service ?? item.service_id),
            name: item.name ?? item.service_name ?? 'بدون اسم',
            type: item.type ?? 'Default',
            category: typeof item.category === 'object'
              ? (item.category?.name || item.category?.slug || 'عام')
              : (item.category || 'عام'),
            rate: parseFloat(String(item.pricing?.rate ?? item.rate ?? item.price ?? item.rate_per_1000 ?? '0')),
            min: parseInt(String(item.limits?.min ?? item.min ?? item.min_quantity ?? '1'), 10),
            max: parseInt(String(item.limits?.max ?? item.max ?? item.max_quantity ?? '10000'), 10),
            dripfeed: Boolean(item.features?.dripfeed ?? item.dripfeed),
            refill: Boolean(item.features?.refill ?? item.refill),
            cancel: Boolean(item.features?.cancel ?? item.cancel),
          }));
        }
      } catch (e) {
        console.warn('REST v3 /services attempt fallback to RPC:', e);
      }
    }

    // 2. Standard RPC fallback (action=services)
    const res = await this.request({ action: 'services' });
    const list = Array.isArray(res)
      ? res
      : Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.services)
      ? res.services
      : [];

    return list.map((item: any) => ({
      service: String(item.service ?? item.id ?? item.service_id),
      name: item.name ?? item.service_name ?? 'بدون اسم',
      type: item.type ?? 'Default',
      category: typeof item.category === 'object'
        ? (item.category?.name || item.category?.slug || 'عام')
        : (item.category || 'عام'),
      rate: parseFloat(String(item.rate ?? item.price ?? item.rate_per_1000 ?? item.pricing?.rate ?? '0')),
      min: parseInt(String(item.min ?? item.min_quantity ?? item.limits?.min ?? '1'), 10),
      max: parseInt(String(item.max ?? item.max_quantity ?? item.limits?.max ?? '10000'), 10),
      dripfeed: Boolean(item.dripfeed ?? item.features?.dripfeed),
      refill: Boolean(item.refill ?? item.features?.refill),
      cancel: Boolean(item.cancel ?? item.features?.cancel),
    }));
  }

  async createOrder(params: CreateOrderParams): Promise<{ providerOrderId: string }> {
    // 1. If v3, try modern RESTful POST /orders endpoint first
    if (this.isV3) {
      try {
        const orderBody: any = {
          service: isNaN(Number(params.serviceId)) ? params.serviceId : Number(params.serviceId),
          link: params.link,
          quantity: Number(params.quantity),
        };
        if (params.runs) orderBody.runs = Number(params.runs);
        if (params.interval) orderBody.interval = Number(params.interval);

        const restRes = await fetch(`${this.getBaseRestUrl()}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'User-Agent': 'ESAAD-SMM-Engine/3.0',
          },
          body: JSON.stringify(orderBody),
          signal: AbortSignal.timeout(15000),
        });

        const restData = await restRes.json();
        if (restRes.ok && (restData.id || restData.order || restData.order_id)) {
          return {
            providerOrderId: String(restData.id ?? restData.order ?? restData.order_id),
          };
        } else if (restData?.error) {
          throw new Error(`خطأ من المزود: ${this.formatError(restData.error)}`);
        }
      } catch (err: any) {
        if (!err.message?.includes('404') && !err.message?.includes('405')) {
          throw err;
        }
      }
    }

    // 2. Standard RPC fallback (action=add)
    const payload: Record<string, any> = {
      action: 'add',
      service: params.serviceId,
      link: params.link,
      quantity: params.quantity,
    };

    if (params.runs) payload.runs = params.runs;
    if (params.interval) payload.interval = params.interval;

    const res = await this.request(payload);
    const orderId = res.order ?? res.data?.order ?? res.order_id ?? res.orderId ?? res.id;
    if (!orderId) {
      throw new Error(this.formatError(res.error || res.message) || 'فشل في استلام رقم الطلب من المزود');
    }

    return {
      providerOrderId: String(orderId),
    };
  }

  async getOrderStatus(providerOrderId: string): Promise<OrderStatusResult> {
    const statusMap: Record<string, OrderStatusResult['status']> = {
      pending: 'Pending',
      processing: 'Processing',
      'in progress': 'In progress',
      completed: 'Completed',
      partial: 'Partial',
      canceled: 'Canceled',
      refunded: 'Refunded',
    };

    // 1. If v3, try modern RESTful GET /orders/{id} endpoint first
    if (this.isV3) {
      try {
        const restRes = await fetch(`${this.getBaseRestUrl()}/orders/${encodeURIComponent(providerOrderId)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/json',
            'User-Agent': 'ESAAD-SMM-Engine/3.0',
          },
          signal: AbortSignal.timeout(10000),
        });

        if (restRes.ok) {
          const dataObj = await restRes.json();
          const rawStatus = (dataObj.status || dataObj.order_status || 'pending').toLowerCase();
          const mappedStatus = statusMap[rawStatus] || 'Processing';

          return {
            charge: dataObj.charge !== undefined ? parseFloat(String(dataObj.charge)) : undefined,
            startCount: (dataObj.start_count ?? dataObj.startCount) !== undefined ? parseInt(String(dataObj.start_count ?? dataObj.startCount), 10) : undefined,
            status: mappedStatus,
            remains: dataObj.remains !== undefined ? parseInt(String(dataObj.remains), 10) : undefined,
            currency: dataObj.currency,
          };
        }
      } catch (e) {
        console.warn('REST v3 /orders/{id} attempt fallback to RPC:', e);
      }
    }

    // 2. Standard RPC fallback (action=status)
    const res = await this.request({
      action: 'status',
      order: providerOrderId,
    });

    const dataObj = res.data ?? res;
    const rawStatus = (dataObj.status || dataObj.order_status || 'pending').toLowerCase();
    const mappedStatus = statusMap[rawStatus] || 'Processing';

    return {
      charge: dataObj.charge !== undefined ? parseFloat(String(dataObj.charge)) : undefined,
      startCount: (dataObj.start_count ?? dataObj.startCount) !== undefined ? parseInt(String(dataObj.start_count ?? dataObj.startCount), 10) : undefined,
      status: mappedStatus,
      remains: dataObj.remains !== undefined ? parseInt(String(dataObj.remains), 10) : undefined,
      currency: dataObj.currency,
    };
  }

  async cancelOrder(providerOrderId: string): Promise<boolean> {
    if (this.isV3) {
      try {
        const restRes = await fetch(`${this.getBaseRestUrl()}/orders/${encodeURIComponent(providerOrderId)}/cancel`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/json',
            'User-Agent': 'ESAAD-SMM-Engine/3.0',
          },
          signal: AbortSignal.timeout(10000),
        });
        if (restRes.ok) return true;
      } catch {
        // Fallback to RPC
      }
    }

    try {
      const res = await this.request({
        action: 'cancel',
        orders: providerOrderId,
        order: providerOrderId,
      });
      return !res.error;
    } catch {
      return false;
    }
  }

  async refillOrder(providerOrderId: string): Promise<boolean> {
    if (this.isV3) {
      try {
        const restRes = await fetch(`${this.getBaseRestUrl()}/orders/${encodeURIComponent(providerOrderId)}/refill`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/json',
            'User-Agent': 'ESAAD-SMM-Engine/3.0',
          },
          signal: AbortSignal.timeout(10000),
        });
        if (restRes.ok) return true;
      } catch {
        // Fallback to RPC
      }
    }

    try {
      const res = await this.request({
        action: 'refill',
        order: providerOrderId,
        orders: providerOrderId,
      });
      const dataObj = res.data ?? res;
      return Boolean(dataObj.refill);
    } catch {
      return false;
    }
  }
}
