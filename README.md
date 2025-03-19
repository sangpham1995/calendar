# ICS Calendar Viewer & Editor

This is a web application for viewing and editing ICS (iCalendar) files. It allows you to:

- Upload and parse ICS files
- View calendar events in various formats (month, week, day, agenda)
- Edit existing events
- Create new events
- Delete events
- Save your calendar back to an ICS file

## Features

- **File Upload**: Import any standard ICS calendar file
- **Interactive Calendar**: View events in different calendar views
- **Event Management**: Create, edit, and delete calendar events
- **ICS Export**: Save your changes back to a standard ICS file

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone this repository
2. Install dependencies:

```
npm install
```

3. Start the development server:

```
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Upload an ICS File**: 
   - Click on the file input at the top of the page 
   - Select an ICS file from your computer
   - The calendar will load with the events from the file

2. **View Events**:
   - Use the calendar interface to navigate between dates
   - Switch between month, week, day, and agenda views
   - Click on an event to view its details

3. **Edit an Event**:
   - Click on an event in the calendar
   - Click the "Edit" button in the details panel
   - Update the event information
   - Click "Save" to apply your changes

4. **Create a New Event**:
   - Click the "Create New Event" button
   - Fill in the event details
   - Click "Save" to add the event to your calendar

5. **Delete an Event**:
   - Click on an event in the calendar
   - Click the "Delete" button in the details panel

6. **Save Your Calendar**:
   - After making changes, click the "Save ICS File" button
   - The modified calendar will be downloaded as an ICS file

## Sample Data

A sample calendar file is included in the `public` folder. You can load `sample-calendar.ics` to test the application.

## Technologies Used

- React
- ical.js (for parsing and manipulating ICS files)
- react-big-calendar (for the calendar interface)
- moment.js (for date handling)
- file-saver (for saving files)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- The [iCalendar specification](https://tools.ietf.org/html/rfc5545)
- All the open-source libraries that made this project possible
