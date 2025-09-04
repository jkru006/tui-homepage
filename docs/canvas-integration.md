# Canvas API Integration

This document details the Canvas LMS integration features for the TUI Homepage, explaining how the Canvas API is used to fetch and display course information, assignments, and other Canvas data.

## Overview

The Canvas API integration allows the TUI Homepage to pull data directly from your Canvas LMS account, displaying your courses, assignments, grades, and announcements in a terminal-style interface.

## Features

1. Course listing with latest updates
2. Assignment tracking with due dates
3. Grade visualization
4. Calendar integration with schedule
5. Authentication via API tokens
6. Local caching for offline access
7. Notifications for upcoming deadlines

## Implementation Details

### 1. Authentication

Canvas integration uses a personal access token for authentication:

```javascript
// canvas-api.js
class CanvasAPI {
  constructor(token, domain = 'canvas.instructure.com') {
    this.token = token;
    this.domain = domain;
    this.baseUrl = `https://${domain}/api/v1`;
    this.headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }
  
  // ...API methods
}
```

Personal access tokens are stored securely in localStorage:

```javascript
// Saving token (during setup)
localStorage.setItem('canvas_api_token', encryptedToken);

// Loading token
const token = localStorage.getItem('canvas_api_token');
if (token) {
  const canvasAPI = new CanvasAPI(decryptToken(token));
}
```

### 2. Data Fetching

The API wrapper provides methods to fetch various Canvas data:

```javascript
// Fetch courses
async getCourses() {
  try {
    const response = await fetch(`${this.baseUrl}/courses?enrollment_state=active`, {
      headers: this.headers
    });
    
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
}

// Fetch assignments for a course
async getCourseAssignments(courseId) {
  try {
    const response = await fetch(
      `${this.baseUrl}/courses/${courseId}/assignments?include=submission`, 
      { headers: this.headers }
    );
    
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching assignments for course ${courseId}:`, error);
    throw error;
  }
}

// Additional methods for announcements, grades, etc.
```

### 3. Caching System

To minimize API calls and provide offline functionality, the integration implements a caching system:

```javascript
// Cache management
class CanvasCache {
  constructor() {
    this.cacheKey = 'canvas_data_cache';
    this.ttl = 30 * 60 * 1000; // 30 minutes
  }
  
  // Get data from cache
  get(key) {
    try {
      const cache = JSON.parse(localStorage.getItem(this.cacheKey) || '{}');
      const item = cache[key];
      
      if (!item) return null;
      
      // Check if cache is expired
      if (Date.now() - item.timestamp > this.ttl) {
        this.delete(key);
        return null;
      }
      
      return item.data;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }
  
  // Save data to cache
  set(key, data) {
    try {
      const cache = JSON.parse(localStorage.getItem(this.cacheKey) || '{}');
      cache[key] = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(this.cacheKey, JSON.stringify(cache));
      return true;
    } catch (error) {
      console.error('Error writing to cache:', error);
      return false;
    }
  }
  
  // Delete cache item
  delete(key) {
    try {
      const cache = JSON.parse(localStorage.getItem(this.cacheKey) || '{}');
      delete cache[key];
      localStorage.setItem(this.cacheKey, JSON.stringify(cache));
      return true;
    } catch (error) {
      console.error('Error deleting from cache:', error);
      return false;
    }
  }
  
  // Clear entire cache
  clear() {
    localStorage.removeItem(this.cacheKey);
  }
}
```

### 4. Canvas Proxy Server

For cross-origin request handling, a proxy server is implemented:

```javascript
// canvas-proxy.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// Canvas API proxy
app.post('/canvas-proxy', async (req, res) => {
  try {
    const { endpoint, token, domain, method = 'GET', body } = req.body;
    
    if (!endpoint || !token) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const canvasDomain = domain || 'canvas.instructure.com';
    const url = `https://${canvasDomain}/api/v1${endpoint}`;
    
    const fetchOptions = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    if (body && (method === 'POST' || method === 'PUT')) {
      fetchOptions.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, fetchOptions);
    const data = await response.json();
    
    res.json(data);
  } catch (error) {
    console.error('Canvas proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Canvas proxy server running on port ${PORT}`);
});
```

## Integration with TUI Homepage

### Course Window

```javascript
// Display courses from Canvas
async function showCanvasCourses() {
  // Create TUI window
  const window = document.createElement('div');
  window.className = 'tui-box canvas-courses-window';
  window.tabIndex = 0;
  
  // Add loading indicator
  window.innerHTML = `
    <div class="tui-window">
      <div class="tui-title">Canvas Courses</div>
      <div class="tui-content">
        Loading courses...
      </div>
    </div>
  `;
  
  document.body.appendChild(window);
  window.focus();
  
  try {
    // Try cache first
    let courses = canvasCache.get('courses');
    
    if (!courses) {
      // Fetch from API if not in cache
      courses = await canvasAPI.getCourses();
      canvasCache.set('courses', courses);
    }
    
    // Update window content
    const content = window.querySelector('.tui-content');
    
    if (!courses || courses.length === 0) {
      content.innerHTML = 'No courses found.';
      return;
    }
    
    // Generate course list HTML
    content.innerHTML = `
      <ul class="canvas-course-list">
        ${courses.map((course, index) => `
          <li class="canvas-course-item" data-course-id="${course.id}" tabindex="0">
            <div class="course-name">${course.name}</div>
            <div class="course-code">${course.course_code}</div>
          </li>
        `).join('')}
      </ul>
    `;
    
    // Add event listeners for keyboard navigation
    const items = content.querySelectorAll('.canvas-course-item');
    
    items.forEach((item, index) => {
      item.addEventListener('click', () => {
        showCourseDetails(item.dataset.courseId);
      });
      
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          showCourseDetails(item.dataset.courseId);
        } else if (e.key === 'ArrowDown' && index < items.length - 1) {
          items[index + 1].focus();
        } else if (e.key === 'ArrowUp' && index > 0) {
          items[index - 1].focus();
        } else if (e.key === 'Escape') {
          window.remove();
        }
      });
    });
    
    // Add window keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        window.remove();
      }
    });
    
  } catch (error) {
    // Handle errors
    const content = window.querySelector('.tui-content');
    content.innerHTML = `Error loading courses: ${error.message}`;
  }
}
```

### Assignment Integration with To-Do List

```javascript
// Import Canvas assignments to To-Do List
async function importCanvasAssignments() {
  try {
    // Get courses
    const courses = await canvasAPI.getCourses();
    
    // Process each course
    for (const course of courses) {
      const assignments = await canvasAPI.getCourseAssignments(course.id);
      
      // Filter unsubmitted and upcoming assignments
      const relevantAssignments = assignments.filter(assignment => {
        // Check if there's no submission or it's not submitted
        const notSubmitted = !assignment.submission || 
                            assignment.submission.workflow_state !== 'submitted';
        
        // Check if due date is in the future
        const dueDate = assignment.due_at ? new Date(assignment.due_at) : null;
        const isFuture = dueDate && dueDate > new Date();
        
        return notSubmitted && isFuture;
      });
      
      // Add to to-do list
      relevantAssignments.forEach(assignment => {
        addTask({
          text: assignment.name,
          subject: course.name,
          due: assignment.due_at ? new Date(assignment.due_at).toISOString().split('T')[0] : null,
          canvasId: assignment.id,
          canvasCourseId: course.id,
          completed: false
        });
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error importing Canvas assignments:', error);
    return false;
  }
}
```

## Setup and Configuration

To use Canvas integration:

1. Set up the Canvas proxy server:
   ```bash
   npm install express cors node-fetch
   node canvas-proxy.js
   ```

2. Create a Canvas API token:
   - Log in to Canvas
   - Go to Account > Settings
   - Scroll to "Approved Integrations"
   - Click "+ New Access Token"
   - Enter a purpose (e.g., "TUI Homepage")
   - Copy the generated token

3. Add the token in the TUI Homepage settings:
   - Open Settings menu
   - Select "Canvas Integration"
   - Enter your Canvas domain (e.g., "school.instructure.com")
   - Paste your API token
   - Click "Save"

## API Reference

### Main Canvas API Methods

| Method | Description | Parameters |
|--------|-------------|------------|
| `getCourses()` | Fetches active courses | None |
| `getCourseAssignments(courseId)` | Fetches assignments for a course | courseId: string/number |
| `getCourseAnnouncements(courseId)` | Fetches announcements for a course | courseId: string/number |
| `getUpcomingEvents()` | Fetches upcoming calendar events | None |
| `getUserProfile()` | Fetches user profile information | None |
| `getCourseModules(courseId)` | Fetches modules for a course | courseId: string/number |
| `submitAssignment(courseId, assignmentId, submission)` | Submits an assignment | courseId, assignmentId, submission object |

## Security Considerations

1. **API Token Storage**: The token is stored in localStorage. Consider using more secure storage options for production use.

2. **Proxy Server**: The proxy server should implement rate limiting and additional security measures in production.

3. **Cross-Origin Requests**: The Canvas proxy handles CORS issues, but verify your specific Canvas instance's CORS policies.

## Limitations

1. Canvas API rate limits may apply
2. Some Canvas features might require additional permissions
3. Canvas UI changes may affect API behavior
4. Mobile support depends on Canvas mobile API compatibility

## Troubleshooting

Common issues and solutions:

1. **Authentication Errors**: 
   - Verify your API token is correct and not expired
   - Check that your Canvas domain is correctly specified

2. **Missing Data**:
   - Clear the cache and try again
   - Verify your Canvas account has access to the courses

3. **Proxy Server Errors**:
   - Check if the proxy server is running
   - Verify network connectivity between the TUI Homepage and proxy server
