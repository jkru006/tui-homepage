(() => {
    'use strict';

    window.TUIState = {
        tuiBox: null,
        statusBar: null,
        currentIndex: 0,
        validClasses: [],
        initialized: false
    };

    const debug = (...args) => console.log('[TUI Debug]', ...args);

    function createStatusBar() {
        const statusBar = document.createElement('div');
        statusBar.id = 'status-bar';
        document.body.appendChild(statusBar);
        return statusBar;
    }

    function setupTuiBox(tuiBox) {
        debug('Setting up tuiBox');
        
        // Clean slate: remove all event listeners
        const newTuiBox = tuiBox.cloneNode(true);
        tuiBox.parentNode.replaceChild(newTuiBox, tuiBox);
        
        // Store original state if not already stored
        if (!window._originalTuiBoxHTML) {
            window._originalTuiBoxHTML = newTuiBox.innerHTML;
        }

        // Set up navigation
        newTuiBox.className = 'tui-box main-menu-window';
        newTuiBox.setAttribute('tabindex', '0');
        
        // Add event listeners
        newTuiBox.addEventListener('keydown', handleKeyboard);
        newTuiBox.addEventListener('blur', () => {
            debug('tuiBox blur event - refocusing');
            requestAnimationFrame(() => {
                newTuiBox.focus();
                debug('tuiBox refocused');
            });
        });

        // Initial UI state
        updateUI();
        newTuiBox.focus();
        debug('tuiBox focused');
        
        return newTuiBox;
    }

    async function loadScheduleData() {
        try {
            const response = await fetch('schedule-data.json');
            if (!response.ok) return;

            const data = await response.json();
            const seen = new Set();
            TUIState.validClasses = Object.values(data)
                .flat()
                .map(item => (item.subject || '').trim())
                .filter(subject => subject && !seen.has(subject) && seen.add(subject));
        } catch (error) {
            console.error('Failed to load schedule data:', error);
        }
    }

    function updateUI() {
        debug('updateUI called');
        const items = Array.from(document.querySelectorAll('.tui-menu li'));
        if (!items.length) {
            debug('No menu items found');
            return;
        }
        debug('Found', items.length, 'menu items');

        // Update selection state
        items.forEach((item, i) => {
            const isActive = i === TUIState.currentIndex;
            debug('Item', i, isActive ? 'active' : 'inactive');
            
            // Update class
            item.classList.toggle('active', isActive);
            
            // Update styles
            item.style.background = isActive ? '#fff' : 'none';
            item.style.color = isActive ? '#000' : '#fff';

            const label = item.querySelector('.menu-label');
            if (label) {
                label.style.color = isActive ? '#000' : '#fff';
            }
            
            // Update icon color
            const icon = item.querySelector('.icon-bracket img');
            if (icon) {
                icon.style.filter = isActive ? 'invert(0)' : 'invert(1)';
            }
        });

        // Ensure active item is visible
        if (items[TUIState.currentIndex]) {
            items[TUIState.currentIndex].scrollIntoView({ block: 'nearest' });
            debug('Scrolled to active item');
        }

        // Update status bar
        updateStatusBar(items[TUIState.currentIndex]);
    }

    function updateStatusBar(activeItem) {
        debug('updateStatusBar called');
        if (!TUIState.statusBar) {
            debug('No status bar found');
            return;
        }
        if (!activeItem) {
            debug('No active item');
            return;
        }

        const label = activeItem.querySelector('.menu-label')?.textContent?.trim();
        const url = activeItem.dataset?.url || '';
        debug('Active item:', { label, url });

        let statusText = '';
        if (label === 'Search') {
            const searchInput = document.getElementById('search-input');
            const query = searchInput ? encodeURIComponent(searchInput.value.trim()) : '';
            statusText = `https://www.google.com/search?q=${query}`;
        } else if (label === 'School') {
            statusText = 'http://localhost:8080/tui-start.html/School';
        } else {
            statusText = url;
        }

        debug('Setting status bar text:', statusText);
        TUIState.statusBar.textContent = statusText;
    }

    function handleKeyboard(event) {
        debug('Keyboard event:', event.key);
        const tuiBox = TUIState.tuiBox;
        
        // Verify tuiBox is in focus
        if (document.activeElement !== tuiBox) {
            debug('tuiBox not focused, focusing now');
            tuiBox.focus();
        }
        
        const items = Array.from(document.querySelectorAll('.tui-menu li'));
        if (!items.length) {
            debug('No menu items found');
            return;
        }

        // Handle typing to search
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey &&
            /^[\w\d\s\p{P}\p{S}]$/u.test(event.key)) {
            debug('Typing detected, opening search with:', event.key);
            event.preventDefault();
            openSearchWithText(event.key);
            return;
        }

        // Handle navigation
        switch (event.key) {
            case 'ArrowDown':
            case 'ArrowUp':
                event.preventDefault();
                debug('Arrow navigation:', event.key);
                TUIState.currentIndex = event.key === 'ArrowDown'
                    ? (TUIState.currentIndex + 1) % items.length
                    : (TUIState.currentIndex - 1 + items.length) % items.length;
                debug('New index:', TUIState.currentIndex);
                updateUI();
                break;

            case 'Enter':
                event.preventDefault();
                debug('Enter pressed, opening selected item');
                openSelected();
                break;
                
            default:
                debug('Unhandled key:', event.key);
                break;
        }
    }

    function openSearchWithText(initialText) {
        if (typeof openSearchWindow === 'function') {
            openSearchWindow(initialText);
        }
    }

    function openSelected() {
        const items = Array.from(document.querySelectorAll('.tui-menu li'));
        const currentItem = items[TUIState.currentIndex];
        if (!currentItem) return;

        const url = currentItem.dataset.url;
        const label = currentItem.querySelector('.menu-label')?.textContent?.trim();

        // Clean up dynamic content
        document.getElementById('schedule-box')?.remove();

        // Handle special windows
        if (label === 'Search') {
            openSearchWithText();
            return;
        }

        if (label === 'School' && typeof openSchoolWindow === 'function') {
            openSchoolWindow();
            return;
        }

        // Handle regular URLs
        if (url) {
            window.location.href = url;
        }
    }

    // Initialize everything
    function init() {
        debug('Initializing TUI');
        const tuiBox = document.querySelector('.tui-box');
        if (!tuiBox) {
            console.error('TUI Start: .tui-box not found in DOM!');
            return;
        }
        
        // Initialize tuiBox and statusBar
        TUIState.tuiBox = tuiBox;
        TUIState.statusBar = document.getElementById('status-bar') || createStatusBar();

        if (!TUIState.tuiBox || !TUIState.statusBar) {
            debug('Failed to find required elements');
            return;
        }

        // Set up TUI box
        TUIState.tuiBox = setupTuiBox(TUIState.tuiBox);
        
        // Load schedule data
        loadScheduleData().catch(console.error);
        
        TUIState.initialized = true;
    }

    // Legacy function for compatibility
    window.tuiMenuInit = init;

    // Initialize on DOM content loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
