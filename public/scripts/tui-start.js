function tuiMenuInit() {
	let tuiBox = document.querySelector('.tui-box');
	// Remove all keydown listeners and replace tuiBox with a clone for a clean state
	const tuiBoxClone = tuiBox.cloneNode(true);
	tuiBox.parentNode.replaceChild(tuiBoxClone, tuiBox);
	tuiBox = document.querySelector('.tui-box');
	// Add main-menu-window class for consistent sizing
	tuiBox.className = 'tui-box main-menu-window';
		tuiBox.innerHTML = `
			<div style="position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0;height:100%;min-height:100%;">
				<div style="width:520px;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;">
					<div style="position:relative;width:100%;height:0;">
						<div style="position:absolute;top:0;left:0;width:18px;height:18px;border-left:3px solid #fff;border-top:3px solid #fff;"></div>
						<span style="position:absolute;top:-13px;left:26px;font-size:1.1rem;font-weight:bold;letter-spacing:0.1em;color:#fff;white-space:nowrap;background:#000;padding:0 8px;z-index:2;">Main Menu</span>
						<div style="position:absolute;top:0;left:0;width:100%;height:0;border-top:2px solid #fff;z-index:1;"></div>
					</div>
					<div style="box-sizing:border-box;border-left:3px solid #fff;border-right:3px solid #fff;border-bottom:3px solid #fff;border-top:none;border-radius:0;padding:16px 48px 16px 48px;background:#000;width:520px;min-width:520px;max-width:520px;min-height:188px;display:flex;flex-direction:column;align-items:center;justify-content:center;margin-top:0;">
						<div style="width:100%;text-align:center;color:#fff;font-size:1rem;margin-bottom:12px;">Use ↑ ↓ to navigate, Enter to open</div>
										<ul class="tui-menu">
							<li class="active"><span class="icon-bracket"><img src="/icons/search.svg" alt="Search"/></span> <span class="menu-label">Search</span></li>
							<li data-url="https://www.instagram.com/direct/inbox/"><span class="icon-bracket"><img src="/icons/instagram.svg" alt="Instagram"/></span> <span class="menu-label">Instagram</span></li>
							<li data-url="https://chat.openai.com"><span class="icon-bracket"><img src="/icons/openai.svg" alt="ChatGPT"/></span> <span class="menu-label">ChatGPT</span></li>
							<li data-url="https://www.youtube.com"><span class="icon-bracket"><img src="/icons/youtube.svg" alt="YouTube"/></span> <span class="menu-label">YouTube</span></li>
							<li data-url="https://mail.google.com"><span class="icon-bracket"><img src="/icons/gmail.svg" alt="Gmail"/></span> <span class="menu-label">Gmail</span></li>
							<li data-url="https://www.tiktok.com"><span class="icon-bracket"><img src="/icons/tiktok.svg" alt="TikTok"/></span> <span class="menu-label">TikTok</span></li>
							<li data-url="https://www.reddit.com"><span class="icon-bracket"><img src="/icons/reddit.svg" alt="Reddit"/></span> <span class="menu-label">Reddit</span></li>
							<li><span class="icon-bracket"><img src="/icons/book.svg" alt="School"/></span> <span class="menu-label">School</span></li>
						</ul>
					</div>
				</div>
			</div>
		`;
	const menu = document.querySelector('.tui-menu');
	const items = Array.from(menu.querySelectorAll('li'));
	if (typeof window._tuiCurrentIdx !== 'number') window._tuiCurrentIdx = 0;
	let current = window._tuiCurrentIdx;
	const statusBar = document.getElementById('status-bar');

	function updateActive(idx) {
		items.forEach((li, i) => {
			li.classList.toggle('active', i === idx);
		});
		if (idx < items.length) {
			items[idx].scrollIntoView({ block: 'nearest' });
			const label = items[idx].querySelector('.menu-label')?.textContent?.trim();
			// Always remove the schedule box if it exists
			let scheduleBox = document.getElementById('schedule-box');
			if (scheduleBox) scheduleBox.remove();
			if (label === 'Search') {
				const currentUrl = window.location.href.split('?')[0].split('#')[0];
				statusBar.textContent = currentUrl + 'Search';
			} else if (label === 'School') {
				const currentUrl = window.location.href.split('?')[0].split('#')[0];
				statusBar.textContent = currentUrl + 'School';
			} else if (label === 'Instagram') {
				statusBar.textContent = 'https://www.instagram.com/direct/inbox';
			} else {
				const url = items[idx].dataset.url || '';
				statusBar.textContent = url;
			}
			// Only set selected class name if label matches a class in schedule-data.json
			let validClasses = window._validClassNames || [];
			if (validClasses.includes(label)) {
				window.selectedClassName = label;
				window.dispatchEvent(new CustomEvent('tuiSelectedClassChanged', { detail: { className: label } }));
			} else {
				window.selectedClassName = null;
				window.dispatchEvent(new CustomEvent('tuiSelectedClassChanged', { detail: { className: null } }));
			}
		}
		window._tuiCurrentIdx = idx;
	}

	function openCurrent() {
		// Replace tuiBox with a clone to remove all event listeners and state
		const oldTuiBox = document.querySelector('.tui-box');
		const tuiBoxClone = oldTuiBox.cloneNode(true);
		oldTuiBox.parentNode.replaceChild(tuiBoxClone, oldTuiBox);
		if (current < items.length) {
			const url = items[current].dataset.url;
			const label = items[current].querySelector('.menu-label')?.textContent?.trim();
			// Always remove the schedule box if it exists
			let scheduleBox = document.getElementById('schedule-box');
			if (scheduleBox) scheduleBox.remove();
			if (label === 'Search') {
				var script = document.createElement('script');
				script.src = 'scripts/search-window.js';
				script.onload = function() {
					if (typeof openSearchWindow === 'function') openSearchWindow();
				};
				document.body.appendChild(script);
				return;
			}
			if (label === 'School') {
				// Load both scripts in the correct order with proper error handling
				console.log("[TUI Start] Preparing to open School window");
				
				// Load assignment-data.js first
				var assignmentScript = document.createElement('script');
				assignmentScript.src = 'scripts/assignment-data.js';
				assignmentScript.onload = function() {
					console.log("[TUI Start] Assignment data loaded");
					
					// Then load schedule-window.js
					var scheduleScript = document.createElement('script');
					scheduleScript.src = 'scripts/schedule-window.js';
					scheduleScript.onload = function() {
						console.log("[TUI Start] Schedule window script loaded");
						
						// Finally load and initialize school window
						var schoolScript = document.createElement('script');
						schoolScript.src = 'scripts/school-window.js';
						schoolScript.onload = function() {
							console.log("[TUI Start] School window script loaded");
							if (typeof openSchoolWindow === 'function') {
								console.log("[TUI Start] Opening school window");
								openSchoolWindow();
							} else {
								console.error("[TUI Start] openSchoolWindow function not found!");
							}
						};
						schoolScript.onerror = function(e) {
							console.error("[TUI Start] Failed to load school-window.js:", e);
						};
						document.body.appendChild(schoolScript);
					};
					scheduleScript.onerror = function(e) {
						console.error("[TUI Start] Failed to load schedule-window.js:", e);
					};
					document.body.appendChild(scheduleScript);
				};
				assignmentScript.onerror = function(e) {
					console.error("[TUI Start] Failed to load assignment-data.js:", e);
				};
				document.body.appendChild(assignmentScript);
				return;
			}
			if (url) window.location.href = url;
		}
	}

	function ensureFocus() {
		if (document.activeElement !== tuiBox) {
			tuiBox.focus();
		}
	}

	tuiBox.setAttribute('tabindex', '0');
	ensureFocus();
	updateActive(current);

	tuiBox.onkeydown = null;
	tuiBox.addEventListener('keydown', (e) => {
		// If typing a printable character (not a control key), open search and pass the char
		if (
			e.key.length === 1 &&
			!e.ctrlKey && !e.metaKey && !e.altKey &&
			/^[\w\d\s\p{P}\p{S}]$/u.test(e.key)
		) {
			// Dynamically load search-window.js if needed, then openSearchWindow with initial text
			e.preventDefault();
			var script = document.createElement('script');
			script.src = 'scripts/search-window.js';
			script.onload = function() {
				if (typeof openSearchWindow === 'function') openSearchWindow(e.key);
			};
			document.body.appendChild(script);
			return;
		}
		if (e.key === 'ArrowDown') {
			current = (current + 1) % items.length;
			updateActive(current);
			e.preventDefault();
		} else if (e.key === 'ArrowUp') {
			current = (current - 1 + items.length) % items.length;
			updateActive(current);
			e.preventDefault();
		} else if (e.key === 'Enter') {
			openCurrent();
			e.preventDefault();
		}
	});

	tuiBox.addEventListener('blur', ensureFocus);
}

document.addEventListener('DOMContentLoaded', () => {
	const tuiBox = document.querySelector('.tui-box');
	if (!tuiBox) {
		console.error('TUI Start: .tui-box not found in DOM!');
		return;
				// Set initial selected class name to first valid class
				if (classNames.length > 0) {
					window.selectedClassName = classNames[0];
					window.dispatchEvent(new CustomEvent('tuiSelectedClassChanged', { detail: { className: classNames[0] } }));
				}
			}
	window._originalTuiBoxHTML = tuiBox.innerHTML;
	// Set valid class names globally for later use, then initialize menu
	(async () => {
		try {
			const schedResp = await fetch('schedule-data.json');
			if (schedResp.ok) {
				const schedData = await schedResp.json();
				const seen = new Set();
				let classNames = [];
				Object.values(schedData).forEach(dayArr => {
					dayArr.forEach(item => {
						const subj = (item.subject || '').trim();
						if (subj && !seen.has(subj)) {
							classNames.push(subj);
							seen.add(subj);
						}
					});
				});
				window._validClassNames = classNames;
			}
		} catch (e) {}
		// Now initialize menu and selection
		try {
			tuiMenuInit();
			console.log('TUI Start JS loaded, tuiBox:', tuiBox);
			tuiBox.focus();
			tuiBox.addEventListener('focus', () => {
				console.log('tuiBox focused');
			});
			// Force Coursework section to update after assignments are loaded
			setTimeout(() => {
				window.dispatchEvent(new CustomEvent('tuiSelectedClassChanged', { detail: { className: window.selectedClassName } }));
			}, 500);
		} catch (e) {
			console.error('TUI Start: Error initializing menu:', e);
		}
	})();
		// Fetch upcoming assignments and organize by context_name on page load
			(async () => {
				try {
					const resp = await fetch('/canvas-upcoming');
					if (!resp.ok) throw new Error('Failed to fetch upcoming assignments');
					const data = await resp.json();
					// Parse into arrays by context_name, only with due date today or in the future
					const now = new Date();
					// First, collect all class names from schedule-data.json
					let classNames = [];
					try {
						const schedResp = await fetch('schedule-data.json');
						if (schedResp.ok) {
							const schedData = await schedResp.json();
							const seen = new Set();
							Object.values(schedData).forEach(dayArr => {
								dayArr.forEach(item => {
									const subj = (item.subject || '').trim();
									if (subj && !seen.has(subj)) {
										classNames.push(subj);
										seen.add(subj);
									}
								});
							});
						}
					} catch (e) {}

					// Aliases for Canvas context_name to schedule class name
					const courseAliases = {
						'Biology A (J. Kruger)': 'Biology',
						'Biology B (J. Kruger)': 'Biology',
						'Business Math B (J. Kruger)': 'Business Math',
						'French 2 B (J. Kruger)': 'French',
						'Life Skills (J. Kruger)': 'Life Skills',
						'United States History A (J. Kruger)': 'US History',
						'United States History B (J. Kruger)': 'US History',
						'Wellbeing: Music (J. Kruger)': 'Music',
						'HC': 'HC',
						'Lunch': 'Lunch',
						'Homework Cafe': 'Homework Cafe',
						'Dashboard': 'Dashboard',
						'Canvas': 'Canvas',
					};


					// Normalize all class names for keys
					function normalizeClassName(name) {
						return courseAliases[name] || name;
					}
					// Build byContext only from assignments, then fill in missing classes
					let byContext = {};
					data.forEach(item => {
						const rawCtx = (item.context_name || '').trim();
						const ctx = normalizeClassName(rawCtx);
						const dueStr = item.plannable?.due_at;
						const submitted = item.submissions?.submitted;
						if (!ctx || !dueStr) return;
						const due = new Date(dueStr);
						if (isNaN(due) || due < new Date(now.getFullYear(), now.getMonth(), now.getDate())) return;
						if (submitted === true) return;
						const name = item.plannable?.title || item.plannable?.name || 'Untitled';
						if (!byContext[ctx]) byContext[ctx] = [];
						console.log(`Mapping assignment '${name}' (context_name: '${rawCtx}', mapped: '${ctx}') to class array.`);
						byContext[ctx].push({ name, due: dueStr });
					});
					console.log('Final byContext mapping:', byContext);
					// Fill in missing classes from schedule with 'No upcoming assignments'
					classNames.forEach(cls => {
						const norm = normalizeClassName(cls);
						if (!byContext[norm] || byContext[norm].length === 0) {
							byContext[norm] = ['No upcoming assignments'];
						}
					});

					// Print each array to the console
					Object.entries(byContext).forEach(([ctx, arr]) => {
						console.log(`Assignments for context_name: ${ctx}`, arr);
					});
					window.upcomingAssignmentsByContext = byContext;
					window.upcomingAssignments = data;
				} catch (e) {
					console.error('Error fetching or parsing upcoming assignments:', e);
					window.upcomingAssignmentsByContext = {};
					window.upcomingAssignments = [];
				}
			})();
});