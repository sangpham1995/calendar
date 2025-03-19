import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const EventForm = ({ event, onSave, onCancel, categories }) => {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [categoryId, setCategoryId] = useState('blue');
  const [isAllDay, setIsAllDay] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [formError, setFormError] = useState('');

  // Initialize form with event data if provided
  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setStartDate(new Date(event.start));
      setEndDate(new Date(event.end));
      setDescription(event.description || '');
      setLocation(event.location || '');
      setCategoryId(event.category || 'blue');
      setIsAllDay(event.allDay || false);
    }
  }, [event]);

  // Validate form before submission
  const validateForm = () => {
    if (!title.trim()) {
      setFormError('Please enter an event title');
      return false;
    }
    
    if (endDate < startDate) {
      setFormError('End date cannot be before start date');
      return false;
    }
    
    setFormError('');
    return true;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const updatedEvent = {
      ...event,
      title,
      start: startDate,
      end: endDate,
      description,
      location,
      category: categoryId,
      allDay: isAllDay
    };
    
    onSave(updatedEvent);
  };

  // Toggle color picker visibility
  const toggleColorPicker = () => {
    setShowColorPicker(!showColorPicker);
  };

  // Get color from category
  const getColorForCategory = (categoryId) => {
    const colorMap = {
      blue: '#4285F4',
      red: '#EA4335',
      yellow: '#FBBC05',
      green: '#34A853',
      purple: '#8E24AA',
      cyan: '#24C1E0',
      orange: '#F4511E'
    };
    
    return colorMap[categoryId] || colorMap.blue;
  };

  // Render color options
  const renderColorOptions = () => {
    const defaultCategories = [
      { id: 'blue', name: 'Blue', color: '#4285F4' },
      { id: 'red', name: 'Red', color: '#EA4335' },
      { id: 'yellow', name: 'Yellow', color: '#FBBC05' },
      { id: 'green', name: 'Green', color: '#34A853' },
      { id: 'purple', name: 'Purple', color: '#8E24AA' },
      { id: 'cyan', name: 'Cyan', color: '#24C1E0' },
      { id: 'orange', name: 'Orange', color: '#F4511E' }
    ];
    
    const categoryOptions = categories || defaultCategories;
    
    return (
      <div className="color-picker-dropdown">
        {categoryOptions.map(category => (
          <div 
            key={category.id}
            className="color-option"
            onClick={() => {
              setCategoryId(category.id);
              setShowColorPicker(false);
            }}
          >
            <div 
              className="color-chip" 
              style={{ backgroundColor: category.color }}
            />
            <span className="color-name">{category.name}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <form className="google-event-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <div className="color-picker-container">
          <button 
            type="button"
            className="color-chip"
            style={{ backgroundColor: getColorForCategory(categoryId) }}
            onClick={toggleColorPicker}
          />
          {showColorPicker && renderColorOptions()}
        </div>
      </div>
      
      {formError && (
        <div className="form-error" style={{ color: 'red', marginBottom: '10px' }}>
          {formError}
        </div>
      )}
      
      <div className="form-group">
        <input
          type="text"
          className="title-input"
          placeholder="Add title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />
      </div>
      
      <div className="form-group time-group">
        <div className="time-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.99 2C6.47 2 2 6.48 2 12C2 17.52 6.47 22 11.99 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 11.99 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20ZM12.5 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7Z" fill="currentColor"/>
          </svg>
        </div>
        <div className="time-inputs">
          <div className="all-day-toggle">
            <label>
              <input
                type="checkbox"
                checked={isAllDay}
                onChange={() => setIsAllDay(!isAllDay)}
              />
              All day
            </label>
          </div>
          
          <div className="date-time-pickers">
            <div className="date-time-row">
              <DatePicker
                selected={startDate}
                onChange={date => setStartDate(date)}
                className="date-picker"
                dateFormat="MMMM d, yyyy"
              />
              
              {!isAllDay && (
                <DatePicker
                  selected={startDate}
                  onChange={date => setStartDate(date)}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
                  timeCaption="Start Time"
                  dateFormat="h:mm aa"
                  className="time-picker"
                />
              )}
            </div>
            
            <div className="date-time-row">
              <DatePicker
                selected={endDate}
                onChange={date => setEndDate(date)}
                className="date-picker"
                dateFormat="MMMM d, yyyy"
                minDate={startDate}
              />
              
              {!isAllDay && (
                <DatePicker
                  selected={endDate}
                  onChange={date => setEndDate(date)}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
                  timeCaption="End Time"
                  dateFormat="h:mm aa"
                  className="time-picker"
                />
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="form-group">
        <div className="input-with-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="currentColor"/>
          </svg>
          <input
            type="text"
            className="form-control"
            placeholder="Add location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
      </div>
      
      <div className="form-group">
        <div className="input-with-icon textarea-container">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 3H4.99C3.89 3 3 3.9 3 5L3.01 19C3.01 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM17 12H7V10H17V12ZM17 16H7V14H17V16ZM7 8H17V6H7V8Z" fill="currentColor"/>
          </svg>
          <textarea
            className="form-control"
            placeholder="Add description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>
      </div>
      
      <div className="form-actions">
        <button 
          type="button" 
          className="cancel-button"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="save-button"
        >
          Save
        </button>
      </div>
    </form>
  );
};

export default EventForm; 