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
        
        // Process and store assignments by context in global variable
        if (!window.upcomingAssignmentsByContext) {
            window.upcomingAssignmentsByContext = {};
        }
        
        // Aliases for Canvas course names
        const courseAliases = {
            'Biology A (J. Kruger)': 'Biology',
            'Biology B (J. Kruger)': 'Biology',
            'Business Math B (J. Kruger)': 'Math',
            'French 2 B (J. Kruger)': 'French',
            'Life Skills (J. Kruger)': 'History',
            'United States History A (J. Kruger)': 'History',
            'United States History B (J. Kruger)': 'History',
            'Wellbeing: Music (J. Kruger)': 'Music',
        };
        
        // Group assignments by course/context
        data.filter(item => item.plannable_type === 'assignment' && item.plannable).forEach(item => {
            const contextName = item.context_name || '';
            const className = courseAliases[contextName] || contextName;
            
            if (className) {
                if (!window.upcomingAssignmentsByContext[className]) {
                    window.upcomingAssignmentsByContext[className] = [];
                }
                
                window.upcomingAssignmentsByContext[className].push({
                    name: item.plannable?.title || 'Untitled Assignment',
                    due: item.plannable?.due_at || '',
                    url: item.html_url || '',
                    submissions: item.submissions,
                    course_id: item.course_id
                });
            }
        });
        
        // Log the updated assignments by context
        console.log('Updated upcomingAssignmentsByContext:', window.upcomingAssignmentsByContext);
        
        // Map to match previous structure: { assignment, course, ... }
        return data
            .filter(item => item.plannable_type === 'assignment' && item.plannable)
            .map(item => ({
                assignment: item.plannable,
                course_id: item.course_id,
                html_url: item.html_url,
                planner_override: item.planner_override,
                submissions: item.submissions,
                context_name: item.context_name,
                // Add more fields as needed
            }));
    } catch (e) {
        console.error('Error fetching Canvas assignments:', e);
        return [];
    }
}
