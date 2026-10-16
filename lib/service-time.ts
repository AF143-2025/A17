/**
 * Helper to extract the actual time and speed mentioned in service details.
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
      timeText: 'تلقائي حسب سرعة النظام',
      source: 'unspecified',
      badge: 'تلقائي ⚡',
    };
  }

  const combined = `${service.name || ''} ${service.description || ''} ${service.nameAr || ''}`;

  // 1. Check for specific Arabic phrases
  if (/(?:نصف\s*ساعة)/i.test(combined)) {
    return {
      timeText: 'نصف ساعة (بدء فوري)',
      source: 'provider_explicit',
      badge: 'وقت البدء ⏱️',
    };
  }
  if (/(?:ساعتان|ساعتين)/i.test(combined)) {
    return {
      timeText: 'ساعتان (بدء فوري)',
      source: 'provider_explicit',
      badge: 'وقت البدء ⏱️',
    };
  }
  if (/(?:يومان|يومين)/i.test(combined)) {
    return {
      timeText: 'يومان (معدل قياسي)',
      source: 'provider_explicit',
      badge: 'وقت البدء ⏱️',
    };
  }

  // 2. Check for explicit minutes in text (e.g. 10-30 min, 15 minutes, 15 دقيقة)
  const minMatch = combined.match(/(\d+\s*-\s*\d+|\d+)\s*(?:min|mins|minutes|دقيقة|دقائق)/i);
  if (minMatch) {
    return {
      timeText: `${minMatch[1]} دقيقة (بدء فوري)`,
      source: 'provider_explicit',
      badge: 'وقت البدء ⏱️',
    };
  }

  // 3. Check for explicit hours in text (e.g. 0-1 hour, 1-6 hours, 2 hours, ساعة)
  const hourMatch = combined.match(/(\d+\s*-\s*\d+|\d+)\s*(?:hour|hours|hr|hrs|ساعة|ساعات)/i);
  if (hourMatch) {
    return {
      timeText: `${hourMatch[1]} ساعة (بدء فوري)`,
      source: 'provider_explicit',
      badge: 'وقت البدء ⏱️',
    };
  }

  // 4. Check for days (e.g. 1-2 days, 24 hours)
  const dayMatch = combined.match(/(\d+\s*-\s*\d+|\d+)\s*(?:day|days|يوم|أيام)/i);
  if (dayMatch && !combined.match(/day\s*\d+/i) && !combined.match(/\d+[km]?\/day/i)) {
    return {
      timeText: `${dayMatch[1]} يوم (معدل قياسي)`,
      source: 'provider_explicit',
      badge: 'وقت البدء ⏱️',
    };
  }

  // 5. Check for Instant Start
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
      timeText: 'بدء فوري ⚡ (مباشر ومضمون)',
      source: 'provider_instant',
      badge: 'فوري ⚡',
    };
  }

  // 6. Check for Daily Speed (e.g. Day 100K, 10M, 50K/Day)
  const speedMatch = combined.match(/day\s*(\d+[km]?|\d+)/i) || combined.match(/(\d+[km]?)\s*\/\s*(?:day|days|يوم)/i);
  if (speedMatch) {
    return {
      timeText: `سرعة التسليم: ${speedMatch[1].toUpperCase()} / يوم`,
      source: 'provider_speed',
      badge: 'سرعة التسليم ⚡',
    };
  }

  // 7. Check if explicit avgTime exists in DB and is NOT the old default '15 دقيقة'
  if (service.avgTime && service.avgTime !== '15 دقيقة') {
    return {
      timeText: `${service.avgTime} (معدل دقيق)`,
      source: 'provider_explicit',
      badge: 'وقت البدء ⏱️',
    };
  }

  // 8. If service has a specific non-default speed
  if (service.speed && service.speed !== 'فوري ⚡' && service.speed !== 'فوري') {
    return {
      timeText: `السرعة: ${service.speed}`,
      source: 'provider_speed',
      badge: 'سرعة قياسية',
    };
  }

  // 9. If no specific time or speed is mentioned
  return {
    timeText: 'فوري وتلقائي حسب سرعة النظام',
    source: 'unspecified',
    badge: 'تلقائي ⚡',
  };
}
