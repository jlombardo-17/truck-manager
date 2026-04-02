import React from 'react';
import '../styles/DateRangeSelector.css';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface DateRangeSelectorProps {
  selectedRange: DateRange;
  onRangeChange: (range: DateRange) => void;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ selectedRange, onRangeChange }) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const getDateRange = (days: number): DateRange => {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    return { startDate, endDate };
  };

  const handleQuickSelect = (days: number) => {
    onRangeChange(getDateRange(days));
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    newDate.setHours(0, 0, 0, 0);
    onRangeChange({
      startDate: newDate,
      endDate: selectedRange.endDate,
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    newDate.setHours(23, 59, 59, 999);
    onRangeChange({
      startDate: selectedRange.startDate,
      endDate: newDate,
    });
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDaysInRange = (): number => {
    const diff = selectedRange.endDate.getTime() - selectedRange.startDate.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const formattedStart = formatDate(selectedRange.startDate);
  const formattedEnd = formatDate(selectedRange.endDate);
  const daysCount = getDaysInRange();

  return (
    <div className="date-range-selector">
      <div className="date-selector-content">
        <div className="quick-options">
          <button
            className="quick-btn"
            onClick={() => handleQuickSelect(7)}
            title="Últimos 7 días"
          >
            Últimos 7 días
          </button>
          <button
            className="quick-btn"
            onClick={() => handleQuickSelect(30)}
            title="Últimos 30 días"
          >
            Últimos 30 días
          </button>
          <button
            className="quick-btn"
            onClick={() => handleQuickSelect(90)}
            title="Últimos 90 días"
          >
            Últimos 90 días
          </button>
        </div>

        <div className="custom-range">
          <div className="date-input-group">
            <label htmlFor="start-date">Desde:</label>
            <input
              id="start-date"
              type="date"
              value={formattedStart}
              onChange={handleStartDateChange}
              max={formattedEnd}
            />
          </div>

          <div className="date-input-group">
            <label htmlFor="end-date">Hasta:</label>
            <input
              id="end-date"
              type="date"
              value={formattedEnd}
              onChange={handleEndDateChange}
              min={formattedStart}
            />
          </div>

          <div className="range-info">
            <span className="days-badge">{daysCount} días</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateRangeSelector;
