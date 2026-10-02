'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

export default function FaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      {faqs.map((faq, idx) => {
        const isOpen = openFaq === idx;
        return (
          <div
            key={idx}
            className="rounded-2xl bg-white border border-sky-100 shadow-sm overflow-hidden transition duration-200 hover:border-sky-200"
          >
            <button
              type="button"
              onClick={() => setOpenFaq(isOpen ? null : idx)}
              className="w-full p-5 text-right flex items-center justify-between gap-4 hover:bg-sky-50/50 transition cursor-pointer"
              aria-expanded={isOpen}
            >
              <span className="font-bold text-base text-slate-900">{faq.q}</span>
              <ChevronDown
                className={`w-5 h-5 text-blue-600 shrink-0 transition-transform duration-300 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-sky-100 pt-4 bg-sky-50/30">
                {faq.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
