import React, { useState, useEffect } from 'react';
import './App.css';
import ICAL from 'ical.js';
import { saveAs } from 'file-saver';
import CalendarView from './components/CalendarView';
import EventForm from './components/EventForm';
import MiniCalendar from './components/MiniCalendar';
import moment from 'moment';

function App() {
  const [calendar, setCalendar] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  
  // Set up some sample calendar categories with Google-like colors
  const categories = [
    { id: 'blue', name: 'Blue', color: '#4285F4' },
    { id: 'red', name: 'Red', color: '#EA4335' },
    { id: 'yellow', name: 'Yellow', color: '#FBBC05' },
    { id: 'green', name: 'Green', color: '#34A853' },
    { id: 'purple', name: 'Purple', color: '#8E24AA' },
    { id: 'cyan', name: 'Cyan', color: '#24C1E0' },
    { id: 'orange', name: 'Orange', color: '#F4511E' }
  ];
  
  // Use the first category as default
  const [activeCategory, setActiveCategory] = useState(categories[0].id);

  // Filter events based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEvents(events);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = events.filter(event => 
        event.title.toLowerCase().includes(query) || 
        (event.description && event.description.toLowerCase().includes(query)) ||
        (event.location && event.location.toLowerCase().includes(query))
      );
      setFilteredEvents(filtered);
    }
  }, [searchQuery, events]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const icsData = e.target.result;
        console.log("ICS data loaded:", icsData.substring(0, 200) + "..."); // Log first part of ICS data
        
        // Try using ical.js parser first
        try {
          const jcalData = ICAL.parse(icsData);
          const comp = new ICAL.Component(jcalData);
          setCalendar(comp);
          
          const vevents = comp.getAllSubcomponents('vevent');
          console.log(`Found ${vevents.length} events using ical.js`);
          
          if (vevents.length > 0) {
            const parsedEvents = vevents.map((vevent) => {
              try {
                const event = new ICAL.Event(vevent);
                // Assign a random category to each imported event
                const randomCategory = categories[Math.floor(Math.random() * categories.length)].id;
                
                return {
                  id: event.uid || `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  title: event.summary || 'Untitled Event',
                  start: event.startDate.toJSDate(),
                  end: event.endDate.toJSDate(),
                  description: event.description || '',
                  location: event.location || '',
                  category: randomCategory,
                  allDay: false // Default to false
                };
              } catch (eventError) {
                console.error("Error processing an event:", eventError);
                return null;
              }
            }).filter(e => e !== null); // Remove any events that failed to parse
            
            if (parsedEvents.length > 0) {
              setEvents(prev => [...prev, ...parsedEvents]);
              setFilteredEvents(prev => [...prev, ...parsedEvents]);
              return; // Successfully parsed with ical.js
            }
          }
        } catch (icalError) {
          console.error("ical.js parsing failed, trying alternative parser:", icalError);
        }
        
        // If ical.js fails, try the simpler approach with a basic ICS parser
        // This is a very basic implementation to handle simple ICS files
        try {
          const lines = icsData.split('\n');
          let currentEvent = null;
          const manuallyParsedEvents = [];
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line === 'BEGIN:VEVENT') {
              currentEvent = {
                id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: 'Untitled Event',
                description: '',
                location: '',
                category: categories[Math.floor(Math.random() * categories.length)].id,
                allDay: false
              };
            } else if (line === 'END:VEVENT' && currentEvent) {
              if (currentEvent.start && currentEvent.end) {
                manuallyParsedEvents.push(currentEvent);
              }
              currentEvent = null;
            } else if (currentEvent) {
              const [key, value] = line.split(':');
              
              if (key === 'SUMMARY') {
                currentEvent.title = value;
              } else if (key === 'DESCRIPTION') {
                currentEvent.description = value;
              } else if (key === 'LOCATION') {
                currentEvent.location = value;
              } else if (key === 'UID') {
                currentEvent.id = value;
              } else if (key === 'DTSTART') {
                // Very basic date parsing
                try {
                  const year = value.substring(0, 4);
                  const month = value.substring(4, 6) - 1; // JS months are 0-based
                  const day = value.substring(6, 8);
                  const hour = value.substring(9, 11) || 0;
                  const minute = value.substring(11, 13) || 0;
                  currentEvent.start = new Date(year, month, day, hour, minute);
                } catch (dateError) {
                  console.error("Error parsing start date:", dateError);
                  currentEvent.start = new Date();
                }
              } else if (key === 'DTEND') {
                // Very basic date parsing
                try {
                  const year = value.substring(0, 4);
                  const month = value.substring(4, 6) - 1; // JS months are 0-based
                  const day = value.substring(6, 8);
                  const hour = value.substring(9, 11) || 0;
                  const minute = value.substring(11, 13) || 0;
                  currentEvent.end = new Date(year, month, day, hour, minute);
                } catch (dateError) {
                  console.error("Error parsing end date:", dateError);
                  // Set end date to 1 hour after start if we have a valid start date
                  if (currentEvent.start) {
                    currentEvent.end = new Date(currentEvent.start.getTime() + 60 * 60 * 1000);
                  } else {
                    currentEvent.end = new Date(new Date().getTime() + 60 * 60 * 1000);
                  }
                }
              }
            }
          }
          
          console.log(`Found ${manuallyParsedEvents.length} events using simple parser`);
          
          if (manuallyParsedEvents.length > 0) {
            setEvents(prev => [...prev, ...manuallyParsedEvents]);
            setFilteredEvents(prev => [...prev, ...manuallyParsedEvents]);
            
            // Since we don't have the full calendar component, create a simple one
            const cal = new ICAL.Component(['vcalendar', [], []]);
            cal.updatePropertyWithValue('prodid', '-//ICS Calendar Viewer & Editor//EN');
            cal.updatePropertyWithValue('version', '2.0');
            setCalendar(cal);
            
            return; // Successfully parsed with simple approach
          }
        } catch (simpleError) {
          console.error("Simple parsing failed:", simpleError);
        }
        
        // If we got here, both parsing methods failed
        throw new Error("Could not parse ICS file with any available method");
      } catch (error) {
        console.error('Error parsing ICS file:', error);
        alert('Error parsing ICS file: ' + (error.message || 'Unknown error. Please check the file format and try again.'));
      }
    };
    reader.readAsText(file);
  };

  const handleSaveICS = () => {
    if (!calendar) {
      // Create a new calendar if none exists
      const cal = new ICAL.Component(['vcalendar', [], []]);
      cal.updatePropertyWithValue('prodid', '-//ICS Calendar Viewer & Editor//EN');
      cal.updatePropertyWithValue('version', '2.0');
      setCalendar(cal);
      
      // Add all events to the calendar
      events.forEach(event => {
        const vevent = new ICAL.Component('vevent');
        const icalEvent = new ICAL.Event(vevent);
        
        icalEvent.uid = event.id;
        icalEvent.summary = event.title;
        icalEvent.description = event.description;
        icalEvent.location = event.location;
        
        const startDate = new ICAL.Time();
        startDate.fromJSDate(new Date(event.start));
        icalEvent.startDate = startDate;
        
        const endDate = new ICAL.Time();
        endDate.fromJSDate(new Date(event.end));
        icalEvent.endDate = endDate;
        
        cal.addSubcomponent(vevent);
      });
      
      const icsString = cal.toString();
      const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
      saveAs(blob, fileName || 'calendar.ics');
    } else {
      // Use existing calendar
      const icsString = calendar.toString();
      const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
      saveAs(blob, fileName || 'calendar.ics');
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  const handleEditEvent = () => {
    setIsEditing(true);
  };

  const handleUpdateEvent = (updatedEvent) => {
    // Find the event in the calendar component
    if (calendar) {
      const vevents = calendar.getAllSubcomponents('vevent');
      const eventToUpdate = vevents.find(vevent => {
        const event = new ICAL.Event(vevent);
        return event.uid === updatedEvent.id;
      });

      if (eventToUpdate) {
        // Update the event properties
        const icalEvent = new ICAL.Event(eventToUpdate);
        icalEvent.summary = updatedEvent.title;
        icalEvent.description = updatedEvent.description;
        icalEvent.location = updatedEvent.location;
        
        // Update start and end times
        const startDate = new ICAL.Time();
        startDate.fromJSDate(updatedEvent.start);
        icalEvent.startDate = startDate;
        
        const endDate = new ICAL.Time();
        endDate.fromJSDate(updatedEvent.end);
        icalEvent.endDate = endDate;
      }
    }
    
    // Update the events state
    setEvents(events.map(e => 
      e.id === updatedEvent.id ? updatedEvent : e
    ));

    // Also update filtered events if needed
    setFilteredEvents(filteredEvents.map(e => 
      e.id === updatedEvent.id ? updatedEvent : e
    ));
    
    setSelectedEvent(updatedEvent);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleDeleteEvent = (eventId) => {
    if (calendar) {
      // Remove the event from the calendar
      const vevents = calendar.getAllSubcomponents('vevent');
      const eventIndex = vevents.findIndex(vevent => {
        const event = new ICAL.Event(vevent);
        return event.uid === eventId;
      });
      
      if (eventIndex !== -1) {
        const eventComponent = vevents[eventIndex];
        calendar.removeSubcomponent(eventComponent);
      }
    }
    
    // Update the events state
    setEvents(events.filter(e => e.id !== eventId));
    setFilteredEvents(filteredEvents.filter(e => e.id !== eventId));
    setSelectedEvent(null);
  };

  const handleCreateEvent = () => {
    // Create a new event with default values
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    
    const newEvent = {
      id: `event-${Date.now()}`,
      title: 'New Event',
      start: now,
      end: oneHourLater,
      description: '',
      location: '',
      category: 'blue'
    };
    
    setSelectedEvent(newEvent);
    setIsEditing(true);
    setIsQuickAddOpen(false);
  };

  const handleQuickAdd = () => {
    setIsQuickAddOpen(true);
  };

  const handleCloseQuickAdd = () => {
    setIsQuickAddOpen(false);
  };

  const handleSaveNewEvent = (newEvent) => {
    if (!calendar) {
      // If no calendar exists, create a new one
      const cal = new ICAL.Component(['vcalendar', [], []]);
      cal.updatePropertyWithValue('prodid', '-//ICS Calendar Viewer & Editor//EN');
      cal.updatePropertyWithValue('version', '2.0');
      setCalendar(cal);
    }
    
    if (calendar) {
      // Create a new VEVENT component
      const vevent = new ICAL.Component('vevent');
      
      // Set event properties
      const event = new ICAL.Event(vevent);
      event.uid = newEvent.id;
      event.summary = newEvent.title;
      event.description = newEvent.description;
      event.location = newEvent.location;
      
      // Set start and end times
      const startDate = new ICAL.Time();
      startDate.fromJSDate(newEvent.start);
      event.startDate = startDate;
      
      const endDate = new ICAL.Time();
      endDate.fromJSDate(newEvent.end);
      event.endDate = endDate;
      
      // Add the event to the calendar
      calendar.addSubcomponent(vevent);
    }
    
    // Update the events state
    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    setFilteredEvents(updatedEvents);
    setSelectedEvent(newEvent);
    setIsEditing(false);
  };

  const handleDateChange = (date) => {
    setCurrentDate(date);
  };

  const handleViewChange = (newView) => {
    setView(newView);
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryToggle = (categoryId) => {
    if (activeCategory === categoryId) {
      // If clicking the already active category, don't deactivate it
      return;
    }
    setActiveCategory(categoryId);
  };

  // Get the current category color for new events
  const getCurrentCategoryColor = () => {
    const category = categories.find(cat => cat.id === activeCategory);
    return category ? category.color : categories[0].color;
  };

  // Render event details popup
  const renderEventDetails = () => {
    if (!selectedEvent) return null;
    
    const eventColor = categories.find(c => c.id === selectedEvent.category)?.color || '#4285F4';
    
    return (
      <div className="event-details-popup">
        <div className="popup-header" style={{ backgroundColor: eventColor }}>
          <h2>Event Details</h2>
          <button className="close-button" onClick={() => setSelectedEvent(null)}>×</button>
        </div>
        <div className="popup-content">
          <h3 className="event-title">{selectedEvent.title}</h3>
          
          <div className="event-detail-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.99 2C6.47 2 2 6.48 2 12C2 17.52 6.47 22 11.99 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 11.99 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20ZM12.5 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7Z" fill="currentColor"/>
            </svg>
            <div>
              {selectedEvent.allDay ? (
                <p>All day</p>
              ) : (
                <p>
                  {moment(selectedEvent.start).format('MMMM D, YYYY')} • {moment(selectedEvent.start).format('h:mm A')} - {moment(selectedEvent.end).format('h:mm A')}
                </p>
              )}
            </div>
          </div>
          
          {selectedEvent.location && (
            <div className="event-detail-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="currentColor"/>
              </svg>
              <div>
                <p>{selectedEvent.location}</p>
              </div>
            </div>
          )}
          
          {selectedEvent.description && (
            <div className="event-detail-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 3H4.99C3.89 3 3 3.9 3 5L3.01 19C3.01 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM17 12H7V10H17V12ZM17 16H7V14H17V16ZM7 8H17V6H7V8Z" fill="currentColor"/>
              </svg>
              <div>
                <div className="description-text">{selectedEvent.description}</div>
              </div>
            </div>
          )}
          
          <div className="event-actions">
            <button className="edit-button" onClick={handleEditEvent}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="currentColor"/>
              </svg>
              Edit
            </button>
            <button className="delete-button" onClick={() => handleDeleteEvent(selectedEvent.id)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor"/>
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Render event edit form popup
  const renderEventForm = () => {
    if (!isEditing || !selectedEvent) return null;
    
    const eventColor = categories.find(c => c.id === selectedEvent.category)?.color || '#4285F4';
    
    return (
      <div className="event-edit-popup">
        <div className="popup-header" style={{ backgroundColor: eventColor }}>
          <h2>{selectedEvent.id.startsWith('event-') && !events.find(e => e.id === selectedEvent.id) ? 'Add Event' : 'Edit Event'}</h2>
          <button className="close-button" onClick={() => setSelectedEvent(null)}>×</button>
        </div>
        <div className="popup-content">
          <EventForm 
            event={selectedEvent}
            onSave={selectedEvent.id && events.find(e => e.id === selectedEvent.id) ? handleUpdateEvent : handleSaveNewEvent}
            onCancel={handleCancelEdit}
            categories={categories}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="App google-calendar-theme">
      <header className="app-header">
        <div className="header-left">
          <button className="menu-button" onClick={toggleSidebar}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
          </button>
          <h1 className="app-title">
            <span className="calendar-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5v-5z"/>
              </svg>
            </span>
            Calendar
          </h1>
        </div>
        <div className="header-center">
          <div className="search-container">
            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search for events" 
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>
        <div className="header-right">
          <div className="file-actions">
            <button className="upload-button">
              <label className="file-input-label">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
                <span>Import</span>
                <input
                  type="file"
                  accept=".ics"
                  onChange={handleFileUpload}
                  className="hidden-input"
                />
              </label>
            </button>
            
            <button 
              className="download-button"
              onClick={handleSaveICS}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
              <span>Export</span>
            </button>
          </div>
        </div>
      </header>
      
      <div className="app-body">
        {/* Sidebar */}
        <aside className={`sidebar ${showSidebar ? 'shown' : 'hidden'}`}>
          <div className="create-event-container">
            <button className="create-event-button" onClick={handleQuickAdd}>
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
                <path fill="#5F6368" d="M16 16v14h4V20z"/>
                <path fill="#5F6368" d="M30 16H20v4h10z"/>
                <path fill="#5F6368" d="M6 16v4h10V16z"/>
                <path fill="#5F6368" d="M16 16h4v-4h-4z"/>
                <path fill="#5F6368" d="M16 6h4v6h-4z"/>
              </svg>
              <span>Create</span>
            </button>
          </div>
          
          <div className="mini-calendar-container">
            <MiniCalendar 
              date={currentDate} 
              onDateChange={handleDateChange}
              events={events}
            />
          </div>
          
          <div className="calendars-section">
            <h3 className="section-title">My calendars</h3>
            <ul className="calendar-list">
              {categories.map(category => (
                <li key={category.id} className="calendar-item">
                  <label className="calendar-checkbox">
                    <input 
                      type="checkbox" 
                      checked={activeCategory === category.id} 
                      onChange={() => handleCategoryToggle(category.id)} 
                    />
                    <span className="checkbox-color" style={{ backgroundColor: category.color }}></span>
                    <span className="checkbox-label">{category.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </aside>
        
        {/* Main Calendar Area */}
        <main className={`main-content ${!showSidebar ? 'full-width' : ''}`}>
          <div className="calendar-container">
            {events.length === 0 ? (
              <div className="no-events">
                <div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a1.99 1.99 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5v-5z"/>
                  </svg>
                  <p>Your calendar is empty. Import an ICS file or create a new event to get started.</p>
                </div>
              </div>
            ) : (
              <CalendarView 
                events={filteredEvents.map(event => ({
                  ...event,
                  color: categories.find(cat => cat.id === (event.category || 'blue'))?.color
                }))}
                onSelectEvent={handleSelectEvent}
                date={currentDate}
                view={view}
                onNavigate={handleDateChange}
                onView={handleViewChange}
              />
            )}
          </div>
          
          {/* Event Quick Add */}
          {isQuickAddOpen && (
            <div className="quick-add-container">
              <div className="quick-add-header">
                <h3>Quick Add Event</h3>
                <button className="close-button" onClick={handleCloseQuickAdd}>×</button>
              </div>
              <EventForm 
                event={{
                  id: `event-${Date.now()}`,
                  title: '',
                  start: new Date(),
                  end: new Date(new Date().getTime() + 60 * 60 * 1000),
                  description: '',
                  location: '',
                  category: 'blue'
                }}
                onSave={handleSaveNewEvent}
                onCancel={handleCloseQuickAdd}
                categories={categories}
              />
            </div>
          )}
        </main>
        
        {/* Event details panel */}
        {selectedEvent && !isEditing && renderEventDetails()}
        
        {/* Event edit form */}
        {isEditing && renderEventForm()}
      </div>
    </div>
  );
}

export default App;
