document.addEventListener('DOMContentLoaded', function() {
  const scanBtn = document.getElementById('scanBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const trainBtn = document.getElementById('trainBtn');
  const clearLogs = document.getElementById('clearLogs');
  const resultCard = document.getElementById('result-card');
  const scoreDisplay = document.getElementById('score-display');
  const riskDisplay = document.getElementById('risk-display');
  const featureGrid = document.getElementById('feature-grid');
  const logsDiv = document.getElementById('logs');

  scanBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if tab URL is valid for scanning
    if (!tab.url || !tab.url.startsWith('http')) {
      alert('Cannot scan this page (only http/https pages are supported).');
      return;
    }

    scanBtn.innerHTML = '⏳ Analyzing...';
    scanBtn.disabled = true;
    
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractFeaturesForPopup,
      args: [tab.url]
    }, async (results) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        alert('Error: ' + chrome.runtime.lastError.message);
        scanBtn.innerHTML = '🔍 Analyze Current Page';
        scanBtn.disabled = false;
        return;
      }
      if (results && results[0] && results[0].result) {
        const features = results[0].result;
        
        chrome.runtime.sendMessage({ action: 'predict', features: features }, (response) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            alert('Prediction error: ' + chrome.runtime.lastError.message);
          } else if (response && response.score !== undefined) {
            displayResults(response.score, features);
          } else {
            alert('Prediction failed.');
          }
          scanBtn.innerHTML = '🔍 Analyze Current Page';
          scanBtn.disabled = false;
        });
      } else {
        alert('Failed to extract features from page.');
        scanBtn.innerHTML = '🔍 Analyze Current Page';
        scanBtn.disabled = false;
      }
    });
  });

  function displayResults(score, features) {
    resultCard.style.display = 'block';
    const percentage = Math.round(score * 100);
    scoreDisplay.textContent = percentage + '%';
    
   let riskText, riskColor, riskBg;

if (percentage <= 35) {
  riskText = '✅ SAFE';
  riskColor = '#00ff00';       // green
  riskBg = '#00ff0033';
  riskMessage = 'This Website Appears Safe to Visit.';
} else if (percentage <= 50) {
  riskText = '⚠️ SUSPICIOUS';
  riskColor = '#ffff00';       // yellow
  riskBg = '#ffff0033';
  riskMessage = 'This Website May Have Potential Risks.';
} else if (percentage <= 80) {
  riskText = '⚠️ PHISHING';
  riskColor = '#ff8c00';       // orange
  riskBg = '#ff8c0033';
  riskMessage = 'This Website is Likely Attempting to Steal Senaitive Information.';
} else {
  riskText = '⚠️ DANGEROUS';
  riskColor = '#ff0000';       // red
  riskBg = '#ff000033';
  riskMessage = 'This Website is Highly Likely to be Malicious and Should be Avoided This Website Immediately.';
}

riskDisplay.innerHTML = `<span class="risk-badge" style="background:${riskBg}; color:${riskColor}; font-size:20px; font-weight:600;">${riskText}</span>`;
  

    const riskMessageDiv = document.getElementById('risk-message');
    if (riskMessageDiv) {
        riskMessageDiv.textContent = riskMessage;
    }

featureGrid.innerHTML = '';

for (const key in features) {
  if (features.hasOwnProperty(key)) {
    const val = features[key];
    let valClass = 'neutral';
    let display = 'Susp';

    if (val === -1) { valClass = 'good'; display = 'Good'; }
    else if (val === 1) { valClass = 'bad'; display = 'Bad'; }

    featureGrid.innerHTML += `
      <div class="feature-item">
        <span class="feature-name">${key}</span>
        <span class="feature-value ${valClass}">${display}</span>
      </div>
    `;
  }
}
    
  }

  function extractFeaturesForPopup(url) {
    const extractor = new FeatureExtractor();
    return extractor.extractFeatures(url, document).catch(err => {
      console.error(err);
      return {};
    });
  }

  settingsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());
  //trainBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());

  clearLogs.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'clear_logs' }, (response) => {
      if (!chrome.runtime.lastError) loadLogs();
    });
  });

  function loadLogs() {
    chrome.runtime.sendMessage({ action: 'get_logs' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }
      if (!response?.detections?.length) {
        logsDiv.innerHTML = '<div style="text-align:center; padding:20px; opacity:0.7;">No detections yet</div>';
        return;
      }
      logsDiv.innerHTML = response.detections.slice(0,8).map(item => {
        const score = Math.round(item.score * 100);
        const cls = score >= 80 ? 'bad' : score >= 60 ? 'neutral' : 'good';
        return `
          <div style="padding:10px; border-bottom:1px solid rgb(0, 0, 0);">
            <div style="font-size:11px; opacity:0.7;">${new Date(item.time).toLocaleString()}</div>
            <div style="font-size:12px; word-break:break-all;">${item.url.substring(0,50)}...</div>
            <div style="font-size:13px; font-weight:600; color:${cls === 'bad' ? '#ff0000' : cls === 'neutral' ? '#ffae00' : '#00d0ff'}">Score: ${score}%</div>
          </div>
        `;
      }).join('');
    });
  }

  loadLogs();
});