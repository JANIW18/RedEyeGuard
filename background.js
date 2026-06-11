importScripts('ort.min.js');

let model = null;
let scaler = null;
let featureColumns = null;
let whitelist = new Set();

async function loadModel() {
  try {
    const modelResponse = await fetch(chrome.runtime.getURL('model.json'));
    const scalerResponse = await fetch(chrome.runtime.getURL('scaler.json'));
    const featuresResponse = await fetch(chrome.runtime.getURL('feature_columns.json'));
    
    model = await modelResponse.json();
    scaler = await scalerResponse.json();
    featureColumns = await featuresResponse.json();
    
    console.log('Model loaded successfully');
  } catch (error) {
    console.error('Failed to load model:', error);
  }
}

loadModel();

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab?.url) return;
  if (!tab.url.startsWith('http')) return;
  if (whitelist.has(new URL(tab.url).hostname)) return;
  
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: extractAndPredict,
      args: [tab.url]
    }).catch(err => {
      console.warn('Could not execute script on tab', tabId, err);
      return null;
    });
    
    if (results && results[0] && results[0].result) {
      const { score, features } = results[0].result;
      
      if (score > 0.35) {
        chrome.tabs.sendMessage(tabId, {
          action: 'show_warning',
          score: score,
          reasons: [`ML Confidence: ${Math.round(score * 100)}%`],
          url: tab.url
        }).catch(() => {});
        logDetection(tab.url, score);
      }
    }
  } catch (error) {
    console.error('Analysis error:', error);
  }
});

function extractAndPredict(url) {
  return new Promise((resolve) => {
    const extractor = new FeatureExtractor();
    extractor.extractFeatures(url, document).then(features => {
      chrome.runtime.sendMessage({
        action: 'predict',
        features: features
      }, (response) => {
        resolve(response);
      });
    }).catch(err => {
      console.error('Feature extraction error:', err);
      resolve({ score: 0.5, features: {} });
    });
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      if (message.action === 'predict') {
        const scaled = scaleFeatures(message.features, scaler, featureColumns);
        const score = predictXGBoost(scaled, model);
        sendResponse({ score: score, features: message.features });
      } else if (message.action === 'add_to_whitelist') {
        whitelist.add(message.domain);
        await chrome.storage.local.set({ whitelist: Array.from(whitelist) });
        sendResponse({ success: true });
      } else if (message.action === 'remove_from_whitelist') {
        whitelist.delete(message.domain);
        await chrome.storage.local.set({ whitelist: Array.from(whitelist) });
        sendResponse({ success: true });
      } else if (message.action === 'get_whitelist') {
        sendResponse({ whitelist: Array.from(whitelist) });
      } else if (message.action === 'get_logs') {
        const data = await chrome.storage.local.get(['detections']);
        sendResponse({ detections: data.detections || [] });
      } else if (message.action === 'clear_logs') {
        await chrome.storage.local.set({ detections: [] });
        sendResponse({ success: true });
      } else if (message.action === 'save_settings') {
        await chrome.storage.sync.set({ settings: message.settings });
        sendResponse({ success: true });
      } else if (message.action === 'get_settings') {
        const settings = await chrome.storage.sync.get(['settings']);
        sendResponse({ settings: settings.settings || { enabled: true, threshold: 0.7, auto_train: false, dataset_path: 'dataset1.csv' } });
      } else {
        sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Message handler error:', error);
      sendResponse({ error: error.message });
    }
  })();
  return true;
});

function scaleFeatures(features, scaler, columns) {
  const vector = [];
  columns.forEach(col => {
    vector.push(features[col] || 0);
  });
  return vector.map((val, i) => (val - scaler.mean[i]) / scaler.scale[i]);
}

function predictXGBoost(scaledFeatures, model) {
  // Simplified linear approximation using feature importances
  let score = 0;
  for (let i = 0; i < model.weights.length; i++) {
    score += scaledFeatures[i] * model.weights[i];
  }
  return 1 / (1 + Math.exp(-score));
}

async function logDetection(url, score) {
  try {
    const data = await chrome.storage.local.get(['detections']);
    const detections = data.detections || [];
    detections.unshift({
      time: Date.now(),
      url: url,
      score: score,
      date: new Date().toLocaleString()
    });
    await chrome.storage.local.set({ detections: detections.slice(0, 100) });
  } catch (error) {
    console.error('Logging error:', error);
  }
}