'use client';

interface PaywallProps {
  isOpen: boolean;
  onClose: () => void;
  featureTitle: string;
  featureDescription: string;
  priceLabel?: string;
  onUpgrade: () => void;
}

export function Paywall({ isOpen, onClose, featureTitle, featureDescription, priceLabel, onUpgrade }: PaywallProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl mx-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">{featureTitle}</h2>
        <p className="mb-6 text-sm leading-relaxed text-gray-600">{featureDescription}</p>
        {priceLabel && (
          <div className="mb-6 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-4 text-center border border-amber-200">
            <span className="text-2xl font-bold text-gray-900">{priceLabel}</span>
          </div>
        )}
        <div className="flex flex-col gap-3">
          <button onClick={onUpgrade} className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:from-amber-600 hover:to-orange-600 hover:shadow-xl transition-all">
            プレミアムにアップグレード
          </button>
          <button onClick={onClose} className="w-full rounded-xl px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors">
            あとで
          </button>
        </div>
      </div>
    </div>
  );
}
