'use client';

export default function CheckoutBar({ selectedPackage, onCheckout, loading }) {
  if (!selectedPackage) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800/50 py-5 z-50">
        <div className="max-w-[800px] mx-auto px-6 flex items-center justify-center">
          <p className="text-zinc-600 text-sm font-medium">Select a session to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800/50 py-4 z-50">
      <div className="max-w-[800px] mx-auto px-6 flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm text-white">{selectedPackage.name}</p>
          <p className="text-zinc-500 text-xs font-medium">${selectedPackage.price} USD</p>
        </div>
        <button
          onClick={onCheckout}
          disabled={loading}
          className="bg-dfv hover:bg-dfv-dark active:scale-[0.98] text-white text-sm font-semibold px-8 py-3 rounded-full transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.3)]"
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
            <>Pay ${selectedPackage.price} USD</>
          )}
        </button>
      </div>
    </div>
  );
}
