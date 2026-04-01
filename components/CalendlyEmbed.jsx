'use client';

import { useEffect, useRef } from 'react';

export default function CalendlyEmbed({ url }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!url || url === '#') return;

    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    script.onload = () => {
      if (window.Calendly && containerRef.current) {
        window.Calendly.initInlineWidget({
          url: url,
          parentElement: containerRef.current,
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [url]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl border border-gray-200"
      style={{ minHeight: '900px' }}
    />
  );
}
