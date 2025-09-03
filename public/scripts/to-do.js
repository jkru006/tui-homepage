


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

	// Load Canvas assignments for School and Completed tabs
	(async function() {
		try {
			if (!window.fetchCanvasAssignments || !window.fetchCanvasCompleted) {
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
			// Build a set of completed assignment IDs for filtering
			const completedIds = new Set((completed || []).map(a => a.assignment && a.assignment.id));
			// Map course_id to real course name from assignments and completed
			const allCourses = {};
			(assignments || []).forEach(a => {
				if (a.assignment && a.assignment.course_id && a.assignment.course && a.assignment.course.name) {
					allCourses[a.assignment.course_id] = a.assignment.course.name;
				}
			});
			(completed || []).forEach(a => {
				if (a.assignment && a.assignment.course_id && a.course && a.course.name) {
					allCourses[a.assignment.course_id] = a.course.name;
				}
			});
			// Aliases
			const courseAliases = {
				'Biology A (J. Kruger)': 'Bio',
				'Biology B (J. Kruger)': 'Bio',
				'Business Math B (J. Kruger)': 'Math',
				'French 2 B (J. Kruger)': 'French',
				'Life Skills (J. Kruger)': 'Prep',
				'United States History A (J. Kruger)': 'History',
				'United States History B (J. Kruger)': 'History',
				'Wellbeing: Music (J. Kruger)': 'Music',
			};
			// To-Do: only assignments not completed (submissions.submitted === false)
			const todoItems = (assignments || [])
				.filter(a => a.submissions && a.submissions.submitted === false)
				.map(a => {
					// Always use context_name for alias lookup
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
			tabs[0].items = todoItems.length > 0 ? todoItems : [
				{ name: 'No Canvas assignments found', class: '', due: '', url: '' }
			];
			// Completed: only assignments with submissions.submitted === true
			const completedItems = (assignments || [])
				.filter(a => a.submissions && a.submissions.submitted === true)
				.concat((completed || []).filter(a => a.submissions && a.submissions.submitted === true))
				.map(a => {
					// Always use context_name for alias lookup
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
