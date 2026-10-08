/**
 * Helper to extract the actual time and speed mentioned by the provider.
 * Does not hardcode or invent any fake numbers.
 */
export function getProviderMentionedTime(service?: {
  name?: string;
  nameAr?: string;
  description?: string;
  speed?: string;
  avgTime?: string;
}): {
  timeText: string;
  source: 'provider_explicit' | 'provider_speed' | 'provider_instant' | 'unspecified';
  badge: string;
} {
  if (!service) {
    return {
      timeText: 'حسب سيرفر المزود',
      source: 'unspecified',
      badge: 'حسب المزود',
    };
  }

  const combined = `${service.name || ''} ${service.description || ''} ${service.nameAr || ''}`;

  // 1. Check for specific Arabic phrases
  if (/(?:نصف\s*ساعة)/i.test(combined)) {
    return {
      timeText: 'نصف ساعة (حسب المزود)',
      source: 'provider_explicit',
      badge: 'وقت المزود ⏱️',
    };
  }
  if (/(?:ساعتان|ساعتين)/i.test(combined)) {
    return {
      timeText: 'ساعتان (حسب المزود)',
      source: 'provider_explicit',
      badge: 'وقت المزود ⏱️',
    };
  }
  if (/(?:يومان|يومين)/i.test(combined)) {
    return {
      timeText: 'يومان (حسب المزود)',
      source: 'provider_explicit',
      badge: 'وقت المزود ⏱️',
    };
  }

  // 2. Check for explicit minutes in provider text (e.g. 10-30 min, 15 minutes, 15 دقيقة)
  const minMatch = combined.match(/(\d+\s*-\s*\d+|\d+)\s*(?:min|mins|minutes|دقيقة|دقائق)/i);
  if (minMatch) {
    return {
      timeText: `${minMatch[1]} دقيقة (حسب المزود)`,
      source: 'provider_explicit',
      badge: 'وقت المزود ⏱️',
    };
  }

  // 3. Check for explicit hours in provider text (e.g. 0-1 hour, 1-6 hours, 2 hours, ساعة)
  const hourMatch = combined.match(/(\d+\s*-\s*\d+|\d+)\s*(?:hour|hours|hr|hrs|ساعة|ساعات)/i);
  if (hourMatch) {
    return {
      timeText: `${hourMatch[1]} ساعة (حسب المزود)`,
      source: 'provider_explicit',
      badge: 'وقت المزود ⏱️',
    };
  }

  // 4. Check for days (e.g. 1-2 days, 24 hours)
  const dayMatch = combined.match(/(\d+\s*-\s*\d+|\d+)\s*(?:day|days|يوم|أيام)/i);
  if (dayMatch && !combined.match(/day\s*\d+/i) && !combined.match(/\d+[km]?\/day/i)) {
    return {
      timeText: `${dayMatch[1]} يوم (حسب المزود)`,
      source: 'provider_explicit',
      badge: 'وقت المزود ⏱️',
    };
  }

  // 5. Check for Instant Start from provider
  if (/instant\s*start|instant|بدء\s*فوري|فوري/i.test(combined)) {
    const speedMatch = combined.match(/day\s*(\d+[km]?|\d+)/i) || combined.match(/(\d+[km]?)\s*\/\s*(?:day|days|يوم)/i);
    if (speedMatch) {
      return {
        timeText: `بدء فوري ⚡ (السرعة: ${speedMatch[1].toUpperCase()} / يوم)`,
        source: 'provider_instant',
        badge: 'فوري ⚡',
      };
    }
    return {
      timeText: 'بدء فوري ⚡ (مذكور من المزود)',
      source: 'provider_instant',
      badge: 'فوري ⚡',
    };
  }

  // 6. Check for Provider Daily Speed (e.g. Day 100K, 10M, 50K/Day)
  const speedMatch = combined.match(/day\s*(\d+[km]?|\d+)/i) || combined.match(/(\d+[km]?)\s*\/\s*(?:day|days|يوم)/i);
  if (speedMatch) {
    return {
      timeText: `سرعة التسليم: ${speedMatch[1].toUpperCase()} / يوم (وفق المزود)`,
      source: 'provider_speed',
      badge: 'سرعة المزود',
    };
  }

  // 7. Check if explicit avgTime exists in DB and is NOT the old default '15 دقيقة'
  if (service.avgTime && service.avgTime !== '15 دقيقة') {
    return {
      timeText: `${service.avgTime} (حسب المزود)`,
      source: 'provider_explicit',
      badge: 'وقت المزود ⏱️',
    };
  }

  // 8. If service has a specific non-default speed from provider
  if (service.speed && service.speed !== 'فوري ⚡' && service.speed !== 'فوري') {
    return {
      timeText: `السرعة: ${service.speed} (وفق المزود)`,
      source: 'provider_speed',
      badge: 'وفق المزود',
    };
  }

  // 9. If provider did not mention any time or speed
  return {
    timeText: 'حسب سرعة واستجابة سيرفر المزود (بدء فوري تلقائي)',
    source: 'unspecified',
    badge: 'حسب المزود',
  };
}
