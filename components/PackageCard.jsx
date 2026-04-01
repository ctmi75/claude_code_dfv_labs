export default function PackageCard({ pkg, selected, onSelect }) {
  const isSelected = selected;
  const isFeatured = pkg.featured;

  let borderClass = 'border border-gray-200';
  let bgClass = 'bg-white';

  if (isSelected) {
    borderClass = 'border-2 border-dfv';
    bgClass = 'bg-dfv-light';
  } else if (isFeatured) {
    borderClass = 'border-2 border-dfv';
    bgClass = 'bg-white';
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(pkg)}
      className={`${borderClass} ${bgClass} rounded-2xl p-6 text-left cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-dfv focus:ring-offset-2 w-full`}
    >
      {/* Badge */}
      <span
        className={`inline-block text-xs font-medium px-3 py-1 rounded-full mb-4 ${
          isFeatured
            ? 'bg-dfv text-white'
            : 'bg-gray-100 text-gray-600'
        }`}
      >
        {pkg.badge}
      </span>

      {/* Name */}
      <h3 className="font-serif text-xl mb-2">{pkg.name}</h3>

      {/* Description */}
      <p className="text-sm font-light text-gray-500 leading-relaxed mb-5">
        {pkg.description}
      </p>

      {/* Price */}
      <p className="text-2xl font-semibold mb-4">
        ${pkg.price} <span className="text-sm font-normal text-gray-400">CAD</span>
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {pkg.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500"
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
}
