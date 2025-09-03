// Only allow openSearchWindow to run if .tui-box exists
// search-window.js
// This file creates the search window with a search bar and live status bar logic.

// Define searchProviders globally for the window
window.searchProviders = [
    {
        name: 'Google',
        displayName: 'Search Google',
        icon: 'https://unpkg.com/feather-icons/dist/icons/search.svg',
        baseUrl: 'https://www.google.com/search?q='
    },
    {
        name: 'ChatGPT',
        displayName: 'Ask ChatGPT',
        icon: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/openai.svg',
        baseUrl: 'https://chat.openai.com/'
    },
    {
        name: 'YouTube',
        displayName: 'Search YouTube',
        icon: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/youtube.svg',
        baseUrl: 'https://www.youtube.com/results?search_query='
    },
    {
        name: 'TikTok',
        displayName: 'Search TikTok',
        icon: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/tiktok.svg',
        baseUrl: 'https://www.tiktok.com/search?q='
    },
    {
        name: 'Reddit',
        displayName: 'Search Reddit',
        icon: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/reddit.svg',
        baseUrl: 'https://www.reddit.com/search/?q='
    }
];

// Initialize current provider
if (typeof window._currentProvider === 'undefined') {
    window._currentProvider = 0;
}

// Accepts optional initialText to prefill the search bar
window.openSearchWindow = function(initialText) {
	if (window._searchWindowOpen) return;
	window._searchWindowOpen = true;
	const tuiBox = document.querySelector('.tui-box');
	if (!tuiBox) {
		console.error('openSearchWindow: .tui-box not found in DOM!');
		window._searchWindowOpen = false;
		return;
	}

	tuiBox.classList.remove('search-window'); // Always reset before opening
	const originalHTML = tuiBox.innerHTML;
	// Remove all keydown listeners from tuiBox so input can receive keys
	const tuiBoxClone = tuiBox.cloneNode(true);
	tuiBox.parentNode.replaceChild(tuiBoxClone, tuiBox);
	const tuiBoxNew = document.querySelector('.tui-box');
	tuiBoxNew.classList.add('search-window');

	// When search window closes, allow reopening
	window._closeSearchWindow = function() {
		window._searchWindowOpen = false;
	};

	tuiBoxNew.innerHTML = `
		<div style="width:520px;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;">
			<div style="position:relative;width:100%;height:0;">
				<div style="position:absolute;top:0;left:0;width:18px;height:18px;border-left:3px solid #fff;border-top:3px solid #fff;"></div>
				<span style="position:absolute;top:-13px;left:26px;font-size:1.1rem;font-weight:bold;letter-spacing:0.1em;color:#fff;white-space:nowrap;background:#000;padding:0 8px;z-index:2;">Search</span>
				<div style="position:absolute;top:0;left:0;width:100%;height:0;border-top:2px solid #fff;z-index:1;"></div>
			</div>
			<div style="box-sizing:border-box;border-left:3px solid #fff;border-right:3px solid #fff;border-bottom:3px solid #fff;border-top:none;border-radius:0;padding:24px 48px 24px 48px;background:#000;width:520px;min-width:520px;max-width:520px;min-height:188px;height:395.6px;display:flex;flex-direction:column;align-items:center;justify-content:center;margin-top:0;overflow:hidden;">
				<form id="search-form" autocomplete="off" style="width:100%; display:flex; justify-content:center; align-items:center; margin-bottom:18px; margin-top:18px;" onsubmit="return false;">
					<div style="width:100%;position:relative;">
						<div style="position:absolute;left:10px;top:50%;transform:translateY(-50%);display:flex;align-items:center;pointer-events:none;z-index:2;">
							<img id="search-provider-icon" width="14" height="14" style="filter:invert(1);" />
						</div>
						<input id="search-input" type="text" autocomplete="off" autofocus style="
							font-family:monospace;
							font-size:1.1rem;
							color:#fff;
							background:#000;
							border-radius:0;
							padding:8px 8px 8px 34px;
							outline:none;
							width:100%;
							min-width:0;
							max-width:100%;
							box-sizing:border-box;
							position:relative;
							z-index:1;
							text-align:left;
							border:2px solid #fff;
							margin: 0 auto;
							display: block;
						"/>
					</div>
				</form>
				<ul id="search-suggestions" class="tui-menu" style="padding:0 !important; width:100%; min-width:0; max-width:100%; position:relative; background:#000; color:#fff; z-index:10; flex:1 1 auto; max-height:210px; overflow-y:auto; display:block; border:2px solid #fff; border-radius:0; align-self:center; margin-top:18px;"></ul>
			</div>
		</div>
	`;

	setTimeout(() => {
		const input = document.getElementById('search-input');
		const suggestionsList = document.getElementById('search-suggestions');
		const statusBar = document.getElementById('status-bar') || window.TUIState?.statusBar;
		let suggestions = [];
		let selectedIdx = -1;
		let visibleStart = 0; // Index of first visible suggestion
		let userTyped = '';

		if (input) {
			if (typeof initialText === 'string' && initialText.length > 0) {
				input.value = initialText;
				userTyped = initialText;
				// Immediately fetch suggestions for the initial text
				if (typeof fetchSuggestions === 'function') fetchSuggestions(initialText);
			}
			input.focus();
			input.selectionStart = input.selectionEnd = input.value.length;
		}

        if (!statusBar) return;
        // Initialize current provider if not set
        if (typeof window._currentProvider === 'undefined') {
            window._currentProvider = 0;
        }

        let currentUrl = window.searchProviders[window._currentProvider].baseUrl;
        
        // Update the search provider icon initially
        const providerIcon = document.getElementById('search-provider-icon');
        if (providerIcon) {
            providerIcon.src = window.searchProviders[window._currentProvider].icon;
        }
        
        // Show initial empty state with splash screen
        renderSuggestions();
        
        function updateStatusBar() {
            if (!statusBar) return;
            
            const provider = searchProviders[window._currentProvider];
            const q = input.value.trim();
            const searchText = (selectedIdx >= 0 && suggestions[selectedIdx]) ? suggestions[selectedIdx] : q;
            
            if (provider.name === 'ChatGPT') {
                currentUrl = 'https://chat.openai.com/' + (searchText ? `?q=${encodeURIComponent(searchText)}` : '');
            } else {
                currentUrl = provider.baseUrl + encodeURIComponent(searchText);
            }
            
            statusBar.textContent = currentUrl;
        }
		// Update current URL based on provider
		function updateCurrentUrl() {
			const q = input.value.trim();
			const provider = searchProviders[window._currentProvider];
			if (provider.name === 'ChatGPT') {
				currentUrl = 'https://chat.openai.com/' + (q ? `?q=${encodeURIComponent(q)}` : '');
			} else {
				currentUrl = provider.baseUrl + encodeURIComponent(q);
			}
			updateStatusBar();
		}

		updateCurrentUrl();

		// Debounce and prevent race conditions for fetchSuggestions
		let lastFetchId = 0;
		let fetchTimeout = null;
		async function fetchSuggestions(q) {
			lastFetchId++;
			const fetchId = lastFetchId;
			if (fetchTimeout) clearTimeout(fetchTimeout);
			fetchTimeout = setTimeout(async () => {
				if (!q) {
					suggestions = [];
					selectedIdx = -1;
					renderSuggestions();
					return;
				}
				let safeQ = q.slice(0, 120);
				const proxies = [
					(q) => `https://api.allorigins.win/get?url=${encodeURIComponent('https://suggestqueries.google.com/complete/search?client=firefox&q=' + q)}`,
					(q) => `https://corsproxy.io/?${encodeURIComponent('https://suggestqueries.google.com/complete/search?client=firefox&q=' + q)}`,
					(q) => `https://thingproxy.freeboard.io/fetch/https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}`,
					(q) => `https://yacdn.org/proxy/https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}`
				];
				let attempt = 0;
				let maxDelay = 2000;
				let baseDelay = 120;

				async function tryFetchLoop() {
					if (fetchId !== lastFetchId) return; // query changed, abort
					// Cycle through proxies, using a different one each attempt
					let proxyIdx = attempt % proxies.length;
					try {
						const corsUrl = proxies[proxyIdx](safeQ);
						const resp = await fetch(corsUrl);
						if (!resp.ok || resp.status === 429 || resp.status === 500) throw new Error('Proxy error: ' + resp.status);
						let outer = await resp.json();
						let data;
						if (outer.contents) {
							data = JSON.parse(outer.contents);
						} else if (Array.isArray(outer)) {
							data = outer;
						} else {
							throw new Error('Invalid JSON from proxy');
						}
						if (fetchId === lastFetchId) {
							suggestions = data[1] || [];
							renderSuggestions();
						}
						return; // success, stop retrying
					} catch (err) {
						// If all proxies failed, retry after delay with next proxy
						if (fetchId === lastFetchId) {
							suggestions = [];
							renderSuggestions();
						}
						attempt++;
						let delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
						setTimeout(tryFetchLoop, delay);
					}
				}
				tryFetchLoop();
			}, 120); // debounce ms
		}

		function renderSuggestions() {
			// Always render 8 items, fill with blanks if needed
			let items = [];
			let count = suggestions.length;

			// If currentProvider isn't set, initialize it
			if (typeof window._currentProvider === 'undefined') {
				window._currentProvider = 0;
			}
			
			// Update the search provider icon
			const providerIcon = document.getElementById('search-provider-icon');
			if (providerIcon) {
				providerIcon.src = searchProviders[window._currentProvider].icon;
			}

			if (suggestions.length === 0) {

				const provider = searchProviders[window._currentProvider];
				currentUrl = provider.baseUrl;

				suggestionsList.innerHTML = `
					<div style="display:grid;grid-template-columns:32px 1fr 32px;align-items:center;justify-items:center;width:100%;min-height:210px;gap:12px;">
						<div class="provider-arrow" style="display:flex;justify-content:center;align-items:center;cursor:pointer;font-size:1.6rem;font-family:monospace;transition:transform 0.15s ease;color:#fff;" onclick="window._currentProvider = (window._currentProvider - 1 + ${searchProviders.length}) % ${searchProviders.length}; renderSuggestions();">
							←
						</div>
						<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:0;">
							<img src="${provider.icon}" width="40" height="40" style="margin-bottom:12px;filter:invert(1);" alt="${provider.name} icon">
							<div style="font-family:'Fira Mono', 'SF Mono', 'Consolas', 'Nerd Font', monospace;font-size:1rem;color:#fff;font-weight:bold;letter-spacing:0.04em;white-space:nowrap;">${provider.displayName}</div>
						</div>
						<div class="provider-arrow" style="display:flex;justify-content:center;align-items:center;cursor:pointer;font-size:1.6rem;font-family:monospace;transition:transform 0.15s ease;color:#fff;" onclick="window._currentProvider = (window._currentProvider + 1) % ${searchProviders.length}; renderSuggestions(); updateCurrentUrl();">
							→
						</div>
					</div>
				`;
				suggestionsList.style.display = 'block';
			} else {
				// Clamp visibleStart so selectedIdx is always visible
				if (selectedIdx < visibleStart) visibleStart = selectedIdx;
				if (selectedIdx >= visibleStart + 8) visibleStart = selectedIdx - 7;
				if (visibleStart < 0) visibleStart = 0;
				if (visibleStart > Math.max(0, count - 8)) visibleStart = Math.max(0, count - 8);
				// Show all suggestions but highlight the current window of 8
				for (let i = 0; i < suggestions.length; i++) {
					const isSelected = selectedIdx === i;
					const isVisible = i >= visibleStart && i < visibleStart + 8;
					items.push(`<li class="${isSelected ? 'active' : ''}" data-idx="${i}" style="display:${isVisible ? 'block' : 'none'}">${suggestions[i]}</li>`);
				}
				// Add blank items if we have less than 8 visible items
				const visibleCount = Math.min(8, Math.max(0, suggestions.length - visibleStart));
				for (let i = visibleCount; i < 8; i++) {
					items.push('<li class="" data-idx="" style="display:block">&nbsp;</li>');
				}
				suggestionsList.innerHTML = items.join('');
				suggestionsList.style.display = 'block';
				
				// Ensure selected item is visible by scrolling if needed
				if (selectedIdx >= 0) {
					const activeItem = suggestionsList.querySelector('li.active');
					if (activeItem) {
						activeItem.scrollIntoView({ block: 'nearest' });
					}
				}
			}
		}

		input.addEventListener('input', function() {
			const q = input.value.trim();
			userTyped = q;
			selectedIdx = -1;
			updateStatusBar();
			fetchSuggestions(q);
		});

		input.addEventListener('keydown', function(e) {
			let changed = false;
			
			// Handle left/right arrows to switch providers
			if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
				e.preventDefault();
				const numProviders = window.searchProviders.length;
				if (e.key === 'ArrowLeft') {
					window._currentProvider = (window._currentProvider - 1 + numProviders) % numProviders;
				} else {
					window._currentProvider = (window._currentProvider + 1) % numProviders;
				}
				
				// Update provider icon
				const providerIcon = document.getElementById('search-provider-icon');
				if (providerIcon) {
					providerIcon.src = window.searchProviders[window._currentProvider].icon;
				}
				
				// Update the URL and UI
				currentUrl = window.searchProviders[window._currentProvider].baseUrl;
				updateStatusBar();
				renderSuggestions();

				// Animate arrow
				const arrows = document.querySelectorAll('.provider-arrow');
				const arrowIndex = e.key === 'ArrowLeft' ? 0 : 1;
				if (arrows[arrowIndex]) {
					arrows[arrowIndex].style.transform = 'scale(1.4)';
					setTimeout(() => {
						arrows[arrowIndex].style.transform = '';
					}, 150);
				}
				return;
			}
			
			if (e.key === 'ArrowDown') {
				if (suggestions.length) {
					if (selectedIdx === -1) {
						selectedIdx = 0;
					} else if (selectedIdx === suggestions.length - 1) {
						selectedIdx = 0;
					} else {
						selectedIdx++;
					}
					changed = true;
				}
				e.preventDefault();
			} else if (e.key === 'ArrowUp') {
				if (suggestions.length) {
					if (selectedIdx === -1) {
						selectedIdx = suggestions.length - 1;
					} else if (selectedIdx === 0) {
						selectedIdx = suggestions.length - 1;
					} else {
						selectedIdx--;
					}
					changed = true;
				}
				e.preventDefault();
			} else if (e.key === 'Enter') {
				e.preventDefault();
				const provider = searchProviders[window._currentProvider];
				const q = input.value.trim();
				if (selectedIdx >= 0 && suggestions[selectedIdx]) {
					input.value = suggestions[selectedIdx];
				}
				if (provider.name === 'ChatGPT') {
					currentUrl = 'https://chat.openai.com/?q=' + encodeURIComponent(q);
				} else {
					currentUrl = provider.baseUrl + encodeURIComponent(q);
				}
				updateStatusBar();
				window.location.href = currentUrl;
			} else if (e.key === 'Escape') {
				e.preventDefault();
				tuiBoxNew.innerHTML = originalHTML;
				tuiBoxNew.classList.remove('search-window');
				window._closeSearchWindow();
				if (typeof tuiMenuInit === 'function') tuiMenuInit();
			}
			if (changed) {
				renderSuggestions();
				updateStatusBar();
			}
		});

		suggestionsList.addEventListener('mousedown', function(e) {
			const li = e.target.closest('li');
			if (li) {
				const idx = parseInt(li.getAttribute('data-idx'), 10);
				if (!isNaN(idx)) {
					input.value = suggestions[idx];
					const provider = searchProviders[window._currentProvider];
					const q = input.value.trim();
					if (provider.name === 'ChatGPT') {
						currentUrl = 'https://chat.openai.com/?q=' + encodeURIComponent(q);
					} else {
						currentUrl = provider.baseUrl + encodeURIComponent(q);
					}
					selectedIdx = idx;
					updateStatusBar();
					window.location.href = currentUrl;
				}
			}
		});
	}, 0);
}
