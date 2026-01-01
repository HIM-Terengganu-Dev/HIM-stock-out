'use client';

import { useState, useEffect } from 'react';

interface DateRangePickerProps {
  onDateRangeChange: (start: Date | null, end: Date | null) => void;
}

export default function DateRangePicker({ onDateRangeChange }: DateRangePickerProps) {
  const [startDate, setStartDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');

  // Helper to format date for datetime-local input
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to format time for datetime-local input
  const formatTimeForInput = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Combine date and time into a Date object
  const combineDateTime = (dateStr: string, timeStr: string): Date | null => {
    if (!dateStr) return null;
    const dateTimeStr = timeStr ? `${dateStr}T${timeStr}` : `${dateStr}T00:00`;
    const date = new Date(dateTimeStr);
    return isNaN(date.getTime()) ? null : date;
  };

  // Notify parent when date range changes
  useEffect(() => {
    const start = combineDateTime(startDate, startTime);
    const end = combineDateTime(endDate, endTime);
    onDateRangeChange(start, end);
  }, [startDate, startTime, endDate, endTime, onDateRangeChange]);

  const handleClear = () => {
    setStartDate('');
    setStartTime('');
    setEndDate('');
    setEndTime('');
  };

  const hasFilter = startDate || endDate;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filter by Date/Time Range</h3>
        {hasFilter && (
          <button
            onClick={handleClear}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Clear Filter
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date & Time
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date & Time
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
      
      {!hasFilter && (
        <p className="text-sm text-gray-500 mt-2">No filter applied - showing all data</p>
      )}
      {hasFilter && (
        <p className="text-sm text-gray-600 mt-2">
          {startDate && endDate 
            ? `Filtering from ${startDate} ${startTime || '00:00'} to ${endDate} ${endTime || '23:59'}`
            : startDate 
            ? `Filtering from ${startDate} ${startTime || '00:00'} onwards`
            : endDate
            ? `Filtering up to ${endDate} ${endTime || '23:59'}`
            : ''}
        </p>
      )}
    </div>
  );
}

