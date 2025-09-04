// assignment-data.js
// Helper file to initialize and manage assignment data

// Initialize the upcomingAssignmentsByContext with mock data if needed
function initAssignmentData() {
    // Initialize if doesn't exist
    if (!window.upcomingAssignmentsByContext) {
        console.log('Initializing mock assignment data');
        window.upcomingAssignmentsByContext = {
            'Biology': [
                { name: 'Lab Report - Cell Division', due: '2023-09-05' },
                { name: 'Chapter 3 Questions', due: '2023-09-07' }
            ],
            'Math': [
                { name: 'Algebra Homework Set 2', due: '2023-09-04' },
                { name: 'Linear Functions Quiz', due: '2023-09-06' }
            ],
            'Business Math': [
                { name: 'Business Math - Budget Analysis', due: '2023-09-05' },
                { name: 'Business Math - Financial Planning', due: '2023-09-08' }
            ],
            'History': [
                { name: 'History - Cultural Analysis Essay', due: '2023-09-04' },
                { name: 'History - Geography Quiz', due: '2023-09-08' }
            ],
            'US History': [
                { name: 'US History - Civil War Essay', due: '2023-09-06' },
                { name: 'US History - Constitution Test', due: '2023-09-09' }
            ],
            'Life Skills': [
                { name: 'Life Skills - Career Planning', due: '2023-09-05' },
                { name: 'Life Skills - Budget Exercise', due: '2023-09-07' }
            ],
            'French': [
                { name: 'Conjugation Exercise', due: '2023-09-05' },
                { name: 'Oral Presentation Prep', due: '2023-09-09' }
            ],
            'Music': [
                { name: 'Composition Analysis', due: '2023-09-10' },
                { name: 'Practice Log', due: '2023-09-07' }
            ]
        };
    }
}

// Map class names from UI to data object keys
const classNameMap = {
    'math': 'Math', 
    'mathematics': 'Math',
    'business math': 'Math',
    'biology': 'Biology',
    'history': 'History',
    'life skills': 'Life Skills',
    'us history': 'US History',
    'french': 'French',
    'music': 'Music'
};

// Get assignments for a specific class
function getAssignmentsForClass(className) {
    // Initialize data if needed
    initAssignmentData();
    
    // Special case - combined classes
    const classGroups = {
        'History': ['History', 'US History', 'Life Skills'],
        'Math': ['Math', 'Business Math']
    };
    
    // Convert class name to the correct key using the mapping
    const normalizedClassName = className.toLowerCase();
    const mappedClassName = classNameMap[normalizedClassName] || className;
    
    console.log(`Looking for assignments for class: "${className}", mapped to "${mappedClassName}"`);
    
    // Check if this is a combined class group
    if (classGroups[mappedClassName]) {
        // Get assignments from all classes in the group
        let combinedAssignments = [];
        classGroups[mappedClassName].forEach(groupClass => {
            if (window.upcomingAssignmentsByContext[groupClass]) {
                // Add class name to each assignment for display
                const classAssignments = window.upcomingAssignmentsByContext[groupClass].map(assignment => {
                    return {
                        ...assignment,
                        name: `${assignment.name} [${groupClass}]`,
                        originalClass: groupClass
                    };
                });
                combinedAssignments = combinedAssignments.concat(classAssignments);
            }
        });
        
        // Sort by due date
        combinedAssignments.sort((a, b) => {
            const dateA = new Date(a.due);
            const dateB = new Date(b.due);
            return dateA - dateB;
        });
        
        return combinedAssignments;
    }
    
    // First try exact match
    if (window.upcomingAssignmentsByContext[mappedClassName]) {
        return window.upcomingAssignmentsByContext[mappedClassName];
    }
    
    // Then try case-insensitive match
    const keys = Object.keys(window.upcomingAssignmentsByContext);
    for (const key of keys) {
        if (key.toLowerCase() === normalizedClassName) {
            return window.upcomingAssignmentsByContext[key];
        }
    }
    
    // Return empty array if no match found
    return [];
}

// Get all assignments from all classes
function getAllAssignments() {
    // Initialize data if needed
    initAssignmentData();
    
    const allAssignments = [];
    
    // Collect all assignments from all classes
    Object.keys(window.upcomingAssignmentsByContext).forEach(className => {
        const classAssignments = window.upcomingAssignmentsByContext[className];
        if (Array.isArray(classAssignments)) {
            classAssignments.forEach(assignment => {
                // Don't modify name here, keep it clean
                allAssignments.push({
                    name: assignment.name,
                    class: className,
                    due: assignment.due,
                    url: assignment.url || `https://fusion.instructure.com/courses/${className.toLowerCase().replace(/\s+/g, '')}/assignments/`
                });
            });
        }
    });
    
    // Sort by due date
    allAssignments.sort((a, b) => {
        const dateA = new Date(a.due);
        const dateB = new Date(b.due);
        return dateA - dateB;
    });
    
    return allAssignments;
}

// Add a new assignment to the data structure
function addAssignment(className, assignment) {
    // Initialize data if needed
    initAssignmentData();
    
    // Convert class name to the correct key using the mapping
    const normalizedClassName = className.toLowerCase();
    const mappedClassName = classNameMap[normalizedClassName] || className;
    
    // Ensure the class exists in the data structure
    if (!window.upcomingAssignmentsByContext[mappedClassName]) {
        window.upcomingAssignmentsByContext[mappedClassName] = [];
    }
    
    // Add the assignment
    window.upcomingAssignmentsByContext[mappedClassName].push(assignment);
    
    console.log(`Added new assignment to ${mappedClassName}:`, assignment);
}

// Make functions globally available
window.initAssignmentData = initAssignmentData;
window.getAssignmentsForClass = getAssignmentsForClass;
window.getAllAssignments = getAllAssignments;
window.addAssignment = addAssignment;
window.classNameMap = classNameMap;
