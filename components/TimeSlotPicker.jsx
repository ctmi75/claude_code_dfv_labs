'use client';

import { useState, useMemo } from 'react';

function formatDayHeading(dateStr) {
  const d = new Date(dateStr);
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  };
}

function formatTime(isoStr) {
  return new Date(isoStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function TimeSlotPicker({ slots, selectedSlot, onSelect }) {
  // Group slots by local calendar date
  const slotsByDate = useMemo(() => {
    const groups = {};
    slots.forEach((slot) => {
      const key = new Date(slot.start_time).toDateString();
      if (!groups[key]) groups[key] = [];
      groups[key].push(slot);
    });
    return groups;
  }, [slots]);

  const dates = Object.keys(slotsByDate);
  const [activeDate, setActiveDate] = useState(() => dates[0] ?? null);

  if (!slots.length) {
    return (
      <p className="text-zinc-500 text-sm text-center py-6">
        No availability in the next 2 weeks.
      </p>
    );
  }

  const timeSlotsForDay = slotsByDate[activeDate] ?? [];

  return (
    <div>
      {/* Day selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        {dates.map((dateStr) => {
          const { weekday, date } = formatDayHeading(dateStr);
          const isActive = dateStr === activeDate;
          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => {
                setActiveDate(dateStr);
                onSelect(null);
              }}
              className={`flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-xl border transition-all duration-200 min-w-[72px] ${
                isActive
                  ? 'bg-dfv/15 border-dfv text-white shadow-[0_0_16px_rgba(124,58,237,0.15)]'
                  : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span className="text-[11px] font-medium uppercase tracking-wide opacity-70">
                {weekday}
              </span>
              <span className="text-sm font-semibold mt-0.5">{date}</span>
            </button>
          );
        })}
      </div>

      {/* Time slots */}
      <div className="grid grid-cols-3 gap-2">
        {timeSlotsForDay.map((slot) => {
          const isSelected = selectedSlot?.start_time === slot.start_time;
          return (
            <button
              key={slot.start_time}
              type="button"
              onClick={() => onSelect(slot)}
              className={`py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isSelected
                  ? 'bg-dfv text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] border-2 border-dfv'
                  : 'bg-zinc-800/60 border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
              }`}
            >
              {formatTime(slot.start_time)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
