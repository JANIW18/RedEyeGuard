document.addEventListener('DOMContentLoaded', function() {
  const threshold = document.getElementById('threshold');
  const thresholdValue = document.getElementById('thresholdValue');
  const newDomain = document.getElementById('newDomain');
  const addBtn = document.getElementById('addBtn');
  const whitelistDiv = document.getElementById('whitelistContainer');
  const saveBtn = document.getElementById('saveSettings');
  const lastTrained = document.getElementById('lastTrained');

  // Load settings
  chrome.storage.sync.get(['settings'], (res) => {
    const settings = res.settings || { threshold: 0.7 };
    threshold.value = settings.threshold;
    thresholdValue.textContent = settings.threshold;
  });

  threshold.addEventListener('input', () => {
    thresholdValue.textContent = threshold.value;
  });

  // Load whitelist
  function loadWhitelist() {
    chrome.runtime.sendMessage({ action: 'get_whitelist' }, (res) => {
      if (res?.whitelist) {
        whitelistDiv.innerHTML = res.whitelist.map(domain => `
          <div class="whitelist-item">
            <span>${domain}</span>
            <button class="remove-btn" data-domain="${domain}">✕</button>
          </div>
        `).join('');
        
        document.querySelectorAll('.remove-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'remove_from_whitelist', domain: btn.dataset.domain }, loadWhitelist);
          });
        });
      }
    });
  }
  loadWhitelist();

  addBtn.addEventListener('click', () => {
    const domain = newDomain.value.trim();
    if (domain) {
      chrome.runtime.sendMessage({ action: 'add_to_whitelist', domain }, () => {
        newDomain.value = '';
        loadWhitelist();
      });
    }
  });

  // Load last trained time
  chrome.storage.local.get(['last_trained'], (res) => {
    if (res.last_trained) {
      lastTrained.textContent = new Date(res.last_trained).toLocaleString();
    }
  });

  saveBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({
      action: 'save_settings',
      settings: { threshold: parseFloat(threshold.value) }
    }, () => {
      alert('Settings saved!');
    });
  });
});