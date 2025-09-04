# School Window Implementation

This document details the implementation of the School Window feature for the TUI Homepage, including the schedule-aware class selection and schedule sidebar integration.

## Features

1. Schedule-aware class menu with automatic highlighting of current class
2. Dynamic loading of class links from configuration
3. Integration with schedule data to show current/next classes
4. Schedule sidebar showing today's full timetable
5. Coursework display that shows assignments for the selected class
6. Complete keyboard navigation (arrow keys, enter, escape)
7. To-Do List integration for managing assignments
8. Status bar with URL previews for class links

## Core Components

### 1. HTML Structure

The School Window generates this HTML structure when opened:

```html
<div class="tui-box school-window" tabindex="0">
  <div class="tui-window" style="width: 100%; height: 100%; border: 2px solid #fff; box-sizing: border-box;">
    <div class="tui-title" style="padding: 8px; border-bottom: 2px solid #fff;">School Menu</div>
    <div class="tui-content" style="padding: 8px;">
      <!-- Dynamic class list items -->
      <div class="tui-item" data-url="https://example.com/class-url">
        <div class="icon-bracket"><img src="/icons/class-icon.svg" alt=""></div>
        <span class="menu-label"><span class="school-label">Class Name</span></span>
      </div>
      <!-- Additional class items -->
    </div>
  </div>
</div>

<!-- Schedule sidebar (appears to the right of the main menu) -->
<div id="schedule-box" class="schedule-tui-box">
  <!-- Schedule content with today's classes -->
  <!-- Coursework section showing assignments -->
</div>
```

### 2. JavaScript Implementation

The school window is implemented across two main files:

#### school-window.js

This script handles the main school menu interface:

- Creates the menu with subject links
- Loads schedule data to determine current class
- Handles keyboard navigation and selection
- Manages focus and styling
- Opens the schedule sidebar
- Communicates with the To-Do List feature

#### schedule-window.js

This script handles the schedule sidebar:

- Shows today's full timetable with times
- Highlights the current period
- Shows coursework/assignments for selected class
- Updates dynamically when selections change in the main menu

### 3. Schedule Data Structure

The schedule is stored in `public/config/schedule-config.json` with this structure:

```json
{
  "Monday": [
    { "time": "9:00-10:30am", "subject": "Mathematics" },
    { "time": "10:45-12:15pm", "subject": "History" }
  ],
  "Tuesday": [
    { "time": "9:00-10:30am", "subject": "Biology" },
    { "time": "10:45-12:15pm", "subject": "French" }
  ]
}
```

## Key Functionality Explained

### 1. Schedule-Aware Class Selection

```javascript
function getCurrentClassIdx(schedule) {
  if (!schedule) return -1;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let lastIdx = -1;
  
  for (let i = 0; i < schedule.length; i++) {
    const [start, end] = schedule[i].time.split('-');
    function parseTime(t) {
      let [h, m] = t.match(/\d+/g).map(Number);
      let pm = t.toLowerCase().includes('pm');
      if (h === 12) pm = false;
      if (!pm && t.toLowerCase().includes('am')) pm = false;
      if (pm && h < 12) h += 12;
      return h * 60 + m;
    }
    const startM = parseTime(start);
    const endM = parseTime(end);
    if (nowMinutes >= startM && nowMinutes < endM) return i;
    if (nowMinutes >= startM) lastIdx = i;
  }
  // If classes are over, select last period
  return lastIdx;
}
```

This function:
- Converts the current time to minutes since midnight
- Iterates through today's schedule
- Converts class start/end times to minutes format
- Returns the index of the current class
- If no current class is active, returns the last completed class

### 2. Class Name Mapping

The system maps schedule subjects to menu items using aliases:

```javascript
const subjectAliases = {
  'hc': 'math',
  'life skills': 'history',
  'business math': 'math',
  'us history': 'history',
  // Additional mappings
};
```

This allows flexibility in how classes are named in the schedule vs. the menu.

### 3. Schedule Sidebar Integration

```javascript
// Create schedule box and attach to DOM
function showScheduleBox() {
  // Get today's schedule data
  // Parse times to determine current period
  // Generate HTML for schedule display
  // Add coursework section below schedule
  // Apply styling and positioning
  // Attach event listeners for selection changes
}
```

The schedule sidebar:
- Appears to the right of the school menu
- Shows all periods for today with times
- Highlights the current period
- Updates to show assignments for the selected class
- Avoids stealing focus from the main menu

### 4. Coursework Display

```javascript
// Update coursework based on selected class
function updateCourseworkFromTuiSelection() {
  const courseworkListContainer = document.getElementById('coursework-list-container');
  // Get selected class name
  // Find matching assignments in upcomingAssignmentsByContext
  // Render assignment list
  // Handle case where no assignments exist
}
```

## Integration Points

### 1. To-Do List Integration

The School Window can open the To-Do List feature directly:

```javascript
// Handle To-Do List selection
if (label === 'To-Do List') {
  // Clean up schedule box
  // Reset main window
  // Load and open to-do window
}
```

### 2. Event Communication

The School Window emits events when selections change:

```javascript
// Emit event for selection change
const label = item.querySelector('.school-label')?.textContent?.trim();
window.selectedClassName = label;
window.dispatchEvent(new CustomEvent('tuiSelectedClassChanged', { 
  detail: { className: label } 
}));
```

Other components can listen for these events to update their own state.

## Styling

The School Window uses consistent TUI styling:
- Black background with white text
- White borders with precise pixel alignment
- Inverted colors for selected items
- Icon integration with proper spacing

## Usage

### Opening the School Window

```javascript
// Call this function to open the School Window
window.openSchoolWindow();
```

### Navigation

- Up/Down arrows navigate through class list
- Enter selects a class (either opening the URL or To-Do List)
- Escape returns to main menu
- Schedule automatically highlights the correct class for current time

### Configuration

To customize the School Window:

1. Edit the `subjects` array in `school-window.js` to change class links
2. Update `schedule-config.json` to match your personal schedule
3. Modify the `subjectAliases` object to handle different naming conventions

## Future Enhancements

Potential improvements for the School Window:

1. Multiple schedule support (different schedules for different weeks)
2. Drag-and-drop interface for schedule customization
3. Integration with school LMS APIs beyond Canvas
4. Assignment completion tracking
5. Class reminders and notifications
