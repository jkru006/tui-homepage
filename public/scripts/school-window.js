function openSchoolWindow() {
	console.log("[School Window] Opening school window...");
	const tuiBox = document.querySelector('.tui-box');
	console.log("[School Window] Found tuiBox:", tuiBox);
	
	// Always remove .school-window and reset box before opening
	tuiBox.classList.remove('school-window');
	tuiBox.style.width = '';
	tuiBox.style.height = '';
	
	// Save the main menu HTML for restoration
	const originalHTML = window._originalTuiBoxHTML || tuiBox.innerHTML;
	console.log("[School Window] Saved original HTML");
	
	// Define subjects for the school menu
	const subjects = [
		{
			label: 'Biology',
			url: 'https://fusionacademy.zoom.us/my/lhamp',
			icon: '/icons/biology.svg',
		},
		{
			label: 'Math',
			url: 'https://fusionacademy.zoom.us/j/8480210733',
			icon: '/icons/math.svg',
		},
		{
			label: 'History',
			url: 'https://fusionacademy.zoom.us/j/2777856268',
			icon: '/icons/history.svg',
		},
		{
			label: 'French',
			url: 'https://fusionacademy.zoom.us/j/8727206987',
			icon: '/icons/french.svg',
		},
		{
			label: 'Music',
			url: 'https://fusionacademy.zoom.us/j/8377168803',
			icon: '/icons/music.svg',
		},
		{
			label: 'Dashboard',
			url: 'https://student.fusionacademy.com/app/dashboard',
			icon: '/icons/dashboard.svg',
		},
		{
			label: 'Canvas',
			url: 'https://fusion.instructure.com/',
			icon: '/icons/canvas-logo.svg',
		},
		{
			label: 'To-Do List',
			url: '',  // Empty URL so it doesn't navigate
			icon: '/icons/check-square.svg',
		}
	];

	// Schedule logic - load today's schedule
	const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	const now = new Date();
	const dayName = days[now.getDay()];
	let todaySchedule = null;
	
	try {
		const req = new XMLHttpRequest();
		req.open('GET', '/config/schedule-config.json', false); // sync
		req.send(null);
		if (req.status === 200) {
			console.log("[School Window] Loaded schedule data");
			const scheduleData = JSON.parse(req.responseText);
			todaySchedule = scheduleData[dayName];
		} else {
			console.error("[School Window] Failed to load schedule data:", req.status);
		}
	} catch (e) {
		console.error("[School Window] Error loading schedule data:", e);
	}

	// Function to get current class index based on time
	function getCurrentClassIdx(schedule) {
		if (!schedule) return -1;
		const nowMinutes = now.getHours() * 60 + now.getMinutes();
		let lastIdx = -1;
		let firstClassIdx = -1;
		let firstClassStart = Infinity;
		
		console.log("[School Window] Getting current class. Current time in minutes:", nowMinutes, "Hour:", now.getHours());
		
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
			
			// Track the first class of the day (skip lunch periods)
			if (startM < firstClassStart && !schedule[i].subject.toLowerCase().includes('lunch')) {
				firstClassStart = startM;
				firstClassIdx = i;
				console.log("[School Window] Found first class of day:", schedule[i].subject, "at index", i, "starting at", startM);
			}
			
			// Check if we're currently in this class's time period
			if (nowMinutes >= startM && nowMinutes < endM) {
				console.log("[School Window] Currently in class period:", schedule[i].subject);
				return i;
			}
			
			if (nowMinutes >= startM) {
				lastIdx = i;
			}
		}
		
		// Early morning hours (before 7 AM) or before first class or late night (after 8 PM), select first class
		const earlyMorningHours = now.getHours() < 7;
		const beforeFirstClass = firstClassIdx !== -1 && nowMinutes < firstClassStart;
		const lateNightHours = now.getHours() >= 20; // After 8 PM
		
		if (earlyMorningHours || beforeFirstClass || lateNightHours) {
			if (firstClassIdx !== -1) {
				console.log("[School Window] Before school hours or late night, selecting first class of day at index:", firstClassIdx, 
					"which is", schedule[firstClassIdx].subject);
				return firstClassIdx;
			}
		}
		
		// If classes are over, select last period
		console.log("[School Window] After school hours, selecting last period at index:", lastIdx);
		return lastIdx;
	}

	// Create school menu UI
	setTimeout(() => {
		// Save original HTML for restoration
		window._originalTuiBoxHTML = originalHTML;
		
		// Create the school menu
		tuiBox.classList.add('school-window');
		tuiBox.style.width = '';
		tuiBox.style.height = '';
		
		// Check if we're in fullscreen mode or split-screen mode
		const windowWidth = window.innerWidth;
		const tuiBoxWidth = 520; // Known width of the TUI box
		const scheduleBoxWidth = 270; // Known width of schedule box
		const gap = 12; // Gap between the two windows
		const totalWidth = tuiBoxWidth + scheduleBoxWidth + gap;
		const isFullScreen = windowWidth > 1200; // Threshold for "full screen"
		
		// In fullscreen mode, don't modify position - let the menu be centered normally
		// In split-screen mode, position the window for centering both elements
		if (!isFullScreen) {
			const leftPosition = Math.max(0, (windowWidth - totalWidth) / 2);
			
			tuiBox.style.position = 'fixed'; // Changed to fixed for more reliable positioning
			tuiBox.style.left = `${leftPosition}px`;
			tuiBox.style.margin = '0';
			tuiBox.style.zIndex = '9997'; // Lower than schedule window
			tuiBox.style.transition = 'left 0.2s ease-out, top 0.2s ease-out'; // Smooth transitions
			tuiBox.style.transform = 'translateZ(0)'; // Create stacking context
			
			// Vertically center
			const windowHeight = window.innerHeight;
			const boxHeight = tuiBox.clientHeight || 400;
			tuiBox.style.top = `${Math.max(10, (windowHeight - boxHeight) / 2)}px`;
			
			console.log("[School Window] Split-screen mode, centering both windows. Left:", leftPosition);
		} else {
			console.log("[School Window] Fullscreen mode, keeping default centered position");
			tuiBox.style.position = '';
			tuiBox.style.left = '';
			tuiBox.style.margin = '';
			tuiBox.style.zIndex = '';
			tuiBox.style.transform = '';
			tuiBox.style.top = '';
		}
		
		let html = `
			<div style="position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0;height:100%;min-height:100%;">
				<div style="width:520px;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;">
					<div style="position:relative;width:100%;height:0;">
						<div style="position:absolute;top:0;left:0;width:18px;height:18px;border-left:3px solid #fff;border-top:3px solid #fff;"></div>
						<span style="position:absolute;top:-13px;left:26px;font-size:1.1rem;font-weight:bold;letter-spacing:0.1em;color:#fff;white-space:nowrap;background:#000;padding:0 8px;z-index:2;">School Menu</span>
						<div style="position:absolute;top:0;left:0;width:100%;height:0;border-top:2px solid #fff;z-index:1;"></div>
					</div>
					<div style="box-sizing:border-box;border-left:3px solid #fff;border-right:3px solid #fff;border-bottom:3px solid #fff;border-top:none;border-radius:0;padding:16px 48px 16px 48px;background:#000;width:520px;min-width:520px;max-width:520px;min-height:188px;display:flex;flex-direction:column;align-items:center;justify-content:center;margin-top:0;">
						<div style="width:100%;text-align:center;color:#fff;font-size:1rem;margin-bottom:12px;">Use ↑ ↓ to navigate, Enter to open</div>
						<ul class="tui-menu">
		`;
		
		subjects.forEach(subject => {
			html += `<li data-url="${subject.url}"><span class="icon-bracket"><img src="${subject.icon}" alt=""></span> <span class="menu-label"><span class="school-label">${subject.label}</span></span></li>`;
		});
		
		html += `
						</ul>
					</div>
				</div>
			</div>
		`;
		
		tuiBox.innerHTML = html;
		
		const menu = document.querySelector('.tui-menu');
		const items = Array.from(menu.querySelectorAll('li'));
		let current = 0; // Default to first item
		
		try {
			// Find current class if available
			let idx = getCurrentClassIdx(todaySchedule);
			console.log("[School Window] Current class index:", idx);
			
			// If current is Lunch or no current, select next class
			if (todaySchedule && todaySchedule.length > 0) {
				if (idx === -1 || (todaySchedule[idx] && todaySchedule[idx].subject.toLowerCase().includes('lunch'))) {
					// Find next non-lunch class
					let nextIdx = (idx === -1) ? 0 : idx + 1;
					while (nextIdx < todaySchedule.length && todaySchedule[nextIdx].subject.toLowerCase().includes('lunch')) {
						nextIdx++;
					}
					idx = nextIdx < todaySchedule.length ? nextIdx : -1;
				}
				
				if (idx !== -1) {
					// Map subject to menu item (case-insensitive, partial match ok)
					const label = todaySchedule[idx].subject;
					console.log("[School Window] Looking for subject:", label);
					const subjectAliases = {
						'hc': 'math',
						'life skills': 'history',
						'business math': 'math',
						'us history': 'history',
						'united states history': 'history',
						'to-do list': 'to-do list',
						'todo': 'to-do list',
						'to do': 'to-do list',
						'search': 'search',
						'music': 'music',
						'french': 'french',
						'french 2': 'french',
						'french 2 semester 2': 'french',
						'united states history semester 2': 'history',
						'homework cafe': 'to-do list',
						'wellbeing: music': 'music',
						'biology': 'biology',
						'dashboard': 'dashboard',
						'canvas': 'canvas',
						// Add expanded mappings for subjects
						'mathematics': 'math',
						'business mathematics': 'math',
						'cafe': 'to-do list',
						'study': 'to-do list',
						'study hall': 'to-do list'
					};
					
					let searchLabel = label.trim().toLowerCase();
					let menuLabel = null;
					
					if (subjectAliases[searchLabel]) {
						menuLabel = subjectAliases[searchLabel];
					} else {
						let firstWord = searchLabel.split(' ')[0];
						menuLabel = subjectAliases[firstWord] || searchLabel;
					}
					
					// Find the menu item that matches
					let found = items.findIndex(item => {
						const boxLabel = item.querySelector('.school-label')?.textContent?.trim().toLowerCase() || '';
						if (boxLabel === menuLabel) return true;
						if (menuLabel === 'to-do list' && boxLabel.includes('to-do')) return true;
						if (menuLabel === 'search' && boxLabel.includes('search')) return true;
						return false;
					});
					
					if (found !== -1) {
						current = found;
						console.log("[School Window] Found matching menu item:", found);
					}
				}
			}
		} catch (e) { 
			console.error("[School Window] Schedule selection error:", e);
		}
		
		function updateActive(idx) {
			console.log("[School Window] Updating active item:", idx);
			const statusBar = document.getElementById('status-bar');
			items.forEach((item, i) => {
				// Toggle active class which handles all styling through CSS
				item.classList.toggle('active', i === idx);
				
				// If this is the active item, emit the event for selection change
				if (i === idx) {
					const label = item.querySelector('.school-label')?.textContent?.trim();
					window.selectedClassName = label;
					// Dispatch event to notify schedule window about selection change
					window.dispatchEvent(new CustomEvent('tuiSelectedClassChanged', { detail: { className: label } }));
				}
			});
			
			// Make active item scroll into view if needed
			if (idx < items.length) {
				items[idx].scrollIntoView({ block: 'nearest' });
			}
			
			// Update status bar
			if (statusBar && items[idx]) {
				const label = items[idx].querySelector('.school-label')?.textContent?.trim();
				if (label === 'To-Do List') {
					const currentUrl = window.location.href.split('?')[0].split('#')[0];
					statusBar.textContent = currentUrl + 'to-do';
				} else {
					statusBar.textContent = items[idx].getAttribute('data-url') || '';
				}
			}
		}
		
		// Set up focus handling like the main menu
		function ensureFocus() {
			if (document.activeElement !== tuiBox) {
				tuiBox.focus();
			}
		}
		
		tuiBox.setAttribute('tabindex', '0');
		ensureFocus();
		updateActive(current);
		
		// Add blur event to maintain focus
		tuiBox.addEventListener('blur', ensureFocus);
		
		function handleKey(e) {
			console.log("[School Window] Key pressed:", e.key);
			if (e.key === 'ArrowDown') {
				current = (current + 1) % items.length;
				updateActive(current);
				
				// Update coursework when selection changes
				const selectedItem = items[current];
				const label = selectedItem.querySelector('.school-label')?.textContent?.trim();
				window.selectedClassName = label;
				window.dispatchEvent(new CustomEvent('tuiSelectedClassChanged', { detail: { className: label } }));
				
				e.preventDefault();
			} else if (e.key === 'ArrowUp') {
				current = (current - 1 + items.length) % items.length;
				updateActive(current);
				
				// Update coursework when selection changes
				const selectedItem = items[current];
				const label = selectedItem.querySelector('.school-label')?.textContent?.trim();
				window.selectedClassName = label;
				window.dispatchEvent(new CustomEvent('tuiSelectedClassChanged', { detail: { className: label } }));
				
				e.preventDefault();
			} else if (e.key === 'Enter') {
				e.preventDefault(); // Always prevent default first
				
				// Get label first since we need it for both cases
				const label = items[current].querySelector('.school-label')?.textContent?.trim();
				console.log("[School Window] Enter pressed on:", label);
				
				// Handle To-Do List separately to prevent any URL navigation
				if (label === 'To-Do List') {
					// Clean up schedule box
					document.querySelectorAll('.schedule-box').forEach(box => box.remove());
					
					// Clean up school window before opening to-do
					// Clean up any custom positioning styles
					const styleEl = document.getElementById('screen-mode-styles');
					if (styleEl) {
						styleEl.remove();
						console.log('[School Window] Removed custom positioning styles before To-Do');
					}
					
					tuiBox.innerHTML = originalHTML;
					tuiBox.classList.remove('school-window');
					tuiBox.style = ''; // Reset all styles at once
					
					// Remove the handler first to prevent any race conditions
					document.removeEventListener('keydown', handleKey);
					window._schoolWindowKeyHandler = null;
					
					// Open to-do window or load it first
					if (typeof openToDoWindow === 'function') {
						openToDoWindow();
					} else {
						const script = document.createElement('script');
						script.src = '/scripts/to-do.js';
						script.onload = function() {
							if (typeof openToDoWindow === 'function') {
								openToDoWindow();
							}
						};
						document.body.appendChild(script);
					}
					return; // Exit early to prevent any URL navigation
				}
				
				// Handle regular URL navigation for other items
				const url = items[current].getAttribute('data-url');
				if (url) {
					window.location.href = url;
				}
			} else if (e.key === 'Escape') {
				console.log("[School Window] Escape pressed");
				// Clean up schedule box and any related elements
				// Clean up any existing schedule boxes
				document.querySelectorAll('.schedule-box, .schedule-tui-box').forEach(box => box.remove());
				const scheduleBox = document.getElementById('schedule-box');
				if (scheduleBox) scheduleBox.remove();
				console.log('[School Window] Cleaned up schedule boxes');
				
				// Clean up any dynamically added scripts
				const todoScript = document.querySelector('script[src="/scripts/to-do.js"]');
				if (todoScript) todoScript.remove();
				
				// Clean up any resize handlers
				if (window._scheduleResizeHandler) {
					window.removeEventListener('resize', window._scheduleResizeHandler);
					window._scheduleResizeHandler = null;
					console.log('[School Window] Removed resize handler');
				}
				
				// Clean up any custom positioning styles
				const styleEl = document.getElementById('screen-mode-styles');
				if (styleEl) {
					styleEl.remove();
					console.log('[School Window] Removed custom positioning styles');
				}
				
				tuiBox.innerHTML = originalHTML;
				tuiBox.classList.remove('school-window');
				tuiBox.style = ''; // Reset all styles at once
				console.log('[School Window] Reset all styles on main menu');
				document.removeEventListener('keydown', handleKey);
				if (typeof tuiMenuInit === 'function') tuiMenuInit();
			}
		}
		
		// Store the handler so it can be removed by other windows (e.g., To-Do)
		if (window._schoolWindowKeyHandler) {
			document.removeEventListener('keydown', window._schoolWindowKeyHandler);
		}
		window._schoolWindowKeyHandler = handleKey;
		document.addEventListener('keydown', handleKey);
	}, 0);

	// Show schedule box
	try {
		// Force reload of schedule-window.js to ensure we get a fresh copy
		console.log("[School Window] Ensuring schedule-window.js is loaded");
		
		// Remove any existing schedule script first to force a clean reload
		const existingScript = document.querySelector('script[src="/scripts/schedule-window.js"]');
		if (existingScript) {
			console.log("[School Window] Removing existing schedule script for clean reload");
			existingScript.remove();
		}
		
		// Now load the script fresh
		const script = document.createElement('script');
		script.src = '/scripts/schedule-window.js';
		script.onload = function() {
			console.log("[School Window] schedule-window.js loaded successfully");
			if (typeof window.showScheduleBox === 'function') {
				console.log("[School Window] Calling showScheduleBox");
				setTimeout(() => {
					window.showScheduleBox();
				}, 100); // Short delay to ensure DOM is ready
			} else {
				console.error('[School Window] showScheduleBox function not found after loading script');
			}
		};
		script.onerror = function(e) {
			console.error('[School Window] Error loading schedule-window.js:', e);
		};
		document.body.appendChild(script);
	} catch (e) {
		console.error('[School Window] Error in schedule box initialization:', e);
	}
}

window.openSchoolWindow = openSchoolWindow;

// Utility for other windows to remove the school window key handler
window.removeSchoolWindowKeyHandler = function() {
	if (window._schoolWindowKeyHandler) {
		document.removeEventListener('keydown', window._schoolWindowKeyHandler);
		window._schoolWindowKeyHandler = null;
	}
};
