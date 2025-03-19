import React, { useState, useEffect } from 'react';
import moment from 'moment';

const MiniCalendar = ({ date, onDateChange, events }) => {
  const [currentMonth, setCurrentMonth] = useState(moment(date));
  const [selectedDate, setSelectedDate] = useState(moment(date));

  // Update selected date when parent date changes
  useEffect(() => {
    setSelectedDate(moment(date));
  }, [date]);

  // Go to next month
  const nextMonth = () => {
    setCurrentMonth(currentMonth.clone().add(1, 'month'));
  };

  // Go to previous month
  const prevMonth = () => {
    setCurrentMonth(currentMonth.clone().subtract(1, 'month'));
  };

  // Handle date click
  const handleDateClick = (day) => {
    setSelectedDate(day);
    onDateChange(day.toDate());
  };

  // Check if a day has events
  const hasEvents = (day) => {
    if (!events || !Array.isArray(events)) return false;
    
    return events.some(event => {
      const eventStart = moment(event.start).startOf('day');
      const eventEnd = moment(event.end).startOf('day');
      return day.isSameOrAfter(eventStart) && day.isSameOrBefore(eventEnd);
    });
  };

  // Render the calendar
  const renderCalendar = () => {
    const monthStart = currentMonth.clone().startOf('month');
    const monthEnd = currentMonth.clone().endOf('month');
    const startDate = monthStart.clone().startOf('week');
    const endDate = monthEnd.clone().endOf('week');

    const rows = [];
    let days = [];
    let day = startDate.clone();

    // Create header with day names
    const header = [
      <div key="header" className="mini-calendar-row">
        {Array(7).fill(0).map((_, i) => (
          <div key={i} className="mini-calendar-cell header">
            {moment().day(i).format('dd').charAt(0)}
          </div>
        ))}
      </div>
    ];

    // Create calendar grid
    while (day.isSameOrBefore(endDate)) {
      for (let i = 0; i < 7; i++) {
        const clonedDay = day.clone();
        const isCurrentMonth = day.month() === currentMonth.month();
        const isToday = day.isSame(moment(), 'day');
        const isSelected = day.isSame(selectedDate, 'day');
        const hasEventsOnDay = hasEvents(day);

        days.push(
          <div
            key={day.format('YYYY-MM-DD')}
            className={`mini-calendar-cell 
              ${!isCurrentMonth ? 'inactive' : ''} 
              ${isToday ? 'today' : ''} 
              ${isSelected ? 'selected' : ''}`
            }
            onClick={() => isCurrentMonth && handleDateClick(clonedDay)}
          >
            {day.format('D')}
            {hasEventsOnDay && <div className="event-dot" />}
          </div>
        );
        day.add(1, 'day');
      }
      
      rows.push(
        <div key={day.format('YYYY-MM-DD')} className="mini-calendar-row">
          {days}
        </div>
      );
      days = [];
    }

    return [...header, ...rows];
  };

  return (
    <div className="mini-calendar">
      <div className="mini-calendar-header">
        <button
          className="mini-calendar-nav"
          onClick={prevMonth}
          aria-label="Previous month"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z" fill="currentColor" />
          </svg>
        </button>
        <div className="mini-calendar-title">
          {currentMonth.format('MMMM YYYY')}
        </div>
        <button
          className="mini-calendar-nav"
          onClick={nextMonth}
          aria-label="Next month"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 6L8.59 7.41L13.17 12L8.59 16.59L10 18L16 12L10 6Z" fill="currentColor" />
          </svg>
        </button>
      </div>
      <div className="mini-calendar-grid">
        {renderCalendar()}
      </div>
    </div>
  );
};

export default MiniCalendar; 