'use client';

import { useEffect } from 'react';

export default function CalendlyEmbed({ url, onEventScheduled }) {
  useEffect(() => {
    function handleMessage(e) {
      if (e.data?.event === 'calendly.event_scheduled') {
        onEventScheduled?.();
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onEventScheduled]);

  if (!url || url === '#') return null;

  return (
    <iframe
      src={url}
      width="100%"
      height="700"
      frameBorder="0"
      title="Pick a time"
      className="bg-white"
    />
  );
}
