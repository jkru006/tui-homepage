// Google Autocomplete logic for TUI Start Page
function enableGoogleAutocomplete(inputId) {
	const input = document.getElementById(inputId);
	if (!input) return;
	let acList = document.createElement('ul');
	acList.id = 'google-ac-list';
	acList.style.position = 'absolute';
	acList.style.background = '#222';
	acList.style.color = '#fff';
	acList.style.listStyle = 'none';
	acList.style.margin = 0;
	acList.style.padding = '0.5em';
	acList.style.border = '1px solid #888';
	acList.style.zIndex = 1001;
	input.parentNode.appendChild(acList);

	input.addEventListener('input', async function() {
		const q = input.value.trim();
		if (!q) {
			acList.innerHTML = '';
			return;
		}
		// Fetch Google autocomplete suggestions
		try {
			const resp = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}`);
			const data = await resp.json();
			acList.innerHTML = '';
			data[1].forEach(s => {
				const li = document.createElement('li');
				li.textContent = s;
				li.style.cursor = 'pointer';
				li.onclick = () => {
					input.value = s;
					acList.innerHTML = '';
				};
				acList.appendChild(li);
			});
		} catch (e) {
			acList.innerHTML = '';
		}
	});

	input.addEventListener('blur', function() {
		setTimeout(() => { acList.innerHTML = ''; }, 200);
	});
}
