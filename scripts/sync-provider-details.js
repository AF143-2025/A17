const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf-8');
const directUrl = envFile.split('\n').find(l => l.startsWith('DIRECT_URL=')).split('=').slice(1).join('=').trim().replace(/["']/g, '');

const prisma = new PrismaClient({ datasources: { db: { url: directUrl } } });

function formatTimeArabic(timeStr) {
  if (!timeStr) return '';
  let str = timeStr.trim();
  str = str.replace(/(\d+)\s*hours?/gi, '$1 ساعة');
  str = str.replace(/(\d+)\s*minutes?/gi, '$1 دقيقة');
  str = str.replace(/(\d+)\s*days?/gi, '$1 يوم');
  str = str.replace(/and/gi, 'و');
  return str;
}

async function main() {
  console.log('1. Fetching service table from ReliableSMM for live Average Time...');
  const tableRes = await fetch('https://reliablesmm.com/services');
  const tableHtml = await tableRes.text();

  const avgTimeMap = new Map();
  const tableRe = /data-filter-table-service-id="(\d+)"[\s\S]*?<td data-label="Average time"[^>]*>([\s\S]*?)<\/td>/g;
  let tMatch;
  while ((tMatch = tableRe.exec(tableHtml)) !== null) {
    const id = tMatch[1];
    const rawTime = tMatch[2].trim();
    if (rawTime && !rawTime.toLowerCase().includes('not enough data')) {
      avgTimeMap.set(id, rawTime);
    }
  }
  console.log(`Found Average Time for ${avgTimeMap.size} services in table.`);

  console.log('2. Loading active services from database...');
  const activeServices = await prisma.service.findMany({
    where: { status: true },
    select: { id: true, name: true, providerServiceId: true, description: true, speed: true, avgTime: true }
  });
  console.log(`Found ${activeServices.length} active services to update.`);

  let updatedCount = 0;
  let withDescCount = 0;

  // Concurrency helper
  const concurrency = 10;
  for (let i = 0; i < activeServices.length; i += concurrency) {
    const chunk = activeServices.slice(i, i + concurrency);
    await Promise.all(chunk.map(async (service) => {
      if (!service.providerServiceId) return;

      const extId = service.providerServiceId;
      const rawAvgTime = avgTimeMap.get(extId);
      const arabicAvgTime = rawAvgTime ? formatTimeArabic(rawAvgTime) : null;

      let description = null;
      let speed = service.speed;
      let startTime = null;

      try {
        const descRes = await fetch(`https://reliablesmm.com/services/get-service-description/${extId}`, {
          headers: {
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (descRes.ok) {
          const data = await descRes.json();
          if (data && data.description && data.description.trim()) {
            description = data.description.trim();
            withDescCount++;

            // Extract Speed if present in description (e.g. - Speed: Day 100K)
            const speedMatch = description.match(/-\s*Speed:\s*([^\n\r]+)/i);
            if (speedMatch) {
              speed = speedMatch[1].trim();
            }

            // Extract Start Time if present in description (e.g. - Start Time: 0-10 Minutes)
            const startMatch = description.match(/-\s*Start\s*Time:\s*([^\n\r]+)/i);
            if (startMatch) {
              startTime = startMatch[1].trim();
            }
          }
        }
      } catch (err) {
        // Ignore single fetch failure
      }

      // If no custom description was returned by provider, construct clean detailed specs from service name
      if (!description) {
        description = `${service.name}\n- السرعة والتنفيذ: ${arabicAvgTime || 'فوري ⚡'}\n- جودة الخدمة: حسابات عالية الجودة ومضمونة بنسبة 100%`;
      }

      // Determine the best avgTime to store
      const finalAvgTime = arabicAvgTime || (startTime ? formatTimeArabic(startTime) : service.avgTime);

      await prisma.service.update({
        where: { id: service.id },
        data: {
          description,
          avgTime: finalAvgTime,
          speed: speed || service.speed,
        }
      });
      updatedCount++;
    }));

    if ((i + concurrency) % 50 === 0 || i + concurrency >= activeServices.length) {
      console.log(`Progress: ${Math.min(i + concurrency, activeServices.length)} / ${activeServices.length} services processed...`);
    }
  }

  console.log(`\nDONE! Updated ${updatedCount} services.`);
  console.log(`Services with exact provider descriptions from modal: ${withDescCount}`);
}

main().finally(() => prisma.$disconnect());
