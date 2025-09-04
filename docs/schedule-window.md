# Schedule Window Implementation

This document details the implementation of the Schedule Window feature for the TUI Homepage, providing a visual representation of your daily class schedule in a terminal-style interface.

## Features

1. Daily class schedule visualization
2. Current class highlighting
3. Time tracking and period transitions
4. Integration with School Window
5. Configurable schedule via JSON
6. Complete keyboard navigation
7. Focus on upcoming/current class periods

## Core Components

### 1. HTML Structure

The Schedule Window generates this HTML structure when displayed:

```html
<div class="tui-box schedule-window" tabindex="0">
  <div class="tui-window" style="width: 250px; height: 100%; border: 2px solid #fff; box-sizing: border-box;">
    <div class="tui-title" style="padding: 8px; border-bottom: 2px solid #fff;">Schedule</div>
    <div class="tui-content" style="padding: 8px;">
      <!-- Schedule header shows current time -->
      <div class="schedule-header">
        <span class="schedule-current-time">10:45 AM</span>
      </div>

      <!-- Period list -->
      <div class="schedule-periods">
        <div class="schedule-period" data-period="1">
          <div class="period-time">8:00 - 8:55</div>
          <div class="period-class">Mathematics</div>
        </div>
        <div class="schedule-period current" data-period="2">
          <div class="period-time">9:00 - 10:55</div>
          <div class="period-class">Computer Science</div>
        </div>
        <!-- Additional periods -->
      </div>
    </div>
  </div>
</div>
```

### 2. Schedule Configuration

The schedule is defined in `/public/config/schedule-config.json`:

```json
{
  "schedules": {
    "regular": {
      "periods": [
        {
          "period": 1,
          "start": "8:00",
          "end": "8:55",
          "class": "Mathematics"
        },
        {
          "period": 2,
          "start": "9:00", 
          "end": "10:55",
          "class": "Computer Science"
        },
        {
          "period": 3,
          "start": "11:00",
          "end": "11:55",
          "class": "Physics"
        },
        {
          "period": 4,
          "start": "12:00",
          "end": "12:55", 
          "class": "Lunch"
        },
        {
          "period": 5,
          "start": "13:00",
          "end": "13:55",
          "class": "English"
        },
        {
          "period": 6,
          "start": "14:00",
          "end": "14:55",
          "class": "History"
        },
        {
          "period": 7,
          "start": "15:00",
          "end": "15:55",
          "class": "Physical Education"
        }
      ]
    },
    "early_dismissal": {
      "periods": [
        // Shortened schedule periods
      ]
    }
  },
  "default": "regular",
  "special_dates": {
    "2023-09-15": "early_dismissal",
    "2023-10-31": "early_dismissal"
  }
}
```

### 3. JavaScript Implementation

The Schedule Window is implemented in `public/scripts/schedule-window.js`:

```javascript
class ScheduleWindow {
  constructor() {
    this.config = null;
    this.currentSchedule = null;
    this.updateInterval = null;
  }

  // Initialize the window
  async initialize() {
    // Load schedule config
    try {
      const response = await fetch('/config/schedule-config.json');
      this.config = await response.json();
      
      // Determine which schedule to use today
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const scheduleType = this.config.special_dates[today] || this.config.default;
      this.currentSchedule = this.config.schedules[scheduleType];
      
      if (!this.currentSchedule) {
        console.error('Invalid schedule configuration');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error loading schedule:', error);
      return false;
    }
  }
  
  // Open the schedule window
  async open() {
    // Make sure we have the config loaded
    if (!this.config && !(await this.initialize())) {
      return false;
    }
    
    // Create the window element
    const window = document.createElement('div');
    window.className = 'tui-box schedule-window';
    window.setAttribute('tabindex', '0');
    
    // Add the window HTML
    window.innerHTML = `
      <div class="tui-window" style="width: 250px; height: 100%; border: 2px solid #fff; box-sizing: border-box;">
        <div class="tui-title" style="padding: 8px; border-bottom: 2px solid #fff;">Schedule</div>
        <div class="tui-content" style="padding: 8px;">
          <div class="schedule-header">
            <span class="schedule-current-time">${this.formatTime(new Date())}</span>
          </div>
          <div class="schedule-periods">
            ${this.renderPeriods()}
          </div>
        </div>
      </div>
    `;
    
    // Add to document
    document.body.appendChild(window);
    window.focus();
    
    // Set up event listeners
    this.setupEventListeners(window);
    
    // Start time updates
    this.startTimeUpdates(window);
    
    // Highlight current period
    this.highlightCurrentPeriod(window);
    
    return window;
  }
  
  // Render period list HTML
  renderPeriods() {
    if (!this.currentSchedule || !this.currentSchedule.periods) {
      return '<div>No schedule available</div>';
    }
    
    return this.currentSchedule.periods.map(period => {
      return `
        <div class="schedule-period" data-period="${period.period}">
          <div class="period-time">${period.start} - ${period.end}</div>
          <div class="period-class">${period.class}</div>
        </div>
      `;
    }).join('');
  }
  
  // Format time for display (12-hour with AM/PM)
  formatTime(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    
    return `${displayHours}:${displayMinutes} ${ampm}`;
  }
  
  // Parse time string to minutes since midnight
  parseTimeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  // Get current class index based on time
  getCurrentClassIdx() {
    if (!this.currentSchedule || !this.currentSchedule.periods) {
      return -1;
    }
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    // Check each period
    for (let i = 0; i < this.currentSchedule.periods.length; i++) {
      const period = this.currentSchedule.periods[i];
      const startMinutes = this.parseTimeToMinutes(period.start);
      const endMinutes = this.parseTimeToMinutes(period.end);
      
      // If current time is within period
      if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
        return i;
      }
    }
    
    // If after all classes, return the last period
    if (currentMinutes > this.parseTimeToMinutes(this.currentSchedule.periods[this.currentSchedule.periods.length - 1].end)) {
      return this.currentSchedule.periods.length - 1;
    }
    
    // If before all classes, return the first period
    if (currentMinutes < this.parseTimeToMinutes(this.currentSchedule.periods[0].start)) {
      return 0;
    }
    
    return -1;
  }
  
  // Highlight the current period
  highlightCurrentPeriod(window) {
    const currentIdx = this.getCurrentClassIdx();
    if (currentIdx === -1) return;
    
    // Remove current class from all periods
    const periods = window.querySelectorAll('.schedule-period');
    periods.forEach(p => p.classList.remove('current'));
    
    // Add current class to the active period
    if (periods[currentIdx]) {
      periods[currentIdx].classList.add('current');
      periods[currentIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
  
  // Set up event listeners for keyboard navigation
  setupEventListeners(window) {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Close window
        this.close(window);
      } else if (e.key === 'ArrowDown') {
        // Navigate down through periods
        this.navigatePeriods(window, 1);
      } else if (e.key === 'ArrowUp') {
        // Navigate up through periods
        this.navigatePeriods(window, -1);
      } else if (e.key === 'Enter') {
        // Select current period
        const focused = window.querySelector('.schedule-period:focus');
        if (focused) {
          const periodClass = focused.querySelector('.period-class').textContent;
          this.selectClass(periodClass);
        }
      }
    });
    
    // Add click listeners to periods
    const periods = window.querySelectorAll('.schedule-period');
    periods.forEach(period => {
      period.setAttribute('tabindex', '0');
      period.addEventListener('click', () => {
        const periodClass = period.querySelector('.period-class').textContent;
        this.selectClass(periodClass);
      });
    });
  }
  
  // Navigate through periods with keyboard
  navigatePeriods(window, direction) {
    const periods = window.querySelectorAll('.schedule-period');
    const focused = window.querySelector('.schedule-period:focus');
    let index = 0;
    
    if (focused) {
      // Find current focus index
      for (let i = 0; i < periods.length; i++) {
        if (periods[i] === focused) {
          index = i;
          break;
        }
      }
      
      // Calculate new index
      index = (index + direction + periods.length) % periods.length;
    }
    
    // Focus the new period
    periods[index].focus();
  }
  
  // Select a class from the schedule
  selectClass(className) {
    // Dispatch an event that the school window can listen for
    const event = new CustomEvent('tuiSelectedClassChanged', {
      detail: { className }
    });
    window.dispatchEvent(event);
  }
  
  // Start time updates
  startTimeUpdates(window) {
    const timeElement = window.querySelector('.schedule-current-time');
    
    this.updateInterval = setInterval(() => {
      // Update displayed time
      timeElement.textContent = this.formatTime(new Date());
      
      // Check if period has changed
      this.highlightCurrentPeriod(window);
    }, 30000); // Update every 30 seconds
  }
  
  // Close the schedule window
  close(window) {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    if (window && window.parentNode) {
      window.parentNode.removeChild(window);
    }
  }
}

// Export schedule window
window.ScheduleWindow = new ScheduleWindow();
```

## Key Functionality Explained

### 1. Time Parsing and Formatting

```javascript
// Format time for display (12-hour with AM/PM)
formatTime(date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
  
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

// Parse time string to minutes since midnight
parseTimeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}
```

### 2. Current Period Tracking

```javascript
// Get current class index based on time
getCurrentClassIdx() {
  if (!this.currentSchedule || !this.currentSchedule.periods) {
    return -1;
  }
  
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Check each period
  for (let i = 0; i < this.currentSchedule.periods.length; i++) {
    const period = this.currentSchedule.periods[i];
    const startMinutes = this.parseTimeToMinutes(period.start);
    const endMinutes = this.parseTimeToMinutes(period.end);
    
    // If current time is within period
    if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
      return i;
    }
  }
  
  // If after all classes, return the last period
  if (currentMinutes > this.parseTimeToMinutes(
    this.currentSchedule.periods[this.currentSchedule.periods.length - 1].end
  )) {
    return this.currentSchedule.periods.length - 1;
  }
  
  // If before all classes, return the first period
  if (currentMinutes < this.parseTimeToMinutes(this.currentSchedule.periods[0].start)) {
    return 0;
  }
  
  return -1;
}
```

### 3. Schedule Selection Logic

```javascript
// Determine which schedule to use today
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
const scheduleType = this.config.special_dates[today] || this.config.default;
this.currentSchedule = this.config.schedules[scheduleType];
```

### 4. Integration with School Window

```javascript
// Select a class from the schedule
selectClass(className) {
  // Dispatch an event that the school window can listen for
  const event = new CustomEvent('tuiSelectedClassChanged', {
    detail: { className }
  });
  window.dispatchEvent(event);
}
```

## Styling

The schedule window uses these CSS styles:

```css
/* Schedule Window Styles */
.schedule-window {
  position: relative;
  z-index: 1;
  background: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: fit-content;
}

.schedule-window .schedule-header {
  margin-bottom: 8px;
  text-align: center;
}

.schedule-window .schedule-current-time {
  font-weight: bold;
  color: #fff;
  padding: 4px 8px;
  border: 1px solid #fff;
  background: #000;
}

.schedule-window .schedule-periods {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #fff;
}

.schedule-window .schedule-period {
  padding: 8px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.2s ease;
}

.schedule-window .schedule-period:last-child {
  border-bottom: none;
}

.schedule-window .schedule-period:hover {
  background: rgba(255, 255, 255, 0.1);
}

.schedule-window .schedule-period:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.2);
}

.schedule-window .schedule-period.current {
  background: rgba(255, 255, 255, 0.8);
  color: #000;
}

.schedule-window .period-time {
  font-size: 0.9em;
  opacity: 0.8;
}

.schedule-window .period-class {
  font-weight: bold;
  margin-top: 4px;
}
```

## Integration with Other Components

### 1. School Window Integration

The Schedule Window integrates with the School Window:
- Shows as a sidebar in the School Window
- Shares class data with School Window
- Allows selection of classes to view class details

```javascript
// In school-window.js
window.addEventListener('tuiSelectedClassChanged', (e) => {
  const className = e.detail.className;
  this.showClassDetails(className);
});
```

### 2. Main Menu Integration

```javascript
// In tui-start.js
function openScheduleWindow() {
  if (window.ScheduleWindow) {
    window.ScheduleWindow.open();
  }
}
```

## Customization

The Schedule Window is customizable through the `schedule-config.json` file:

1. Define multiple schedule types (regular, early dismissal, special events)
2. Set special dates for alternate schedules
3. Configure periods with start/end times and class names
4. Change the default schedule type

Example custom schedule:

```json
{
  "schedules": {
    "regular": { "periods": [...] },
    "early_dismissal": { "periods": [...] },
    "exam_day": {
      "periods": [
        {
          "period": 1,
          "start": "8:00",
          "end": "10:00",
          "class": "Exam 1"
        },
        {
          "period": 2,
          "start": "10:15", 
          "end": "12:15",
          "class": "Exam 2"
        }
      ]
    }
  },
  "default": "regular",
  "special_dates": {
    "2023-12-15": "exam_day"
  }
}
```

## Usage

To use the Schedule Window:

1. Configure your schedule in `schedule-config.json`
2. Open the Schedule Window with:
   ```javascript
   window.ScheduleWindow.open();
   ```
3. Navigate with arrow keys or mouse
4. Press Enter or click to select a class
5. Press Escape to close

## Future Enhancements

Potential improvements for the Schedule Window:

1. Multiple schedule profiles (e.g., weekday/weekend)
2. Color coding for different subject areas
3. Progress indicator showing current position in period
4. Calendar integration for special events
5. Teacher and room information
6. Week view option to see full week schedule
7. Schedule sharing/export functionality
8. Notifications for upcoming period changes
9. Custom period notes or reminders
10. Integration with Canvas assignments for relevant class work
