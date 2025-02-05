document.addEventListener('DOMContentLoaded', () => {
  // Get LOCATION_PATTERNS from the CONSTANTS object
  const { LOCATION_PATTERNS } = CONSTANTS;

  // Populate country dropdown
  const countrySelect = document.getElementById('country');
  Object.entries(LOCATION_PATTERNS).forEach(([code, data]) => {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = data.name;
    countrySelect.appendChild(option);
  });

  // Load saved settings
  chrome.storage.sync.get(['country', 'showRemote'], (result) => {
    if (result.country) {
      countrySelect.value = result.country;
    }
    if (result.showRemote !== undefined) {
      document.getElementById('showRemote').checked = result.showRemote;
    }
  });

  // Save settings when changed
  countrySelect.addEventListener('change', saveSettings);
  document.getElementById('showRemote').addEventListener('change', saveSettings);
});

function saveSettings() {
  const country = document.getElementById('country').value;
  const showRemote = document.getElementById('showRemote').checked;

  chrome.storage.sync.set({
    country: country,
    showRemote: showRemote
  }, () => {
    // Show saved message
    const status = document.getElementById('status');
    status.style.display = 'block';
    setTimeout(() => {
      status.style.display = 'none';
    }, 2000);

    // Notify content script of changes - with error handling
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        const url = tabs[0].url || '';
        // Only try to send message if we're on LinkedIn
        if (url.includes('linkedin.com')) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'settingsUpdated',
            settings: { country, showRemote }
          }).catch(error => {
            console.log('Settings saved, but current tab is not ready for updates');
          });
        }
      }
    });
  });
}

// Add error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
  // Prevent the error from showing in console
  event.preventDefault();
  console.log('Settings saved, but could not update active tab');
});