'use client';

import PackageCard from './PackageCard';

export default function PackageGrid({ packages, selectedPackage, onSelect }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {packages.map((pkg) => (
        <PackageCard
          key={pkg.id}
          pkg={pkg}
          selected={selectedPackage?.id === pkg.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
