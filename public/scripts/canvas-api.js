// Fetches completed Canvas assignments for the current user
async function fetchCanvasCompleted() {
    const apiUrl = 'http://localhost:3001/canvas-completed';
    try {
        const resp = await fetch(apiUrl);
        if (!resp.ok) throw new Error('Failed to fetch completed assignments');
        const data = await resp.json();
        return data.filter(item => item.assignment);
    } catch (e) {
        return [];
    }
}
window.fetchCanvasCompleted = fetchCanvasCompleted;
// canvas-api.js
// Fetches Canvas assignments for the current user using a Canvas API token.


// Fetches all upcoming Canvas assignments for the current user
async function fetchCanvasAssignments(token) {
    // Use new endpoint for all upcoming assignments
    const apiUrl = 'http://localhost:3001/canvas-upcoming';
    try {
        const resp = await fetch(apiUrl);
        if (!resp.ok) throw new Error('Failed to fetch Canvas assignments');
        const data = await resp.json();
        // Map to match previous structure: { assignment, course, ... }
        return data
            .filter(item => item.plannable_type === 'assignment' && item.plannable)
            .map(item => ({
                assignment: item.plannable,
                course_id: item.course_id,
                html_url: item.html_url,
                planner_override: item.planner_override,
                submissions: item.submissions,
                // Add more fields as needed
            }));
    } catch (e) {
        return [];
    }
}
