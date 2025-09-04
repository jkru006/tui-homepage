# To-Do List Implementation

This document details the implementation of the To-Do List feature for the TUI Homepage, providing a task management system integrated with the School Window and schedule functionality.

## Features

1. Terminal-style task management interface
2. Create, edit, complete, and delete tasks
3. Task categorization by class/subject
4. Due date tracking with visual indicators
5. Integration with the School Window
6. Persistence using localStorage
7. Complete keyboard navigation
8. Focus on current/upcoming school tasks

## Core Components

### 1. HTML Structure

The To-Do List generates this HTML structure when opened:

```html
<div class="tui-box todo-window" tabindex="0">
  <div class="tui-window" style="width: 100%; height: 100%; border: 2px solid #fff; box-sizing: border-box;">
    <div class="tui-title" style="padding: 8px; border-bottom: 2px solid #fff;">To-Do List</div>
    <div class="tui-content" style="padding: 8px;">
      <!-- Task list section -->
      <div class="todo-list-container">
        <!-- Task items -->
        <div class="todo-item" data-id="task-1">
          <div class="todo-checkbox"></div>
          <div class="todo-text">Complete math assignment</div>
          <div class="todo-due">9/5</div>
          <div class="todo-subject">Mathematics</div>
        </div>
        <!-- Additional task items -->
      </div>
      
      <!-- Task input form -->
      <div class="todo-input-container">
        <input type="text" class="todo-input" placeholder="New task...">
        <input type="text" class="todo-due-input" placeholder="Due date">
        <select class="todo-subject-select">
          <!-- Subject options -->
        </select>
        <button class="todo-add-btn">Add</button>
      </div>
    </div>
  </div>
</div>
```

### 2. JavaScript Implementation

The To-Do List is implemented in `public/scripts/to-do.js`:

- Creates the task management interface
- Handles local storage for task persistence
- Provides keyboard shortcuts for task management
- Integrates with the School Window for context-aware tasks
- Manages task filtering, sorting, and display

### 3. Task Data Structure

Tasks are stored in localStorage with this structure:

```javascript
const tasks = [
  {
    id: "task-1628347",
    text: "Complete math assignment",
    subject: "Mathematics",
    due: "2025-09-05",
    completed: false,
    created: "2025-09-01T14:30:00"
  },
  // Additional tasks
];
```

## Key Functionality Explained

### 1. Task Management

```javascript
// Add a new task
function addTask(text, due, subject) {
  const task = {
    id: "task-" + Date.now(),
    text: text,
    subject: subject,
    due: formatDate(due), // YYYY-MM-DD
    completed: false,
    created: new Date().toISOString()
  };
  
  tasks.push(task);
  saveTasks();
  renderTasks();
}

// Toggle task completion status
function toggleTaskComplete(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
  }
}

// Delete a task
function deleteTask(id) {
  const index = tasks.findIndex(t => t.id === id);
  if (index !== -1) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
  }
}
```

### 2. Local Storage Persistence

```javascript
// Save tasks to localStorage
function saveTasks() {
  localStorage.setItem('tui-homepage-tasks', JSON.stringify(tasks));
}

// Load tasks from localStorage
function loadTasks() {
  const stored = localStorage.getItem('tui-homepage-tasks');
  if (stored) {
    tasks = JSON.parse(stored);
  } else {
    tasks = []; // Default empty array
  }
}
```

### 3. Task Filtering and Sorting

```javascript
// Filter tasks by various criteria
function filterTasks(filters = {}) {
  return tasks.filter(task => {
    // Filter by subject if specified
    if (filters.subject && task.subject !== filters.subject) {
      return false;
    }
    
    // Filter by completion status if specified
    if (filters.completed !== undefined && task.completed !== filters.completed) {
      return false;
    }
    
    // Filter by due date range if specified
    if (filters.dueBefore && new Date(task.due) > new Date(filters.dueBefore)) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    // Sort by due date (ascending)
    return new Date(a.due) - new Date(b.due);
  });
}
```

### 4. Integration with School Window

```javascript
// Listen for selected class changes from School Window
window.addEventListener('tuiSelectedClassChanged', (e) => {
  const selectedClass = e.detail.className;
  if (selectedClass) {
    // Update task filter to show tasks for this class
    currentSubjectFilter = selectedClass;
    renderTasks();
  }
});
```

### 5. Task Rendering

```javascript
// Render task list based on current filters
function renderTasks() {
  const taskContainer = document.querySelector('.todo-list-container');
  if (!taskContainer) return;
  
  // Clear existing tasks
  taskContainer.innerHTML = '';
  
  // Get filtered and sorted tasks
  const filteredTasks = filterTasks(currentFilters);
  
  if (filteredTasks.length === 0) {
    taskContainer.innerHTML = '<div class="todo-empty-message">No tasks to show</div>';
    return;
  }
  
  // Render each task
  filteredTasks.forEach(task => {
    const taskElement = document.createElement('div');
    taskElement.classList.add('todo-item');
    taskElement.dataset.id = task.id;
    
    // Add completed class if task is done
    if (task.completed) {
      taskElement.classList.add('completed');
    }
    
    // Check if task is overdue
    const isOverdue = new Date(task.due) < new Date() && !task.completed;
    if (isOverdue) {
      taskElement.classList.add('overdue');
    }
    
    // Build task HTML
    taskElement.innerHTML = `
      <div class="todo-checkbox">${task.completed ? '✓' : ''}</div>
      <div class="todo-text">${escapeHTML(task.text)}</div>
      <div class="todo-due">${formatDisplayDate(task.due)}</div>
      <div class="todo-subject">${escapeHTML(task.subject)}</div>
    `;
    
    // Attach event listeners
    taskElement.addEventListener('click', (e) => {
      // Handle clicks on different parts of the task
    });
    
    taskContainer.appendChild(taskElement);
  });
  
  // Update focus if needed
  updateFocus();
}
```

## Usage

### Opening the To-Do List

```javascript
// Call this function to open the To-Do List
window.openToDoWindow();
```

The To-Do List can be opened:
1. Directly from the main menu
2. From the School Window by selecting "To-Do List"
3. By calling the function from JavaScript

### Navigation

- Up/Down arrows navigate through tasks
- Space toggles task completion
- Enter edits the selected task
- Delete key removes the selected task
- Escape returns to the previous menu
- Tab cycles between the task list and input form

### Task Management

- Add new tasks with text, due date, and subject
- Mark tasks as complete by clicking the checkbox or using Space
- Delete tasks using the Delete key or clicking a delete button
- Tasks automatically sort by due date
- Overdue tasks receive visual highlighting
- Completed tasks can be filtered out or displayed with strikethrough

## Styling

The To-Do List uses consistent TUI styling:
- Terminal-inspired interface with monospace font
- Black background with white text and borders
- Color coding for task status (normal, completed, overdue)
- Clean, minimal design focused on readability

## Integration Points

### 1. School Window Integration

The To-Do List integrates with the School Window:
- Opens from the School Window menu
- Can filter tasks by the currently selected class
- Shares styling and navigation patterns
- Provides consistent keyboard shortcuts

### 2. Canvas Integration (Optional)

When Canvas integration is enabled:
- Assignments from Canvas can appear in the To-Do List
- Due dates are synchronized
- Completion status can be updated

## Future Enhancements

Potential improvements for the To-Do List:

1. Task priorities (high, medium, low)
2. Recurring tasks (daily, weekly, etc.)
3. Sub-tasks for breaking down larger tasks
4. Time estimates for tasks
5. Task notes or additional details
6. Tags for cross-categorization
7. Multiple task lists for different contexts
8. Cloud synchronization across devices
9. Calendar view for task planning
10. Notifications for upcoming deadlines
