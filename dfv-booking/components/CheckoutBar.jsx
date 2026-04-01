'use client';

export default function CheckoutBar({ selectedPackage, onCheckout, loading }) {
  if (!selectedPackage) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-4 z-50">
        <div className="max-w-[720px] mx-auto px-6 flex items-center justify-center">
          <p className="text-gray-300 text-sm">Select a session to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="max-w-[720px] mx-auto px-6 flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">{selectedPackage.name}</p>
          <p className="text-gray-400 text-xs">${selectedPackage.price} CAD</p>
        </div>
        <button
          onClick={onCheckout}
          disabled={loading}
          className="bg-dfv hover:bg-dfv-dark text-white text-sm font-medium px-6 py-2.5 rounded-full transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Processing...
            </>
          ) : (
            <>Pay ${selectedPackage.price} CAD &rarr;</>
          )}
        </button>
      </div>
    </div>
  );
}
