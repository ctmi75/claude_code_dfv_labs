'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, LayoutGrid, List, ChevronDown, X } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import StarRating from '@/components/ui/StarRating';
import { cn, formatCents } from '@/lib/utils';
import type { ExpertProfile } from '@/types';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price_asc', label: 'Price Low \u2192 High' },
  { value: 'price_desc', label: 'Price High \u2192 Low' },
] as const;

const COMMON_TAGS = [
  'Strategy',
  'Marketing',
  'Finance',
  'Technology',
  'Leadership',
  'Design',
  'Legal',
  'Sales',
  'Product',
  'Operations',
];

const PAGE_SIZE = 12;

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-28 rounded bg-gray-200" />
          <div className="h-3 w-full rounded bg-gray-200" />
        </div>
      </div>
      <div className="flex gap-1.5 mb-3">
        <div className="h-5 w-14 rounded-full bg-gray-200" />
        <div className="h-5 w-16 rounded-full bg-gray-200" />
        <div className="h-5 w-12 rounded-full bg-gray-200" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-4 w-16 rounded bg-gray-200" />
        <div className="h-4 w-20 rounded bg-gray-200" />
      </div>
    </div>
  );
}

export default function DirectoryPage() {
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [minRate, setMinRate] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [sort, setSort] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const buildParams = useCallback(
    (currentOffset: number) => {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
      if (minRate) params.set('minRate', String(Number(minRate) * 100));
      if (maxRate) params.set('maxRate', String(Number(maxRate) * 100));
      params.set('sort', sort);
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String(currentOffset));
      return params.toString();
    },
    [search, selectedTags, minRate, maxRate, sort],
  );

  const fetchExperts = useCallback(
    async (reset: boolean) => {
      const newOffset = reset ? 0 : offset;
      if (reset) setLoading(true);
      else setLoadingMore(true);

      try {
        const res = await fetch(`/api/experts?${buildParams(newOffset)}`);
        const data = await res.json();
        if (reset) {
          setExperts(data.experts ?? []);
          setOffset(PAGE_SIZE);
        } else {
          setExperts((prev) => [...prev, ...(data.experts ?? [])]);
          setOffset((prev) => prev + PAGE_SIZE);
        }
        setTotal(data.total ?? 0);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildParams, offset],
  );

  // Re-fetch when filters change
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchExperts(true);
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedTags, minRate, maxRate, sort]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const hasMore = experts.length < total;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Browse Experts</h1>

      {/* Filter Panel */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or expertise..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Tags */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Expertise</p>
          <div className="flex flex-wrap gap-2">
            {COMMON_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                  selectedTags.includes(tag)
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400',
                )}
              >
                {tag}
              </button>
            ))}
          </div>
          {selectedTags.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedTags([])}
              className="mt-2 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              <X className="h-3 w-3" /> Clear tags
            </button>
          )}
        </div>

        {/* Price + Sort Row */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">Price</label>
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={minRate}
              onChange={(e) => setMinRate(e.target.value)}
              className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={maxRate}
              onChange={(e) => setMaxRate(e.target.value)}
              className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <label className="text-xs font-medium text-gray-500">Sort</label>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none rounded-lg border border-gray-300 py-1.5 pl-3 pr-8 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>

            {/* Grid / List toggle */}
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-1.5',
                  viewMode === 'grid'
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50',
                )}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-1.5',
                  viewMode === 'list'
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50',
                )}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : experts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="h-12 w-12 text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-700">No experts found</h2>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {total} expert{total !== 1 ? 's' : ''} found
          </p>

          <div
            className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
                : 'flex flex-col gap-3',
            )}
          >
            {experts.map((expert) => (
              <Link
                key={expert.id}
                href={`/experts/${expert.id}`}
                className={cn(
                  'group rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md',
                  viewMode === 'list' && 'flex items-center gap-5',
                )}
              >
                <div
                  className={cn(
                    'flex items-center gap-3',
                    viewMode === 'list' ? 'min-w-0 flex-1' : 'mb-3',
                  )}
                >
                  <Avatar
                    src={expert.headshot_url}
                    name={expert.name}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-brand-700 transition-colors truncate">
                      {expert.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{expert.bio}</p>
                  </div>
                </div>

                <div
                  className={cn(
                    'flex flex-wrap gap-1.5',
                    viewMode === 'list' ? 'shrink-0' : 'mb-3',
                  )}
                >
                  {expert.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="blue" className="text-[10px] px-2 py-0.5">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div
                  className={cn(
                    'flex items-center justify-between',
                    viewMode === 'list' && 'shrink-0 gap-4',
                  )}
                >
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCents(expert.rate_per_hour)}/hr
                  </span>
                  <span className="flex items-center gap-1">
                    <StarRating
                      rating={expert.rating_avg ?? 0}
                      size="sm"
                    />
                    <span className="text-xs text-gray-500">
                      ({expert.review_count})
                    </span>
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => fetchExperts(false)}
                disabled={loadingMore}
                className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
