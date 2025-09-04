// Display version number in status bar
document.addEventListener('DOMContentLoaded', () => {
  // Get version from package.json
  fetch('/version')
    .then(response => response.text())
    .then(version => {
      const statusBar = document.getElementById('status-bar');
      if (statusBar) {
        // Create version element
        const versionElem = document.createElement('span');
        versionElem.id = 'version-indicator';
        versionElem.textContent = `v${version}`;
        versionElem.style.cssText = 'position:absolute;right:10px;bottom:5px;font-size:0.75rem;opacity:0.6;';
        
        // Add to status bar
        statusBar.parentNode.style.position = 'relative';
        statusBar.parentNode.appendChild(versionElem);
      }
    })
    .catch(err => console.error('Failed to load version:', err));
});
