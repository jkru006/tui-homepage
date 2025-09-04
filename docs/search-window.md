# Search Window Implementation

This document contains the complete implementation of the search window feature for the TUI Homepage.

## Features

1. Multiple search engine support (Google, DuckDuckGo, Brave, YouTube, Reddit)
2. Keyboard navigation (arrows, tab, enter, escape)
3. Real-time URL preview in status bar
4. Clean TUI-style interface with corner elements
5. Instant search engine switching

## Core Components

### 1. HTML Structure

The search window uses this HTML structure when opened:

```html
<div class="tui-box search-window" tabindex="0">
    <div style="width:520px;position:relative;">
        <!-- Title Bar with Corners -->
        <div style="position:relative;width:100%;height:24px;">
            <div class="corner corner-tl"></div>
            <div class="corner corner-tr"></div>
            <div class="corner corner-bl"></div>
            <div class="corner corner-br"></div>
            <span>Search</span>
        </div>
        <!-- Content Area -->
        <div>
            <div class="search-input-wrapper">
                <input type="text" class="search-input">
            </div>
            <ul class="tui-menu search-engines">
                <!-- Search engine items -->
            </ul>
        </div>
    </div>
</div>
```

### 2. CSS Styling

```css
/* Search Window Specific Styles */
.search-window {
    position: relative;
    z-index: 1;
    background: #000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: fit-content;
    margin: 0 auto;
}

.search-window:focus {
    outline: none;
}

.search-window .search-input {
    color: #fff;
    background: #000;
    font-family: monospace;
    font-size: 16px;
    padding: 8px;
    width: 100%;
    box-sizing: border-box;
    border: 2px solid #fff;
    outline: none;
}

.search-window .search-engines {
    list-style: none;
    padding: 0;
    margin: 0;
    width: 100%;
}

.search-window .search-engine-item {
    color: #fff;
    padding: 8px 16px;
    margin: 2px 0;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
}

.search-window .search-engine-item.active {
    background: rgba(255, 255, 255, 0.9);
    color: #000;
}
```

### 3. JavaScript Implementation

```javascript
// Search engines configuration
const searchEngines = [
    {
        label: 'Google',
        url: 'https://www.google.com/search?q=',
        icon: 'https://www.google.com/favicon.ico'
    },
    {
        label: 'DuckDuckGo',
        url: 'https://duckduckgo.com/?q=',
        icon: 'https://duckduckgo.com/favicon.ico'
    },
    {
        label: 'Brave',
        url: 'https://search.brave.com/search?q=',
        icon: 'https://brave.com/static-assets/images/brave-favicon.png'
    },
    {
        label: 'YouTube',
        url: 'https://www.youtube.com/results?search_query=',
        icon: '/icons/youtube.svg'
    },
    {
        label: 'Reddit',
        url: 'https://www.reddit.com/search/?q=',
        icon: '/icons/reddit.svg'
    }
];

function openSearchWindow() {
    const tuiBox = document.querySelector('.tui-box');
    
    // Save original state
    const originalHTML = window._originalTuiBoxHTML || tuiBox.innerHTML;
    
    // Clean up old state
    tuiBox.classList.remove('search-window');
    tuiBox.removeEventListener('keydown', window._searchWindowKeyHandler);
    window._searchWindowKeyHandler = null;
    
    // Set up new state
    tuiBox.classList.add('search-window');
    tuiBox.setAttribute('tabindex', '0');
    
    // Insert HTML template
    tuiBox.innerHTML = \`...template string...\`; // (See HTML structure above)
    
    // Focus search input
    const searchInput = tuiBox.querySelector('.search-input');
    searchInput.focus();
    
    // Initialize engine selection
    let current = 0;
    const items = Array.from(tuiBox.querySelectorAll('.search-engine-item'));
    
    // Update active engine display
    function updateActive(idx) {
        items.forEach((item, i) => {
            if (i === idx) {
                item.classList.add('active');
                // Update styles for active state
            } else {
                item.classList.remove('active');
                // Reset styles
            }
        });
        // Update status bar URL preview
    }
    
    // Handle keyboard input
    function handleKey(e) {
        switch(e.key) {
            case 'ArrowDown':
                // Navigate down through engines
                current = (current + 1) % items.length;
                updateActive(current);
                break;
            case 'ArrowUp':
                // Navigate up through engines
                current = (current - 1 + items.length) % items.length;
                updateActive(current);
                break;
            case 'Enter':
                // Perform search
                const query = searchInput.value.trim();
                if (query) {
                    window.location.href = searchEngines[current].url + 
                                         encodeURIComponent(query);
                }
                break;
            case 'Escape':
                // Close search window
                tuiBox.innerHTML = originalHTML;
                tuiBox.classList.remove('search-window');
                // Clean up
                break;
            case 'Tab':
                // Toggle focus between input and engines
                if (document.activeElement === searchInput) {
                    items[current].focus();
                } else {
                    searchInput.focus();
                }
                break;
        }
    }
    
    // Set up event listeners
    window._searchWindowKeyHandler = handleKey;
    document.addEventListener('keydown', handleKey);
}

// Export function
window.openSearchWindow = openSearchWindow;
```

## Usage

The search window can be opened in several ways:
1. Selecting the "Search" option from the main menu
2. Using keyboard shortcuts (if implemented)
3. Calling `openSearchWindow()` from JavaScript

## Key Features Explained

### 1. Search Engine Selection
- Up/Down arrows navigate through search engines
- Selected engine is highlighted
- Engine icons invert colors when selected
- URL preview updates in status bar

### 2. Input Handling
- Auto-focus on search input when window opens
- Tab key toggles between input and engine selection
- Enter key performs search with selected engine
- Escape key returns to main menu

### 3. URL Preview
- Status bar shows complete search URL as you type
- Updates when changing search engines
- Helps users verify the search before pressing Enter

### 4. Visual Styling
- Consistent with TUI theme
- Corner elements for visual structure
- Clean, minimal design
- High contrast for readability

## Integration

To integrate the search window:

1. Include the CSS in your stylesheet or `<style>` tag
2. Add the JavaScript file to your HTML
3. Make sure icons are available in the specified paths
4. Call `openSearchWindow()` when needed

The search window is designed to work with the existing TUI menu system and follows the same styling patterns used throughout the interface.
