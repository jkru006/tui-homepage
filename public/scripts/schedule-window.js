// scripts/schedule-window.js
// Renders the schedule popup for the School menu

// Initialize assignments structure using the helper if available
if (typeof window.initAssignmentData === 'function') {
    window.initAssignmentData();
} else {
  // Initialize if doesn't exist (fallback)
  if (!window.upcomingAssignmentsByContext) {
    window.upcomingAssignmentsByContext = {
      'Biology': [
        { name: 'Lab Report - Cell Division', due: '2025-09-05' },
        { name: 'Chapter 3 Questions', due: '2025-09-07' }
      ],
      'Math': [
        { name: 'Algebra Homework Set 2', due: '2025-09-04' },
        { name: 'Linear Functions Quiz', due: '2025-09-06' }
      ],
      'History': [
        { name: 'World War II Essay', due: '2025-09-08' },
        { name: 'Chapter 5 Reading', due: '2025-09-03' }
      ],
      'French': [
        { name: 'Conjugation Exercise', due: '2025-09-05' },
        { name: 'Oral Presentation Prep', due: '2025-09-09' }
      ],
      'Music': [
        { name: 'Composition Analysis', due: '2025-09-10' },
        { name: 'Practice Log', due: '2025-09-07' }
      ]
    };
  }
}

console.log("[Schedule Window] Loaded schedule-window.js");

  // Only disable transitions, not animations
(function() {
  if (!document.querySelector('#schedule-no-animations')) {
    const styleTag = document.createElement('style');
    styleTag.id = 'schedule-no-animations';
    styleTag.textContent = `
      /* Disable transitions throughout the app, but allow animations */
      * {
        transition: none !important;
      }
    `;
    document.head.appendChild(styleTag);
  }
})();async function showScheduleBox() {
  console.log("[Schedule Box] Opening schedule box");
  
  // Add container styles
  if (!document.querySelector('#schedule-styles')) {
    const styleTag = document.createElement('style');
    styleTag.id = 'schedule-styles';
    styleTag.textContent = `
      /* Basic styles for text containers */
      .marquee-container {
        position: relative;
        overflow: hidden;
        width: 100%;
        max-width: 200px;
      }
      
      .marquee-text {
        position: relative;
        white-space: nowrap;
        display: inline-block;
        width: 100%;
        text-overflow: ellipsis;
        overflow: hidden;
      }

      /* Animation for text that doesn't fit */
      @keyframes marquee {
        0% { transform: translateX(0); }
        10% { transform: translateX(0); } /* Hold at start */
        40% { transform: translateX(calc(-100% + 200px)); } /* Scroll to end */
        60% { transform: translateX(calc(-100% + 200px)); } /* Hold at end */
        90% { transform: translateX(0); } /* Scroll back */
        100% { transform: translateX(0); } /* Hold at start */
      }

      /* Class applied to text that needs animation */
      .marquee-animate {
        animation: marquee 12s linear infinite;
        padding-right: 24px; /* Padding at end */
      }
    `;
    document.head.appendChild(styleTag);
  }
  
  // Fetch schedule data asynchronously; use cached upcoming assignments
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const now = new Date();
  const dayName = days[now.getDay()];
  const monthName = months[now.getMonth()];
  let todaySchedule = null;
  let upcomingAssignments = window.upcomingAssignments || [];
  try {
    const scheduleResp = await fetch('/config/schedule-config.json');
    console.log("[Schedule Box] Schedule data fetch status:", scheduleResp.status);
    if (scheduleResp.ok) {
      const scheduleData = await scheduleResp.json();
      todaySchedule = scheduleData[dayName];
    } else {
      todaySchedule = null;
      console.error("[Schedule Box] Failed to fetch schedule data", scheduleResp.status);
    }
  } catch (e) {
    todaySchedule = null;
    console.error("[Schedule Box] Error fetching schedule data", e);
  }
  // Helper to get current class index
  function getCurrentClassIdx(schedule) {
    if (!schedule) return -1;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    let lastIdx = -1;
    let firstClassIdx = -1;
    let firstClassStart = Infinity;
    
    console.log("[Schedule Window] Current time in minutes:", nowMinutes, "Hour:", now.getHours());
    
    for (let i = 0; i < schedule.length; i++) {
      const [start, end] = schedule[i].time.split('-');
      function parseTime(t) {
        let [h, m] = t.match(/\d+/g).map(Number);
        let pm = t.toLowerCase().includes('pm');
        if (h === 12) pm = false; // 12pm is noon, 12am is midnight
        if (!pm && t.toLowerCase().includes('am')) pm = false;
        if (pm && h < 12) h += 12;
        return h * 60 + m;
      }
      const startM = parseTime(start);
      const endM = parseTime(end);
      
      // Track the first class of the day (skip lunch periods)
      if (startM < firstClassStart && !schedule[i].subject.toLowerCase().includes('lunch')) {
        firstClassStart = startM;
        firstClassIdx = i;
        console.log("[Schedule Window] Found first class:", schedule[i].subject, "at index", i, "starting at", startM);
      }
      
      // Check if we're currently in this class period
      if (nowMinutes >= startM && nowMinutes < endM) {
        console.log("[Schedule Window] Currently in class period:", schedule[i].subject);
        return i;
      }
      
      if (nowMinutes >= startM) {
        lastIdx = i;
      }
    }
    
    // Early morning hours (before 7 AM) or before first class, select first class
    const earlyMorningHours = now.getHours() < 7;
    const beforeFirstClass = firstClassIdx !== -1 && nowMinutes < firstClassStart;
    const lateNightHours = now.getHours() >= 20; // After 8 PM
    
    if (earlyMorningHours || beforeFirstClass || lateNightHours) {
      if (firstClassIdx !== -1) {
        console.log("[Schedule Window] Before school hours or late night, selecting first class:", 
          schedule[firstClassIdx].subject, "at index", firstClassIdx);
        return firstClassIdx;
      }
    }
    
    // If classes are over, return the last period
    console.log("[Schedule Window] After school hours or no match, selecting last class index:", lastIdx);
    return lastIdx;
  }
  let scheduleBox = document.getElementById('schedule-box');
  if (!scheduleBox) {
    scheduleBox = document.createElement('div');
    scheduleBox.id = 'schedule-box';
    scheduleBox.className = 'schedule-box schedule-tui-box';
    
    // Find the main TUI window (assume it has class 'tui-box' and is the main one)
    const mainTui = document.querySelector('.tui-box');
    let left = 600, top = 0, height = 'auto';
    
    if (mainTui) {
      const rect = mainTui.getBoundingClientRect();
      height = rect.height + 'px';
    }
    
    scheduleBox.style = [
      'position:absolute',
      'width:270px',
      'min-width:270px',
      'max-width:270px',
      `height:${height}`,
      'background:#000',
      'border:2px solid #fff',
      'border-radius:8px',
      'box-shadow:0 0 48px #000a',
      'padding:32px 16px 24px 16px',
      'color:#fff',
      'font-size:1rem',
      'display:flex',
      'flex-direction:column',
      'align-items:flex-start',
      'justify-content:flex-start',
      'gap:18px',
      'overflow:hidden',
      'box-sizing:border-box',
      'margin:0',
      'transition:none',
      'animation:none'
    ].join(';');
  // Add MM/DD date after day name
  // Format current time as hh:mm am/pm
  let hours = now.getHours();
  let minutes = now.getMinutes();
  let ampm = hours >= 12 ? 'pm' : 'am';
  let displayHour = hours % 12;
  if (displayHour === 0) displayHour = 12;
  let timeStr = `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  const mm = (now.getMonth() + 1).toString().padStart(2, '0');
  const dd = now.getDate().toString().padStart(2, '0');
  let scheduleHtml = `<div style='display:flex;flex-direction:column;align-items:flex-start;min-width:120px;'>
    <span style='display:inline-flex;align-items:center;'>
      <img src='/icons/calendar.svg' alt='Schedule' style='width:20px;height:20px;filter:invert(1);margin-right:6px;'/>
      <span style='font-weight:bold;font-size:1.05rem;'>Schedule</span>
    </span>
    <span style='font-size:1rem;font-weight:normal;margin:2px 0 0 26px;'>${dayName} ${timeStr}</span>
  </div>`;
    if (todaySchedule && todaySchedule.length > 0) {
      // Helper to render a styled list (schedule or coursework)
      function renderList(items, selectedIdx, extraBottomPadding = false) {
        // Add extra bottom padding if requested (for coursework list)
        let ulStyle = 'list-style:none;padding:0;margin:0;width:100%;min-width:180px;display:flex;flex-direction:column;gap:0;';
        if (extraBottomPadding) {
          ulStyle += 'padding-bottom:18px;';
        }
        let html = `<ul style='${ulStyle}'>`;
        items.forEach((item, idx) => {
          let highlightSpanStart = '';
          let highlightSpanEnd = '';
          let spanStyle = '';
          if (idx === selectedIdx) {
            // Reduce right padding and margin so highlight doesn't touch the border
            spanStyle = 'background:#fff;color:#000;font-weight:bold;padding:2px 6px 2px 10px;border-radius:0;display:flex;align-items:center;margin-right:0.5em;max-width:calc(100% - 8px);box-sizing:border-box;';
            highlightSpanStart = `<span style=\"${spanStyle}\">`;
            highlightSpanEnd = '</span>';
          }
          html += `<li style='padding:2px 0 2px 0;min-height:1.6em;display:flex;align-items:center;gap:6px;'>`;
          const timeWithBreaks = item.time;
          const subjectWithBreaks = item.subject;
          if (idx === selectedIdx) {
            html += `${highlightSpanStart}<span style='font-family:monospace;min-width:90px;display:inline-block;'>${timeWithBreaks}</span> <span style='margin:0 4px;'>—</span> <span>${subjectWithBreaks}</span>${highlightSpanEnd}`;
          } else {
            html += `<span style='font-family:monospace;min-width:90px;display:inline-block;'>${timeWithBreaks}</span> <span style='margin:0 4px;'>—</span> <span>${subjectWithBreaks}</span>`;
          }
          html += `</li>`;
        });
        html += `</ul>`;
        return html;
      }
      let currentIdx = getCurrentClassIdx(todaySchedule);
      console.log("[Schedule Window] Initial current class index:", currentIdx);
      
      if (currentIdx === -1) {
        // If no current class found, try to find the first non-lunch class of the day
        for (let i = 0; i < todaySchedule.length; i++) {
          if (!todaySchedule[i].subject.toLowerCase().includes('lunch')) {
            currentIdx = i;
            console.log("[Schedule Window] No current class found, selecting first non-lunch class:", 
              todaySchedule[i].subject, "at index", i);
            break;
          }
        }
        
        // If still no match, fall back to Biology if available
        if (currentIdx === -1) {
          const biologyIdx = todaySchedule.findIndex(item => item.subject.trim().toLowerCase() === 'biology');
          if (biologyIdx !== -1) {
            currentIdx = biologyIdx;
            console.log("[Schedule Window] Falling back to Biology class at index:", biologyIdx);
          } else if (todaySchedule.length > 0) {
            // Last resort: use the last non-lunch class
            for (let i = todaySchedule.length - 1; i >= 0; i--) {
              if (!todaySchedule[i].subject.toLowerCase().includes('lunch')) {
                currentIdx = i;
                console.log("[Schedule Window] Last resort: selecting last non-lunch class at index:", i);
                break;
              }
            }
          }
        }
      }
      // Render schedule list with selection
      scheduleHtml += `<div id='schedule-list-container'>` + renderList(todaySchedule, currentIdx) + `</div>`;
      // Coursework section
      scheduleHtml += `<div style='margin-top:24px;display:flex;flex-direction:column;align-items:flex-start;width:100%;max-width:100%;'>
        <span style='display:inline-flex;align-items:center;margin-bottom:6px;'>
          <img src='/icons/book-open.svg' alt='Coursework' style='width:20px;height:20px;filter:invert(1);margin-right:6px;'/>
          <span style='font-weight:bold;font-size:1.05rem;color:#fff;'>Coursework</span>
        </span>
        <span style='font-size:1rem;font-weight:normal;margin:2px 0 6px 26px;'>${monthName} <span style='color:#888;'>${mm}/${dd}</span></span>
        <div id='coursework-list-container' style='width:100%;max-width:100%;'></div>
      </div>`;

            // Coursework always uses main TUI selection
      // Function to render the coursework list for a specific class or all classes
      function renderCourseworkList(selectedClass) {
        // Check if assignment-data.js is loaded
        if (typeof window.getAssignmentsForClass !== 'function' && !document.querySelector('script[src="scripts/assignment-data.js"]')) {
          // Load the helper script if not already loaded
          const script = document.createElement('script');
          script.src = 'scripts/assignment-data.js';
          script.onload = () => {
            console.log('Assignment data helper loaded, updating coursework list');
            // Re-render after the script loads
            updateCourseworkFromTuiSelection();
          };
          document.body.appendChild(script);
          return `<ul style='list-style:none;padding:0;margin:0;width:100%;max-width:100%;display:flex;flex-direction:column;gap:0;padding-bottom:18px;overflow:hidden;'>
            <li style='padding:2px 0 2px 0;min-height:1.6em;display:flex;align-items:center;gap:6px;opacity:0.7;'>
              <span style='display:block;width:100%;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'>Loading coursework data...</span>
            </li>
          </ul>`;
        }
        
        // If we have no assignment data, show a message
        if (!window.upcomingAssignmentsByContext || Object.keys(window.upcomingAssignmentsByContext).length === 0) {
          if (typeof window.initAssignmentData === 'function') {
            window.initAssignmentData(); // Initialize with mock data
          } else {
            return `<ul style='list-style:none;padding:0;margin:0;width:100%;max-width:100%;display:flex;flex-direction:column;gap:0;padding-bottom:18px;'>
              <li style='padding:2px 0 2px 0;min-height:1.6em;display:flex;align-items:center;gap:6px;opacity:0.7;'>
                <span style='display:block;width:100%;text-align:left;'>No assignments found</span>
              </li>
            </ul>`;
          }
        }
        
        let assignments = [];
        
        console.log("Rendering coursework for selected class:", selectedClass);
        
        // If class is "To-Do List" or not provided, show all assignments
        if (!selectedClass || selectedClass === "To-Do List") {
          // Use the getAllAssignments helper if available
          if (typeof window.getAllAssignments === 'function') {
            assignments = window.getAllAssignments();
          } else {
            // Fallback to manual collection
            Object.keys(window.upcomingAssignmentsByContext).forEach(className => {
              const classAssignments = window.upcomingAssignmentsByContext[className];
              if (Array.isArray(classAssignments)) {
                classAssignments.forEach(assignment => {
                  assignments.push({
                    ...assignment,
                    class: className
                  });
                });
              }
            });
          }
        } else {
          // Use the getAssignmentsForClass helper if available
          if (typeof window.getAssignmentsForClass === 'function') {
            const classAssignments = window.getAssignmentsForClass(selectedClass);
            assignments = classAssignments.map(assignment => ({
              ...assignment,
              class: selectedClass
            }));
          } else {
            // Fallback to manual mapping with basic class name normalization
            const normalizedClass = selectedClass.toLowerCase();
            // Try to find a matching class
            let foundClass = null;
            Object.keys(window.upcomingAssignmentsByContext).forEach(className => {
              if (className.toLowerCase() === normalizedClass) {
                foundClass = className;
              }
            });
            
            if (foundClass && window.upcomingAssignmentsByContext[foundClass]) {
              assignments = window.upcomingAssignmentsByContext[foundClass].map(assignment => ({
                ...assignment,
                class: foundClass
              }));
            }
          }
        }
        
        console.log(`Found ${assignments.length} assignments for ${selectedClass || 'all classes'}`);
        
        // Sort assignments by due date
        assignments.sort((a, b) => {
          const dateA = new Date(a.due);
          const dateB = new Date(b.due);
          return dateA - dateB;
        });
        
        if (assignments.length === 0) {
          return `<ul style='list-style:none;padding:0;margin:0;width:100%;max-width:100%;display:flex;flex-direction:column;gap:0;padding-bottom:18px;'>
            <li style='padding:2px 0 2px 0;min-height:1.6em;display:flex;align-items:center;gap:6px;opacity:0.7;'>
              <span style='display:block;width:100%;text-align:left;'>No upcoming assignments</span>
            </li>
          </ul>`;
        }
        
        // Build HTML for assignment list
        let html = `<ul style='list-style:none;padding:0;margin:0;width:100%;min-width:180px;display:flex;flex-direction:column;gap:0;padding-bottom:18px;'>`;
        
        assignments.forEach(assignment => {
          const dueDate = new Date(assignment.due);
          const now = new Date();
          
          // Format the date
          const mm = (dueDate.getMonth() + 1).toString().padStart(2, '0');
          const dd = dueDate.getDate().toString().padStart(2, '0');
          const dueStr = `${mm}/${dd}`;
          
          // Extract any class name in brackets from the assignment name
          let displayName = assignment.name;
          let displayClass = assignment.class || '';
          
          // Check if the name already includes a class tag
          const bracketMatch = displayName.match(/\[(.*?)\]$/);
          if (bracketMatch) {
            // Keep the original displayName, class info is already included
          } else if ((!selectedClass || selectedClass === "To-Do List")) {
            // For To-Do List view, show class at the end
            displayClass = assignment.class || '';
          }

          html += `<li style='padding:2px 0 2px 0;min-height:1.6em;display:flex;align-items:center;gap:6px;'>
            <span style='font-family:monospace;min-width:42px;display:inline-block;flex:0 0 auto;'>${dueStr}</span>
            <div style='flex:1 1 auto;width:calc(100% - 48px);text-align:left;overflow:hidden;' class='marquee-container'>
              <div class='marquee-text' id='assignment-${assignments.indexOf(assignment)}'>
                <b title="${displayName}">${displayName}</b>
                ${(!selectedClass || selectedClass === "To-Do List") ? 
                  `<span style='color:#888;font-size:0.9em;margin-left:6px;'>${displayClass}</span>` : ''}
              </div>
            </div>
          </li>`;
        });
        
        html += `</ul>`;
        
                return html;
        
        // Initialize marquee animation after rendering
        setTimeout(() => {
          // Check each assignment text element to see if it needs scrolling
          assignments.forEach((assignment, index) => {
            const element = document.getElementById(`assignment-${index}`);
            if (element) {
              // Check if content width exceeds container width
              const container = element.closest('.marquee-container');
              if (element.scrollWidth > container.clientWidth + 5) { // Add a small buffer
                // Add animation class if content is too wide
                element.classList.add('marquee-animate');
                console.log(`Adding animation to assignment ${index}: "${assignment.name}"`);
              }
            }
          });
        }, 50);
        
        return html;
      }
      
      function updateCourseworkFromTuiSelection() {
        const courseworkListContainer = document.getElementById('coursework-list-container');
        if (!courseworkListContainer) return;
        
        // Find active school menu item
        const activeMenuItem = document.querySelector('.tui-menu li.active');
        const selectedClass = activeMenuItem ? activeMenuItem.querySelector('.school-label')?.textContent?.trim() : null;
        
        console.log("Selected class:", selectedClass);
        console.log("Available assignment contexts:", Object.keys(window.upcomingAssignmentsByContext || {}));
        
        // Update window.selectedClassName for consistency
        window.selectedClassName = selectedClass;
        
        // Skip updating coursework if Dashboard or Canvas is selected
        if (selectedClass === "Dashboard" || selectedClass === "Canvas") {
          courseworkListContainer.innerHTML = `<ul style='list-style:none;padding:0;margin:0;width:100%;max-width:100%;display:flex;flex-direction:column;gap:0;padding-bottom:18px;'>
            <li style='padding:2px 0 2px 0;min-height:1.6em;display:flex;align-items:center;gap:6px;opacity:0.7;'>
              <span style='display:block;width:100%;text-align:left;'>Select a class to view assignments</span>
            </li>
          </ul>`;
          return;
        }
        
        // Render coursework based on selection
        courseworkListContainer.innerHTML = renderCourseworkList(selectedClass);
        
        // No marquee animations needed
      }
      // Add event listeners to schedule list items for selection (only highlight, not coursework)
      setTimeout(() => {
        const scheduleListContainer = document.getElementById('schedule-list-container');
        if (!scheduleListContainer) return;
        const lis = scheduleListContainer.querySelectorAll('li');
        let selectedIdx = getCurrentClassIdx(todaySchedule);
        function updateSelection(newIdx) {
          selectedIdx = newIdx;
          lis.forEach((l, i) => {
            l.classList.toggle('active', i === selectedIdx);
          });
        }
        // Initial highlight
        updateSelection(selectedIdx);
        // Keyboard navigation for schedule list (only highlight)
        scheduleBox.tabIndex = -1; // Prevent automatic focus
        // Do NOT focus the schedule box by default
        scheduleBox.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown') {
            selectedIdx = (selectedIdx + 1) % lis.length;
            updateSelection(selectedIdx);
            e.preventDefault();
          } else if (e.key === 'ArrowUp') {
            selectedIdx = (selectedIdx - 1 + lis.length) % lis.length;
            updateSelection(selectedIdx);
            e.preventDefault();
          }
        });
      }, 0);
    } else {
      scheduleHtml += `<span style='opacity:0.7;min-width:180px;display:inline-block;'>No classes scheduled for today.</span>`;
    }
  scheduleBox.innerHTML = scheduleHtml;
  document.body.appendChild(scheduleBox);
  
  // DEBUG: Print schedule class names and assignment keys for mapping verification (after DOM update)
  if (todaySchedule && todaySchedule.length > 0 && window.upcomingAssignmentsByContext) {
    const scheduleClassNames = todaySchedule.map(item => item.subject);
    const assignmentKeys = Object.keys(window.upcomingAssignmentsByContext);
    console.log('Schedule class names for today:', scheduleClassNames);
    console.log('Keys in upcomingAssignmentsByContext:', assignmentKeys);
  }
  
  // Add window resize handler to keep both windows positioned correctly
  const resizeHandler = () => {
    const mainTui = document.querySelector('.tui-box');
    const scheduleBox = document.getElementById('schedule-box');
    
    if (mainTui && scheduleBox) {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const rect = mainTui.getBoundingClientRect();
      const tuiBoxWidth = rect.width;
      const scheduleBoxWidth = 270; // Known width
      const gap = 30; // Gap between windows
      
      if (windowWidth < 1200) { // Split screen mode
        // Move school menu to left side of screen
        const leftMargin = 40;
        
        // Need to add a style tag with higher specificity to override the !important rules
        if (!document.getElementById('screen-mode-styles')) {
          const styleEl = document.createElement('style');
          styleEl.id = 'screen-mode-styles';
          // Calculate the top position directly instead of using transforms
          const windowHeight = window.innerHeight;
          const menuHeight = mainTui.offsetHeight || 512; // Use a fallback height if not available
          const menuTop = Math.max(10, (windowHeight - menuHeight) / 2);
          
          styleEl.textContent = `
            @media (max-width: 1199px) {
              .tui-box,
              .tui-box.main-menu-window,
              .tui-box.search-window,
              .tui-box.school-window {
                left: ${leftMargin}px !important;
                top: ${menuTop}px !important;
                transform: none !important;
                transition: none !important;
                animation: none !important;
              }
            }
          `;
          document.head.appendChild(styleEl);
        }
        
        // Position schedule window (calculate actual top position instead of using transform)
        const windowHeight = window.innerHeight;
        const scheduleHeight = scheduleBox.offsetHeight || 400; // fallback height
        const scheduleTop = Math.max(10, (windowHeight - scheduleHeight) / 2);
        
        scheduleBox.style.position = 'absolute';
        scheduleBox.style.left = `${leftMargin + tuiBoxWidth + gap}px`;
        scheduleBox.style.top = `${scheduleTop}px`;
        scheduleBox.style.transform = 'none';
        
        console.log("[Schedule Window] Split screen: School left:", leftMargin, 
                   "Schedule left:", leftMargin + tuiBoxWidth + gap, "Top:", scheduleTop);
      } else { // Full screen mode
        // Remove any custom positioning styles
        const styleEl = document.getElementById('screen-mode-styles');
        if (styleEl) {
          styleEl.remove();
        }
        
        // Get position of centered school menu
        const newRect = mainTui.getBoundingClientRect();
        
        // Position schedule to the right with gap (calculate actual top position)
        const windowHeight = window.innerHeight;
        const scheduleHeight = scheduleBox.offsetHeight || 400; // fallback height
        const scheduleTop = Math.max(10, (windowHeight - scheduleHeight) / 2);
        
        scheduleBox.style.position = 'absolute';
        scheduleBox.style.left = `${newRect.right + gap}px`;
        scheduleBox.style.top = `${scheduleTop}px`;
        scheduleBox.style.transform = 'none';
        
        console.log("[Schedule Window] Full screen: Schedule positioned to right of centered school menu");
      }
    }
  };
  
  // Simple window resize handler
  window.addEventListener('resize', resizeHandler);
  // Store the handler for cleanup
  window._scheduleResizeHandler = resizeHandler;
  
  // Run the resize handler immediately to ensure proper positioning
  console.log('[Schedule Window] Running resize handler for positioning');
  resizeHandler();
  
  // Run one more time after DOM is settled
  setTimeout(() => {
    resizeHandler();
    console.log('[Schedule Window] Final resize handler run');
  }, 100);
  }

  // Initialize coursework updates and listeners
  setTimeout(() => {
    updateCourseworkFromTuiSelection();
    // Listen for TUI selection changes
    window.addEventListener('tuiSelectedClassChanged', updateCourseworkFromTuiSelection);
    
    // Ensure window.upcomingAssignmentsByContext is initialized
    if (!window.upcomingAssignmentsByContext) {
      window.upcomingAssignmentsByContext = {
        'Biology': [
          { name: 'Lab Report - Cell Division', due: '2025-09-05' },
          { name: 'Chapter 3 Questions', due: '2025-09-07' }
        ],
        'Math': [
          { name: 'Algebra Homework Set 2', due: '2025-09-04' },
          { name: 'Linear Functions Quiz', due: '2025-09-06' }
        ],
        'History': [
          { name: 'World War II Essay', due: '2025-09-08' },
          { name: 'Chapter 5 Reading', due: '2025-09-03' }
        ],
        'French': [
          { name: 'Conjugation Exercise', due: '2025-09-05' },
          { name: 'Oral Presentation Prep', due: '2025-09-09' }
        ],
        'Music': [
          { name: 'Composition Analysis', due: '2025-09-10' },
          { name: 'Practice Log', due: '2025-09-07' }
        ]
      };
    }
  }, 0);
}
// Simple debug function to check script loading status
function checkScriptStatus() {
  console.log("===== SCHEDULE WINDOW DEBUG =====");
  console.log("showScheduleBox function exists:", typeof showScheduleBox === 'function');
  console.log("schedule-window.js script element:", !!document.querySelector('script[src="/scripts/schedule-window.js"]'));
  console.log("assignment-data.js script element:", !!document.querySelector('script[src="/scripts/assignment-data.js"]'));
  console.log("upcomingAssignmentsByContext exists:", !!window.upcomingAssignmentsByContext);
  console.log("=================================");
}

// Function removed as part of simplification

// Export functions to window
window.showScheduleBox = showScheduleBox;
window.checkScriptStatus = checkScriptStatus;

// Run simple diagnostic check
setTimeout(() => {
  checkScriptStatus();
}, 500);
