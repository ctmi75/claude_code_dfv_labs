'use client';

export default function CalendlyEmbed({ url }) {
  if (!url || url === '#') return null;

  return (
    <iframe
      src={url}
      width="100%"
      height="950"
      frameBorder="0"
      title="Book a time"
      className="bg-white"
    />
  );
}
