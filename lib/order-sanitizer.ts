/**
 * Order and Event Sanitizer for Customer-Facing APIs & UI
 * Strictly strips internal provider details, wholesale costs, profits, external IDs,
 * and neutralizes all event messages so no provider details leak to normal users.
 */

export function sanitizeEventMessage(message?: string): string {
  if (!message) return '';

  let sanitized = message;

  // Specific common patterns in orderEvent
  if (sanitized.includes('تم توجيه الطلب بنجاح إلى المزود') || sanitized.includes('SENT_TO_PROVIDER')) {
    return 'تم توجيه وتأكيد الطلب بنجاح في شبكة التنفيذ المباشرة';
  }

  if (sanitized.includes('فشل التنفيذ لدى المزود') || sanitized.includes('DISPATCH_FAILED')) {
    return 'تعذر استكمال معالجة الطلب، وتم استرجاع الرصيد إلى محفظتك تلقائياً';
  }

  if (sanitized.includes('تم إلغاء الطلب من قبل المزود') || sanitized.includes('من قبل المزود')) {
    return sanitized.replace(/من قبل المزود/g, 'من النظام').replace(/للمزود/g, 'للنظام');
  }

  // General replacements for provider mentions and external IDs
  sanitized = sanitized
    .replace(/ReliableSMM/gi, 'سيرفر التنفيذ المباشر')
    .replace(/SMM\s*World/gi, 'سيرفر التنفيذ المباشر')
    .replace(/\(رقم الطلب الخارجي:?\s*#?[^)]+\)/gi, '')
    .replace(/رقم الطلب الخارجي:?\s*#?\w+/gi, '')
    .replace(/إلى المزود:?/gi, 'إلى شبكة التنفيذ')
    .replace(/لدى المزود:?/gi, 'في شبكة التنفيذ')
    .replace(/من المزود:?/gi, 'من نظام التنفيذ')
    .replace(/المزودين/gi, 'سيرفرات الخدمة')
    .replace(/المزود/gi, 'سيرفر التنفيذ')
    .trim();

  return sanitized;
}

export function sanitizeOrderForCustomer(order: any): any {
  if (!order) return order;

  // Deep clone to avoid mutating in-memory cache or DB references
  const raw = typeof order.toJSON === 'function' ? order.toJSON() : { ...order };

  // Remove internal provider IDs, costs, profit margins and idempotency keys
  const {
    cost,
    profit,
    providerId,
    providerOrderId,
    idempotencyKey,
    provider,
    serviceProviders,
    ...cleanOrder
  } = raw;

  // Sanitize service object if present
  if (cleanOrder.service) {
    const {
      providerCostPer1000,
      providerId: sProviderId,
      providerServiceId,
      serviceProviders: sProviders,
      provider: sProvider,
      ...cleanService
    } = cleanOrder.service;

    cleanOrder.service = cleanService;
  }

  // Sanitize events and remove technical data payload
  if (Array.isArray(cleanOrder.events)) {
    cleanOrder.events = cleanOrder.events.map((e: any) => ({
      id: e.id,
      orderId: e.orderId,
      eventType: e.eventType,
      message: sanitizeEventMessage(e.message),
      createdAt: e.createdAt,
    }));
  }

  return cleanOrder;
}

export function sanitizeOrdersForCustomer(orders: any[]): any[] {
  if (!Array.isArray(orders)) return [];
  return orders.map((o) => sanitizeOrderForCustomer(o));
}
