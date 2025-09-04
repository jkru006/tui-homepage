


function openToDoWindow() {
	// Remove the school window key handler so it doesn't run in the background
	if (typeof window.removeSchoolWindowKeyHandler === 'function') {
		window.removeSchoolWindowKeyHandler();
	}
	const tuiBox = document.querySelector('.tui-box');
	const newTuiBox = tuiBox.cloneNode(true);
	tuiBox.parentNode.replaceChild(newTuiBox, tuiBox);
	const box = document.querySelector('.tui-box');
	box.classList.remove('school-window');
	box.classList.add('todo-window');

	// Tab data
	const tabs = [
		{
			name: 'Upcoming',
			items: [] // Will be filled with Canvas API results
		},
		{
			name: 'Completed',
			items: [] // Will be filled with completed assignments
		}
	];
	let currentTab = 0;
	let currentItem = 0;

	// Load assignments from upcomingAssignmentsByContext or fetch from Canvas API
	(async function() {
		try {
			// First try to use assignments from window.upcomingAssignmentsByContext
			function getAllAssignments() {
				// Initialize if doesn't exist
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
				
				const allAssignments = [];
				
				// Collect all assignments from all classes
				Object.keys(window.upcomingAssignmentsByContext).forEach(className => {
					const classAssignments = window.upcomingAssignmentsByContext[className];
					if (Array.isArray(classAssignments)) {
						classAssignments.forEach(assignment => {
							allAssignments.push({
								name: assignment.name,
								class: className,
								due: assignment.due,
								url: assignment.url || `https://fusion.instructure.com/courses/${className.toLowerCase()}/assignments/`
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
			
			// Use assignments from upcomingAssignmentsByContext
			const todoItems = getAllAssignments();
			
			// Fallback to Canvas API if available and todoItems is empty
			if (todoItems.length === 0 && (window.fetchCanvasAssignments || document.querySelector('script[src="scripts/canvas-api.js"]'))) {
				if (!window.fetchCanvasAssignments) {
					await new Promise((resolve, reject) => {
						const script = document.createElement('script');
						script.src = 'scripts/canvas-api.js';
						script.onload = resolve;
						script.onerror = reject;
						document.body.appendChild(script);
					});
				}
				
				const [assignments, completed] = await Promise.all([
					window.fetchCanvasAssignments(),
					window.fetchCanvasCompleted()
				]);
				
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
				
				// Map Canvas assignments to our format
				const canvasItems = (assignments || [])
					.filter(a => a.submissions && a.submissions.submitted === false)
					.map(a => {
						const aliasClass = courseAliases[a.context_name || ''] || (a.context_name || '');
						let name = (a.plannable && (a.plannable.name || a.plannable.title)) || a.assignment?.name || a.assignment?.title || a.title || 'Untitled';
						let due = (a.plannable && a.plannable.due_at) || a.assignment?.due_at || a.plannable_date || '';
						due = due ? new Date(due).toLocaleString() : 'No due date';
						let url = a.html_url || a.assignment?.html_url || '';
						if (url && url.startsWith('/')) url = 'https://fusion.instructure.com' + url;
						return {
							name,
							class: aliasClass,
							due,
							url,
						};
					});
					
				// Only use Canvas items if we have any
				if (canvasItems.length > 0) {
					todoItems.push(...canvasItems);
				}
			}
			
			tabs[0].items = todoItems.length > 0 ? todoItems : [
				{ name: 'No upcoming assignments found', class: '', due: '', url: '' }
			];
			// For completed assignments, use some from each class that are "due" in the past
			const now = new Date();
			const mockCompletedItems = [];
			
			// Get completed items from each class (up to 2 per class)
			Object.keys(window.upcomingAssignmentsByContext).forEach(className => {
				const classAssignments = window.upcomingAssignmentsByContext[className];
				if (Array.isArray(classAssignments) && classAssignments.length > 0) {
					// Add 1-2 "completed" assignments per class (mock data)
					const pastDate1 = new Date(now);
					pastDate1.setDate(pastDate1.getDate() - Math.floor(Math.random() * 10 + 1)); // 1-10 days ago
					
					const pastDate2 = new Date(now);
					pastDate2.setDate(pastDate2.getDate() - Math.floor(Math.random() * 5 + 1)); // 1-5 days ago
					
					mockCompletedItems.push({
						name: `Completed ${className} Assignment 1`,
						class: className,
						due: pastDate1.toLocaleDateString(),
						url: `https://fusion.instructure.com/courses/${className.toLowerCase()}/assignments/completed1`
					});
					
					if (Math.random() > 0.3) { // 70% chance to add a second completed assignment
						mockCompletedItems.push({
							name: `Completed ${className} Assignment 2`,
							class: className,
							due: pastDate2.toLocaleDateString(),
							url: `https://fusion.instructure.com/courses/${className.toLowerCase()}/assignments/completed2`
						});
					}
				}
			});
			
			// Try to get Canvas completed assignments if available
			const canvasCompletedItems = [];
			if (completed && completed.length > 0) {
				(assignments || [])
					.filter(a => a.submissions && a.submissions.submitted === true)
					.concat((completed || []).filter(a => a.submissions && a.submissions.submitted === true))
					.forEach(a => {
						// Always use context_name for alias lookup
						const aliasClass = courseAliases[a.context_name || ''] || (a.context_name || '');
						let name = (a.plannable && (a.plannable.name || a.plannable.title)) || a.assignment?.name || a.assignment?.title || a.title || 'Untitled';
						let due = (a.plannable && a.plannable.due_at) || a.assignment?.due_at || a.plannable_date || '';
						due = due ? new Date(due).toLocaleString() : 'No due date';
						let url = a.html_url || a.assignment?.html_url || '';
						if (url && url.startsWith('/')) url = 'https://fusion.instructure.com' + url;
						canvasCompletedItems.push({
							name,
							class: aliasClass,
							due,
							url,
						});
					});
			}
			
			// Use Canvas items if available, otherwise use mock data
			const completedItems = canvasCompletedItems.length > 0 ? canvasCompletedItems : mockCompletedItems;
			
			tabs[1].items = completedItems.length > 0 ? completedItems : [
				{ name: 'No completed assignments found', class: '', due: '', url: '' }
			];
		} catch (e) {
			tabs[0].items = [
				{ name: 'Error loading Canvas assignments', class: '', due: '', url: '' }
			];
			tabs[1].items = [
				{ name: 'Error loading completed assignments', class: '', due: '', url: '' }
			];
		}
		update();
	})();

	// Add keyboard navigation for add/delete buttons and looping
	let addDeleteFocus = null; // null = list, 0 = add, 1 = delete
		function render() {
			// Tab bar
			let tabBar = `<div id="todo-tabs" style="display:flex;justify-content:center;align-items:flex-end;width:100%;margin-bottom:0;gap:0.5em;position:relative;">`;
			tabs.forEach((tab, i) => {
				tabBar += `<div class="todo-tab${i === currentTab ? ' active' : ''}" style="
					padding: 7px 32px 8px 32px;
					margin: 0;
					cursor: pointer;
					border-radius: 0;
					background: ${i === currentTab ? '#fff' : '#000'};
					color: ${i === currentTab ? '#000' : '#fff'};
					font-weight: ${i === currentTab ? 'bold' : 'normal'};
					border: 2px solid #fff;
					border-bottom: none;
					position: relative;
					z-index: 2;
					box-shadow: none;
					transition: background 0.1s, color 0.1s;
				">${tab.name}</div>`;
			});
			tabBar += `<div style="position:absolute;left:0;right:0;bottom:-2px;height:2px;background:#fff;width:100%;z-index:1;"></div></div>`;

			// Only show 8 items at a time, scroll with arrow keys
			const items = tabs[currentTab].items;
			const visibleCount = 8;
			let visibleStart = 0;
			if (currentItem >= visibleCount) {
				visibleStart = currentItem - visibleCount + 1;
			}
			if (currentItem < visibleStart) {
				visibleStart = currentItem;
			}
			if (visibleStart < 0) visibleStart = 0;
			if (visibleStart > Math.max(0, items.length - visibleCount)) visibleStart = Math.max(0, items.length - visibleCount);
			let list = `<ul class="tui-menu" style="width:100%;margin:0 auto;">`;
			for (let i = visibleStart; i < Math.min(items.length, visibleStart + visibleCount); ++i) {
				const item = items[i];
				const maxName = 18;
				const maxClass = 10;
				const shortName = (item.name || '').length > maxName ? (item.name.slice(0, maxName - 1) + '…') : (item.name || '');
				const shortClass = (item.class || '').length > maxClass ? (item.class.slice(0, maxClass - 1) + '…') : (item.class || '');
				let shortDue = '';
				if (item.due && item.due !== 'No due date') {
					const d = new Date(item.due);
					if (!isNaN(d)) {
						const mm = (d.getMonth() + 1).toString().padStart(2, '0');
						const dd = d.getDate().toString().padStart(2, '0');
						shortDue = `${mm}/${dd}`;
					}
				}
				list += `<li class="${i === currentItem && addDeleteFocus===null ? 'active' : ''}" style="width:100%;box-sizing:border-box;padding:0 18px;display:flex;align-items:center;justify-content:space-between;">` +
					`<span class="menu-label" style="flex:1 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><b>${shortName}</b>` +
					(shortClass ? ` <span style='color:#888;font-weight:normal;'>${shortClass}</span>` : '') +
					`</span>` +
					(shortDue ? `<span style='color:#888;font-weight:normal;min-width:60px;display:inline-block;text-align:right;flex:0 0 auto;'>${shortDue}</span>` : '') +
					`</li>`;
			}
			list += `</ul>`;

			// Update the global status bar in the bottom left
			const selectedItem = tabs[currentTab].items[currentItem];
			const statusBar = document.getElementById('status-bar');
			if (statusBar) {
				if (selectedItem && typeof selectedItem.url === 'string' && selectedItem.url) {
					let url = selectedItem.url;
					if (url && url.startsWith('/')) {
						url = 'https://fusion.instructure.com' + url;
					}
					statusBar.textContent = url;
				} else {
					statusBar.textContent = '';
				}
			}
			box.innerHTML = `
				<div style="position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:0;">
					<div style="box-sizing:border-box;position:relative;border-left:3px solid #fff;border-right:3px solid #fff;border-bottom:3px solid #fff;border-top:3px solid #fff;border-radius:0;padding:24px 48px 8px 48px;background:#000;width:520px;min-width:520px;max-width:520px;min-height:188px;height:395.6px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;margin-top:0;overflow:visible;">
						<span style='position:absolute;top:-0.95em;left:32px;padding:0 12px;background:#000;font-size:1.1rem;font-weight:bold;letter-spacing:0.1em;color:#fff;white-space:nowrap;z-index:10;'>To-Do List</span>
						${tabBar}
						<div style="height:18px;"></div>
						${list}
					</div>
				</div>
			`;
	}

	function update() {
		render();
	}
	update();

	   // Add keyboard navigation for add/delete buttons and looping
		function handleKey(e) {
			const items = tabs[currentTab].items;
			if (addDeleteFocus === null) {
				// In list
				if (e.key === 'ArrowDown') {
					if (currentItem < items.length - 1) {
						currentItem++;
					} else {
						currentItem = 0; // wrap to top
					}
					update();
					e.preventDefault();
				} else if (e.key === 'ArrowUp') {
					if (currentItem > 0) {
						currentItem--;
					} else {
						currentItem = items.length - 1; // wrap to bottom
					}
					update();
					e.preventDefault();
				} else if (e.key === 'Tab' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
					// Switch tabs
					let nextTab = currentTab;
					if (e.key === 'Tab') {
						nextTab = (currentTab + 1) % tabs.length;
					} else if (e.key === 'ArrowLeft') {
						nextTab = (currentTab - 1 + tabs.length) % tabs.length;
					} else if (e.key === 'ArrowRight') {
						nextTab = (currentTab + 1) % tabs.length;
					}
					if (nextTab !== currentTab) {
						currentTab = nextTab;
						// Clamp currentItem to visible range
						if (currentItem > tabs[currentTab].items.length - 1) {
							currentItem = tabs[currentTab].items.length - 1;
						}
						if (currentItem < 0) currentItem = 0;
						addDeleteFocus = null;
						update();
					}
					e.preventDefault();
				}
				else if (e.key === 'Enter') {
					if (currentTab === 0 && items[currentItem] && items[currentItem].url) {
						window.open(items[currentItem].url, '_blank');
						return;
					}
				}
			} else {
				// In icon row
				if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
					addDeleteFocus = addDeleteFocus === 0 ? 1 : 0;
					update();
					e.preventDefault();
				} else if (e.key === 'ArrowDown') {
					addDeleteFocus = null;
					currentItem = 0;
					update();
					e.preventDefault();
				} else if (e.key === 'ArrowUp') {
					addDeleteFocus = null;
					currentItem = items.length - 1;
					update();
					e.preventDefault();
				} else if (e.key === 'Tab') {
					// Switch tabs
					let nextTab = (currentTab + 1) % tabs.length;
					currentTab = nextTab;
					currentItem = 0;
					addDeleteFocus = null;
					update();
					e.preventDefault();
				}
			}
			if (e.key === 'Escape') {
				document.removeEventListener('keydown', handleKey);
				if (typeof openSchoolWindow === 'function') openSchoolWindow();
			}
			// Focus the correct button if needed
			setTimeout(() => {
				if (addDeleteFocus === 0) {
					document.getElementById('todo-add-btn')?.focus();
				} else if (addDeleteFocus === 1) {
					document.getElementById('todo-del-btn')?.focus();
				} else {
					box.focus();
				}
			}, 0);
		}
		document.addEventListener('keydown', handleKey);
}
window.openToDoWindow = openToDoWindow;
