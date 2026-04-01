export default function PackageCard({ pkg, selected, onSelect }) {
  const isSelected = selected;
  const isFeatured = pkg.featured;

  let borderClass = 'border border-zinc-800';
  let bgClass = 'bg-zinc-900/60';
  let ringClass = '';

  if (isSelected) {
    borderClass = 'border-2 border-dfv';
    bgClass = 'bg-dfv/5';
    ringClass = 'shadow-[0_0_30px_rgba(124,58,237,0.12)]';
  } else if (isFeatured) {
    borderClass = 'border border-dfv/40';
    bgClass = 'bg-zinc-900/80';
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(pkg)}
      className={`${borderClass} ${bgClass} ${ringClass} rounded-2xl p-6 text-left cursor-pointer transition-all duration-300 hover:border-dfv/50 hover:shadow-[0_0_30px_rgba(124,58,237,0.08)] focus:outline-none w-full relative`}
    >
      {/* Badge */}
      <span
        className={`inline-block text-[11px] font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wider ${
          isFeatured
            ? 'bg-dfv text-white'
            : 'bg-zinc-800 text-zinc-400'
        }`}
      >
        {pkg.badge}
      </span>

      {/* Name */}
      <h3 className="text-white font-semibold text-xl mb-2 tracking-tight">{pkg.name}</h3>

      {/* Description */}
      <p className="text-sm text-zinc-400 leading-relaxed mb-6">
        {pkg.description}
      </p>

      {/* Price */}
      <p className="text-3xl font-bold text-white mb-4 tracking-tight">
        ${pkg.price} <span className="text-sm font-medium text-zinc-500">USD</span>
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {pkg.tags.map((tag) => (
          <span
            key={tag}
            className="text-[11px] px-2.5 py-1 rounded-full bg-zinc-800/80 text-zinc-500 font-medium"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4">
          <div className="w-6 h-6 rounded-full bg-dfv flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
      )}
    </button>
  );
}
