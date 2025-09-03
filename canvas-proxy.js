// ...existing code...
// ...existing code...
// ...existing code...
// canvas-proxy.js
// Simple Node.js Express proxy for Canvas API with CORS enabled
const fetch = require('node-fetch');
const fs = require('fs');

// Export a function that takes an Express app and mounts routes
module.exports = function(app) {

// Use CANVAS_TOKEN from environment variables
require('dotenv').config();
const token = process.env.CANVAS_TOKEN;
if (!token) {
  console.warn('Warning: No Canvas token found in environment variable CANVAS_TOKEN');
} else {
  console.log('Using Canvas token from environment variable.');
}

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });

// Fetch Canvas To-Do list
  app.get('/canvas-todo', async (req, res) => {
  if (!token) return res.status(500).json({ error: 'No Canvas token found' });
  try {
    const todoResp = await fetch('https://fusion.instructure.com/api/v1/users/self/todo', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('Canvas /users/self/todo status:', todoResp.status);
    console.log('Canvas /users/self/todo headers:', JSON.stringify([...todoResp.headers]));
    let todoText = await todoResp.text();
    try { JSON.parse(todoText); } catch (e) { console.log('Canvas /users/self/todo body:', todoText); }
    if (!todoResp.ok) {
      return res.status(todoResp.status).json({ error: 'Canvas API error (todo)', status: todoResp.status, body: todoText });
    }
    const todo = JSON.parse(todoText);
    res.json(todo);
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

// Fetch Canvas courses (must be after app is initialized)
  app.get('/canvas-courses', async (req, res) => {
  if (!token) return res.status(500).json({ error: 'No Canvas token found' });
  try {
    const coursesResp = await fetch('https://fusion.instructure.com/api/v1/courses?enrollment_state=active', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('Canvas /courses status:', coursesResp.status);
    let coursesText = await coursesResp.text();
    try { JSON.parse(coursesText); } catch (e) { console.log('Canvas /courses body:', coursesText); }
    if (!coursesResp.ok) {
      return res.status(coursesResp.status).json({ error: 'Canvas API error (courses)', status: coursesResp.status, body: coursesText });
    }
    const courses = JSON.parse(coursesText);
    res.json(courses);
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

// Fetch Canvas completed assignments (submissions that are 'graded' or 'submitted')
  app.get('/canvas-completed', async (req, res) => {
  if (!token) return res.status(500).json({ error: 'No Canvas token found' });
  try {
    // Get all courses
    const coursesResp = await fetch('https://fusion.instructure.com/api/v1/courses?enrollment_state=active', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!coursesResp.ok) {
      return res.status(coursesResp.status).json({ error: 'Canvas API error (courses)', status: coursesResp.status });
    }
    const courses = await coursesResp.json();
    let completedAssignments = [];
    // For each course, get submissions that are completed (handle pagination)
    for (const course of courses) {
      let nextUrl = `https://fusion.instructure.com/api/v1/courses/${course.id}/students/submissions?student_ids[]=self&workflow_state=graded,submitted&per_page=100`;
      while (nextUrl) {
        const resp = await fetch(nextUrl, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!resp.ok) break;
        const submissions = await resp.json();
        for (const sub of submissions) {
          if ((sub.workflow_state === 'graded' || sub.workflow_state === 'submitted') && sub.assignment) {
            completedAssignments.push({
              assignment: sub.assignment,
              course: course,
              submitted_at: sub.submitted_at,
              grade: sub.grade,
              html_url: sub.html_url || (sub.assignment && sub.assignment.html_url) || '',
            });
          }
        }
        // Pagination
        const link = resp.headers.get('link');
        if (link && link.includes('rel="next"')) {
          const match = link.match(/<([^>]+)>; rel="next"/);
          nextUrl = match ? match[1] : null;
        } else {
          nextUrl = null;
        }
      }
    }
    res.json(completedAssignments);
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});


// Fetch all upcoming assignments using the Canvas Planner API
  app.get('/canvas-upcoming', async (req, res) => {
  if (!token) return res.status(500).json({ error: 'No Canvas token found' });
  try {
    let upcoming = [];
    let nextUrl = 'https://fusion.instructure.com/api/v1/planner/items?start_date=' + encodeURIComponent(new Date(Date.now() - 7*24*60*60*1000).toISOString()) + '&per_page=50';
    while (nextUrl) {
      const resp = await fetch(nextUrl, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!resp.ok) {
        const text = await resp.text();
        return res.status(resp.status).json({ error: 'Canvas API error (planner)', status: resp.status, body: text });
      }
      const items = await resp.json();
      upcoming.push(...items);
      // Pagination
      const link = resp.headers.get('link');
      if (link && link.includes('rel="next"')) {
        const match = link.match(/<([^>]+)>; rel="next"/);
        nextUrl = match ? match[1] : null;
      } else {
        nextUrl = null;
      }
    }
    res.json(upcoming);
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

  // No app.listen here; server.js will start the server
};
