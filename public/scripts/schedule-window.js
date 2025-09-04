// scripts/schedule-window.js
// Renders the schedule popup for the School menu

// Initialize assignments structure if it doesn't exist
if (!window.upcomingAssignmentsByContext) {
  window.upcomingAssignmentsByContext = {
    'Biology': [
      { name: 'Lab Report - Cell Division', due: '2025-09-05' },
      { name: 'Chapter 3 Questions', due: '2025-09-07' }
    ],
    'Mathematics': [
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
    ]
  };
}

console.log("[Schedule Window] Loaded schedule-window.js");

async function showScheduleBox() {
  console.log("[Schedule Box] Opening schedule box");
  // ...existing code...
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
      if (nowMinutes >= startM && nowMinutes < endM) return i;
      if (nowMinutes >= startM) lastIdx = i;
    }
    // If classes are over, return the last period
    return lastIdx;
  }
  let scheduleBox = document.getElementById('schedule-box');
  if (!scheduleBox) {
    scheduleBox = document.createElement('div');
    scheduleBox.id = 'schedule-box';
    scheduleBox.className = 'schedule-tui-box';
    // Find the main TUI window (assume it has class 'tui-box' and is the main one)
    const mainTui = document.querySelector('.tui-box');
    let left = 600, top = 0, height = 'auto';
    if (mainTui) {
      const rect = mainTui.getBoundingClientRect();
      left = rect.right + 12 + window.scrollX;
      top = rect.top + window.scrollY;
      height = rect.height + 'px';
    }
    scheduleBox.style = [
      'position:absolute',
      `top:${top}px`,
      `left:${left}px`,
  'width:270px',
  'min-width:270px',
  'max-width:270px',
      `height:${height}`,
      'z-index:9999',
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
      'overflow:auto',
      'box-sizing:border-box'
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
      if (currentIdx === -1) {
        // Try to find Biology as fallback, but don't force it if there's no Biology class today
        const biologyIdx = todaySchedule.findIndex(item => item.subject.trim().toLowerCase() === 'biology');
        if (biologyIdx !== -1) {
          currentIdx = biologyIdx;
        } else if (todaySchedule.length > 0) {
          // If no Biology and no current class found, use the last non-lunch class
          for (let i = todaySchedule.length - 1; i >= 0; i--) {
            if (!todaySchedule[i].subject.toLowerCase().includes('lunch')) {
              currentIdx = i;
              break;
            }
          }
        }
      }
      // Render schedule list with selection
      scheduleHtml += `<div id='schedule-list-container'>` + renderList(todaySchedule, currentIdx) + `</div>`;
      // Coursework section
      scheduleHtml += `<div style='margin-top:24px;display:flex;flex-direction:column;align-items:flex-start;min-width:120px;'>
        <span style='display:inline-flex;align-items:center;'>
          <img src='/icons/book-open.svg' alt='Coursework' style='width:20px;height:20px;filter:invert(1);margin-right:6px;'/>
          <span style='font-weight:bold;font-size:1.05rem;'>Coursework</span>
        </span>
        <span style='font-size:1rem;font-weight:normal;margin:2px 0 0 26px;'>${monthName} <span style='color:#888;'>${mm}/${dd}</span></span>
        <div id='coursework-list-container'></div>
      </div>`;

            // Coursework always uses main TUI selection
      function updateCourseworkFromTuiSelection() {
        const courseworkListContainer = document.getElementById('coursework-list-container');
        // Find active school menu item
        const activeMenuItem = document.querySelector('.school-list-item.active');
        const selectedClass = activeMenuItem ? activeMenuItem.querySelector('.school-label')?.textContent?.trim() : null;
        
        // Update window.selectedClassName for consistency
        window.selectedClassName = selectedClass;
        
        // Only show assignments if selectedClass is a valid class name
        const validClasses = window.upcomingAssignmentsByContext ? Object.keys(window.upcomingAssignmentsByContext) : [];
        if (courseworkListContainer && selectedClass && validClasses.includes(selectedClass)) {
          courseworkListContainer.innerHTML = renderCourseworkList(selectedClass);
        } else if (courseworkListContainer) {
          courseworkListContainer.innerHTML = `<ul style='list-style:none;padding:0;margin:0;width:100%;min-width:180px;display:flex;flex-direction:column;gap:0;padding-bottom:18px;'><li style='padding:2px 0 2px 0;min-height:1.6em;display:flex;align-items:center;gap:6px;opacity:0.7;'><span style='flex:1;text-align:left;'>Select a class in the main menu to view assignments.</span></li></ul>`;
        }
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
    scheduleClassNames.forEach(cls => {
      console.log(`Assignments for class '${cls}':`, window.upcomingAssignmentsByContext[cls]);
    });
  }
  }

  // Initialize coursework updates and listeners
  setTimeout(() => {
    updateCourseworkFromTuiSelection();
    // Listen for TUI selection changes
    window.addEventListener('tuiSelectedClassChanged', updateCourseworkFromTuiSelection);
  }, 0);
}
window.showScheduleBox = showScheduleBox;
