import { notFound } from 'next/navigation';
import { advisors, getAdvisor } from '../../lib/advisors';
import AdvisorBooking from './AdvisorBooking';

export function generateStaticParams() {
  return advisors.map((a) => ({ advisor: a.id }));
}

export default function AdvisorPage({ params }) {
  const advisor = getAdvisor(params.advisor);

  if (!advisor) {
    notFound();
  }

  return <AdvisorBooking advisor={advisor} />;
}
