'use client';

import { useEffect } from 'react';

export default function CalendlyEmbed({ url, onDateTimeSelected, onEventScheduled }) {
  useEffect(() => {
    function handleMessage(e) {
      if (e.data?.event === 'calendly.date_and_time_selected') {
        onDateTimeSelected?.();
      }
      if (e.data?.event === 'calendly.event_scheduled') {
        onEventScheduled?.();
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onDateTimeSelected, onEventScheduled]);

  if (!url || url === '#') return null;

  return (
    <iframe
      src={url}
      width="100%"
      height="650"
      frameBorder="0"
      title="Pick a time"
      className="bg-white block"
    />
  );
}
