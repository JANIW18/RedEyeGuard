(function() {
  if (window.redEyeLoaded) return;
  window.redEyeLoaded = true;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'show_warning') {
      showWarning(message.score, message.reasons, message.url);
      sendResponse({ success: true });
    }
    return true;
  });

  function showWarning(score, reasons, url) {
    const existing = document.getElementById('ultimate-phish-warning');
    if (existing) existing.remove();

    const riskLevel = percentage <= 35 ? 'SAFE' :
                  percentage <= 50 ? 'SUSPICIOUS' :
                  percentage <= 80 ? 'PHISHING' :
                  'DANGEROUS';

const color = percentage <= 35 ? '#00ff00' :       // green
              percentage <= 50 ? '#ffff00' :       // yellow
              percentage <= 80 ? '#ffae00' :       // orange
              '#ff0000';                            // red
              
    const banner = document.createElement('div');
    banner.id = 'ultimate-phish-warning';
    banner.style.cssText = `
      position: fixed; top: 20px; right: 20px; width: 400px;
      background: linear-gradient(135deg, #1e1e2f 0%, #2a2a40 100%);
      color: white; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.4);
      z-index: 2147483647; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: slideIn 0.3s ease-out; border: 1px solid rgba(255,255,255,0.1);
      padding: 20px;
    `;

    banner.innerHTML = `
      <style>
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
      </style>
      <div style="display: flex; align-items: center; margin-bottom: 15px;">
        <div style="width:60px; height:60px; background:${color}; border-radius:30px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:24px; margin-right:15px;">${percentage}%</div>
        <div>
          <div style="font-weight:700; font-size:20px;">🛡️ Ultimate ML Shield</div>
          <div style="font-size:14px; opacity:0.9;">${riskLevel} • 30-Feature Analysis</div>
        </div>
      </div>
      <div style="background:rgba(0,0,0,0.2); padding:15px; border-radius:12px; margin-bottom:15px;">
        <div style="font-weight:600; margin-bottom:8px;">🔍 XGBoost Analysis:</div>
        <div style="font-size:13px;">${reasons[0]}</div>
        <div style="font-size:11px; margin-top:8px; opacity:0.7;">Based on 30 structural and behavioral features</div>
      </div>
      <div style="display: flex; gap: 10px;">
        <button id="close-btn" style="flex:1; padding:12px; background:rgba(255,255,255,0.1); border:none; color:white; border-radius:8px; cursor:pointer; font-weight:600;">Close</button>
        <button id="trust-btn" style="flex:1; padding:12px; background:#48dbfb; border:none; color:white; border-radius:8px; cursor:pointer; font-weight:600;">✅ Trust This Site</button>
      </div>
    `;

    document.body.appendChild(banner);

    document.getElementById('close-btn').onclick = () => {
      banner.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => banner.remove(), 300);
    };

    document.getElementById('trust-btn').onclick = () => {
      try {
        const domain = new URL(url).hostname;
        chrome.runtime.sendMessage({ action: 'add_to_whitelist', domain });
        banner.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => banner.remove(), 300);
      } catch (e) {}
    };

    setTimeout(() => {
      if (document.body.contains(banner)) {
        banner.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => banner.remove(), 300);
      }
    }, 30000);
  }
})();