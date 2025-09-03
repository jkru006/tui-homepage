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
			icon: 'https://www.svgrepo.com/show/501492/canvas-logo.svg',
		},
		{
			label: 'To-Do List',
			url: '',  // Empty URL so it doesn't navigate
			icon: 'https://cdn.jsdelivr.net/gh/feathericons/feather/icons/check-square.svg',
		},
	];

	// Remove old event handlers and focusability
	tuiBox.removeEventListener('keydown', window._schoolWindowKeyHandler);
	window._schoolWindowKeyHandler = null;
	tuiBox.removeAttribute('tabindex');
	
	// Build list HTML styled like the main menu
	tuiBox.classList.add('school-window');
	tuiBox.setAttribute('tabindex', '0');
	tuiBox.innerHTML = `
		<div style="width:520px;position:relative;">
			<div style="position:relative;width:100%;height:24px;">
				<div class="corner corner-tl"></div>
				<div class="corner corner-tr"></div>
				<span style="position:absolute;top:-13px;left:26px;font-size:1.1rem;font-weight:bold;letter-spacing:0.1em;color:#fff;white-space:nowrap;background:#000;padding:0 8px;z-index:2;">School</span>
				<div style="position:absolute;top:0;left:0;width:100%;height:0;border-top:2px solid #fff;z-index:1;"></div>
			</div>
			<div style="position:relative;box-sizing:border-box;border-left:3px solid #fff;border-right:3px solid #fff;border-bottom:3px solid #fff;border-top:none;padding:16px 48px;background:#000;width:520px;min-width:520px;max-width:520px;min-height:188px;display:flex;flex-direction:column;align-items:center;justify-content:center;margin-top:0;">
				<div style="width:100%;text-align:center;color:#fff;font-size:1rem;margin-bottom:12px;">Use ↑ ↓ to navigate, Enter to open</div>
				<ul class="tui-menu" style="width:100%;margin:0 auto;">
					${subjects.map((s, i) => `
						<li class="school-list-item${i === 0 ? ' active' : ''}" tabindex="0" data-url="${s.url}" title="${s.label}">
							<span class="icon-bracket"><img src="${s.icon}" alt="${s.label}" class="school-icon" /></span> <span class="menu-label school-label">${s.label}</span>
						</li>
					`).join('')}
				</ul>
			</div>
		</div>
	`;
	console.log("[School Window] Added school menu HTML");
	
	// Focus the tuiBox immediately
	tuiBox.focus();
	console.log("[School Window] Focused tuiBox");

	setTimeout(() => {
		const items = Array.from(document.querySelectorAll('.school-list-item'));
		let current = 0;
		
		// --- Schedule-based selection logic ---
		try {
			// Get today's schedule and current/next class from external JSON
			const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
			const now = new Date();
			const dayName = days[now.getDay()];
			let todaySchedule = null;
			const req = new XMLHttpRequest();
			req.open('GET', '/schedule-data.json', false); // sync
			req.send(null);
			if (req.status === 200) {
				console.log("[School Window] Loaded schedule data");
				const scheduleData = JSON.parse(req.responseText);
				todaySchedule = scheduleData[dayName];
			} else {
				console.error("[School Window] Failed to load schedule data:", req.status);
			}
			
			function getCurrentClassIdx(schedule) {
				if (!schedule) return -1;
				const nowMinutes = now.getHours() * 60 + now.getMinutes();
				for (let i = 0; i < schedule.length; i++) {
					const [start, end] = schedule[i].time.split('-');
					function parseTime(t) {
						let [h, m] = t.match(/\\d+/g).map(Number);
						let pm = t.toLowerCase().includes('pm');
						if (h === 12) pm = false;
						if (!pm && t.toLowerCase().includes('am')) pm = false;
						if (pm && h < 12) h += 12;
						return h * 60 + m;
					}
					const startM = parseTime(start);
					const endM = parseTime(end);
					if (nowMinutes >= startM && nowMinutes < endM) return i;
				}
				return -1;
			}
			
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
						'to-do list': 'to-do list',
						'todo': 'to-do list',
						'to do': 'to-do list',
						'search': 'search',
						'music': 'music',
						'french': 'french',
						'french 2 semester 2': 'french',
						'united states history semester 2': 'history',
						'homework cafe': 'to-do list',
						'wellbeing: music': 'music',
						'biology': 'biology',
						'dashboard': 'dashboard',
						'canvas': 'canvas'
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
				const icon = item.querySelector('.icon-bracket img');
				if (i === idx) {
					item.classList.add('active');
					item.style.background = '#fff';
					item.style.color = '#000';
					item.querySelector('.menu-label').style.color = '#000';
					if (icon) icon.style.filter = 'invert(0)';
					// Emit event for selection change
					const label = item.querySelector('.school-label')?.textContent?.trim();
					window.selectedClassName = label;
					window.dispatchEvent(new CustomEvent('tuiSelectedClassChanged', { detail: { className: label } }));
				} else {
					item.classList.remove('active');
					item.style.background = 'none';
					item.style.color = '#fff';
					item.querySelector('.menu-label').style.color = '#fff';
					if (icon) icon.style.filter = 'invert(1)';
				}
				// Ensure icon is always visible
				if (icon) {
					icon.style.display = 'inline';
					icon.style.visibility = 'visible';
					icon.style.opacity = '1';
				}
			});
			// Update status bar
			if (statusBar && items[idx]) {
				const label = items[idx].querySelector('.school-label')?.textContent?.trim();
				if (label === 'To-Do List') {
					statusBar.textContent = 'http://localhost:8080/tui-start.html/to-do';
				} else {
					statusBar.textContent = items[idx].getAttribute('data-url') || '';
				}
			}
		}
		
		updateActive(current);
		
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
					tuiBox.innerHTML = originalHTML;
					tuiBox.classList.remove('school-window');
					tuiBox.style.width = '';
					tuiBox.style.height = '';
					
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
				document.querySelectorAll('.schedule-box').forEach(box => box.remove());
				const scheduleBox = document.getElementById('schedule-box');
				if (scheduleBox) scheduleBox.remove();
				
				// Clean up any dynamically added scripts
				const todoScript = document.querySelector('script[src="scripts/to-do.js"]');
				if (todoScript) todoScript.remove();
				
				tuiBox.innerHTML = originalHTML;
				tuiBox.classList.remove('school-window');
				tuiBox.style.width = '';
				tuiBox.style.height = '';
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
		if (typeof window.showScheduleBox === 'function') {
			console.log("[School Window] Using existing showScheduleBox");
			window.showScheduleBox();
		} else {
			// Load the schedule-window.js script first
			console.log("[School Window] Loading schedule-window.js");
			const script = document.createElement('script');
			script.src = '/scripts/schedule-window.js';
			script.onload = function() {
				console.log("[School Window] schedule-window.js loaded");
				if (typeof window.showScheduleBox === 'function') {
					console.log("[School Window] Calling showScheduleBox");
					window.showScheduleBox();
				} else {
					console.error('[School Window] showScheduleBox function not found after loading script');
				}
			};
			script.onerror = function(e) {
				console.error('[School Window] Error loading schedule-window.js:', e);
			};
			document.body.appendChild(script);
		}
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
