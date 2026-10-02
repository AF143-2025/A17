import { ProviderInterface } from './provider.interface';
import { StandardSmmAdapter } from './standard-smm.adapter';
import { Provider } from '@prisma/client';

export class ProviderFactory {
  static getAdapter(provider: Provider): ProviderInterface {
    if (!provider.apiKey || !provider.apiUrl) {
      throw new Error(`بيانات الاتصال بالمزود (${provider.name}) غير مكتملة أو تفتقر إلى مفتاح API الحقيقي.`);
    }

    const isV3 =
      provider.type === 'STANDARD_SMM_V3' ||
      provider.apiUrl.includes('/v3') ||
      provider.apiUrl.includes('/api/v3');

    return new StandardSmmAdapter(provider.apiUrl, provider.apiKey, {
      version: isV3 ? 'v3' : 'v2',
    });
  }
}
