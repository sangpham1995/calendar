import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Set up the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

// Component for rendering custom event in the calendar
const EventComponent = ({ event }) => {
  const categoryColors = {
    blue: '#4285F4',
    red: '#EA4335',
    yellow: '#FBBC05',
    green: '#34A853',
    purple: '#8E24AA',
    cyan: '#24C1E0',
    orange: '#F4511E'
  };

  // Use the category color or default to blue
  const eventColor = event.color || categoryColors[event.category] || categoryColors.blue;

  return (
    <div className="google-calendar-event-wrapper">
      <div 
        className="google-calendar-event" 
        style={{ backgroundColor: eventColor }}
      >
        <div className="event-content">
          <div className="event-title">{event.title}</div>
          {event.location && (
            <div className="event-location">{event.location}</div>
          )}
          {!event.allDay && (
            <div className="event-time">
              {moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Component for rendering custom event tooltip
const EventTooltip = ({ event, tooltipPosition }) => {
  const { left, top } = tooltipPosition;

  return (
    <div 
      className="google-calendar-tooltip-container" 
      style={{ left, top }}
    >
      <div className="google-calendar-tooltip">
        <div className="tooltip-title">{event.title}</div>
        <div className="tooltip-time">
          {event.allDay 
            ? 'All day'
            : `${moment(event.start).format('h:mm A')} - ${moment(event.end).format('h:mm A')}`
          }
        </div>
        {event.location && (
          <div className="tooltip-location">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="currentColor"/>
            </svg>
            <span>{event.location}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Custom toolbar component
const CustomToolbar = ({ date, onNavigate, onView, view }) => {
  return (
    <div className="google-calendar-toolbar">
      <div className="toolbar-buttons">
        <button 
          className="toolbar-button today"
          onClick={() => onNavigate('TODAY')}
        >
          Today
        </button>
        <div className="nav-buttons">
          <button 
            className="toolbar-button nav"
            onClick={() => onNavigate('PREV')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z" fill="currentColor"/>
            </svg>
          </button>
          <button 
            className="toolbar-button nav"
            onClick={() => onNavigate('NEXT')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 6L8.59 7.41L13.17 12L8.59 16.59L10 18L16 12L10 6Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
        <span className="toolbar-label">
          {view === 'month' && moment(date).format('MMMM YYYY')}
          {view === 'week' && `Week of ${moment(date).startOf('week').format('MMM D, YYYY')}`}
          {view === 'day' && moment(date).format('MMMM D, YYYY')}
          {view === 'agenda' && `${moment(date).format('MMMM D')} - ${moment(date).add(30, 'days').format('MMMM D, YYYY')}`}
        </span>
      </div>
      <div className="view-buttons">
        <button 
          className={`toolbar-button view ${view === 'month' ? 'active' : ''}`}
          onClick={() => onView('month')}
        >
          Month
        </button>
        <button 
          className={`toolbar-button view ${view === 'week' ? 'active' : ''}`}
          onClick={() => onView('week')}
        >
          Week
        </button>
        <button 
          className={`toolbar-button view ${view === 'day' ? 'active' : ''}`}
          onClick={() => onView('day')}
        >
          Day
        </button>
        <button 
          className={`toolbar-button view ${view === 'agenda' ? 'active' : ''}`}
          onClick={() => onView('agenda')}
        >
          Agenda
        </button>
      </div>
    </div>
  );
};

const CalendarView = ({ 
  events = [], 
  onSelectEvent,
  date,
  view = 'month',
  onNavigate,
  onView
}) => {
  // Use local state for date and view if props are not provided
  const [localDate, setLocalDate] = useState(new Date());
  const [localView, setLocalView] = useState('month');
  
  // Sync local state with props
  useEffect(() => {
    if (date) {
      setLocalDate(date);
    }
  }, [date]);

  useEffect(() => {
    if (view) {
      setLocalView(view);
    }
  }, [view]);
  
  const [tooltipEvent, setTooltipEvent] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ left: 0, top: 0 });
  const tooltipTimeout = useRef(null);
  
  // Process events to ensure they have start and end as Date objects
  const calendarEvents = events.map(event => ({
    ...event,
    start: new Date(event.start),
    end: new Date(event.end)
  }));

  // Handle mouse enter on an event
  const handleEventMouseEnter = useCallback((event, e) => {
    if (tooltipTimeout.current) {
      clearTimeout(tooltipTimeout.current);
    }
    
    // Calculate tooltip position
    const rect = e.currentTarget.getBoundingClientRect();
    const left = rect.left + window.scrollX;
    const top = rect.bottom + window.scrollY + 5; // 5px below the event
    
    setTooltipEvent(event);
    setTooltipPosition({ left, top });
  }, []);

  // Handle mouse leave on an event
  const handleEventMouseLeave = useCallback(() => {
    tooltipTimeout.current = setTimeout(() => {
      setTooltipEvent(null);
    }, 200); // Small delay before hiding to allow mouse movement to tooltip
  }, []);

  // Custom event wrapper to add mouse events
  const eventPropGetter = useCallback((event) => {
    return {
      className: 'google-calendar-event-container',
      // You can add more styles or classes based on event properties
      style: {
        backgroundColor: 'transparent'
      }
    };
  }, []);

  // Add today class to current day
  const dayPropGetter = useCallback(date => {
    const today = new Date();
    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return {
        className: 'google-today'
      };
    }
    return {};
  }, []);

  // Handle calendar navigation
  const handleNavigate = useCallback((newDate) => {
    setLocalDate(newDate);
    if (onNavigate) {
      onNavigate(newDate);
    }
  }, [onNavigate]);

  // Handle view change
  const handleView = useCallback((newView) => {
    setLocalView(newView);
    if (onView) {
      onView(newView);
    }
  }, [onView]);

  // Components object for custom rendering
  const components = {
    event: EventComponent,
    toolbar: props => <CustomToolbar 
      {...props} 
      view={view || localView} 
      date={date || localDate}
    />,
    eventWrapper: ({ event, children }) => (
      <div 
        onMouseEnter={e => handleEventMouseEnter(event, e)}
        onMouseLeave={handleEventMouseLeave}
      >
        {children}
      </div>
    )
  };

  return (
    <div className="google-calendar-wrapper">
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        onSelectEvent={onSelectEvent}
        views={['month', 'week', 'day', 'agenda']}
        view={view || localView}
        date={date || localDate}
        onView={handleView}
        onNavigate={handleNavigate}
        eventPropGetter={eventPropGetter}
        dayPropGetter={dayPropGetter}
        components={components}
        popup
        selectable
        onSelectSlot={(slotInfo) => {
          if (onSelectEvent) {
            // Create a temporary event for the selected slot
            const newEvent = {
              id: `temp-event-${Date.now()}`,
              title: 'New Event',
              start: slotInfo.start,
              end: slotInfo.end,
              description: '',
              location: '',
              category: 'blue',
              isNew: true // Flag to indicate this is a new event
            };
            onSelectEvent(newEvent);
          }
        }}
      />
      {tooltipEvent && <EventTooltip event={tooltipEvent} tooltipPosition={tooltipPosition} />}
    </div>
  );
};

export default CalendarView; 