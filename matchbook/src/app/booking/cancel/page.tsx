import Link from 'next/link';
import { XCircle } from 'lucide-react';

export default function BookingCancelPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-10 w-10 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900">Booking Cancelled</h1>
        <p className="mt-2 text-sm text-gray-500">
          Your booking was not completed. No charges were made.
        </p>

        <Link
          href="/directory"
          className="mt-8 inline-block rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          Browse Experts
        </Link>
      </div>
    </div>
  );
}
