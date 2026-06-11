class FeatureExtractor {
  constructor() {
    this.featureNames = [
      'having_IPhaving_IP_Address', 'URLURL_Length', 'Shortining_Service',
      'having_At_Symbol', 'double_slash_redirecting', 'Prefix_Suffix',
      'having_Sub_Domain', 'SSLfinal_State', 'Domain_registeration_length',
      'Favicon', 'port', 'HTTPS_token', 'Request_URL', 'URL_of_Anchor',
      'Links_in_tags', 'SFH', 'Submitting_to_email', 'Abnormal_URL',
      'Redirect', 'on_mouseover', 'RightClick', 'popUpWidnow', 'Iframe',
      'age_of_domain', 'DNSRecord', 'web_traffic', 'Page_Rank',
      'Google_Index', 'Links_pointing_to_page', 'Statistical_report'
    ];
  }

  async extractFeatures(url, document) {
    const features = {};
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const fullUrl = url.toLowerCase();

    // 1. having_IPhaving_IP_Address
    features.having_IPhaving_IP_Address = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ? 1 : -1;

    // 2. URLURL_Length
   
const baseUrl = url.split('?')[0];  // remove query parameters
const urlLength = baseUrl.length;

if (urlLength < 54) features.URLURL_Length = -1;        // safe
else if (urlLength >= 54 && urlLength <= 75) features.URLURL_Length = 0; // suspicious
else features.URLURL_Length = 1;                        // phishing

    // 3. Shortining_Service
    const shorteners = ['bit.ly', 'tinyurl', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'short.link'];
    features.Shortining_Service = shorteners.some(s => hostname.includes(s)) ? 1 : -1;

    // 4. having_At_Symbol
    features.having_At_Symbol = fullUrl.includes('@') ? 1 : -1;

    // 5. double_slash_redirecting
    const lastDoubleSlash = fullUrl.lastIndexOf('//');
    features.double_slash_redirecting = lastDoubleSlash > 7 ? 1 : -1;

    // 6. Prefix_Suffix
    features.Prefix_Suffix = hostname.includes('-') ? 1 : -1;

    // 7. having_Sub_Domain

const subdomainParts = hostname.split('.');
const subdomainCount = subdomainParts.length - 2;

if (subdomainCount <= 1)
    features.having_Sub_Domain = -1;  // safe
else if (subdomainCount === 2)
    features.having_Sub_Domain = 0;   // suspicious
else
    features.having_Sub_Domain = 1;   // phishing

    // 8. SSLfinal_State
   if (urlObj.protocol === "https:") {
    features.SSLfinal_State = -1; // legitimate
} else {
    features.SSLfinal_State = 1; // phishing risk
}

    // 9. Domain_registeration_length
    const isNewDomain = await this.checkDomainAge(hostname);
    features.Domain_registeration_length = isNewDomain ? -1 : 1;

    // 10. Favicon
    features.Favicon = this.checkFavicon(document) ? -1 : 1;

    // 11. port
    const port = urlObj.port || (urlObj.protocol === 'https:' ? '443' : '80');
    const preferredPorts = ['80', '443'];
    features.port = preferredPorts.includes(port) ? -1 : 1;

    // 12. HTTPS_token
    features.HTTPS_token = hostname.includes('https') ? 1 : -1;

    // 13. Request_URL
    features.Request_URL = this.analyzeExternalRequests(document, hostname);

    // 14. URL_of_Anchor
    features.URL_of_Anchor = this.analyzeAnchors(document, hostname);

    // 15. Links_in_tags
    features.Links_in_tags = this.analyzeLinksInTags(document, hostname);

    // 16. SFH
    features.SFH = this.analyzeSFH(document, hostname, fullUrl);

    // 17. Submitting_to_email
    features.Submitting_to_email = this.checkMailToForms(document) ? 1 : -1;

    // 18. Abnormal_URL
    features.Abnormal_URL = this.checkAbnormalURL(urlObj, hostname) ? 1 : -1;

    // 19. Redirect
    features.Redirect = this.countRedirects(fullUrl) > 1 ? 1 : -1;

    // 20. on_mouseover
    features.on_mouseover = this.checkMouseOver(document) ? 1 : -1;

    // 21. RightClick
    features.RightClick = this.checkRightClickDisabled(document) ? 1 : -1;

    // 22. popUpWidnow
    features.popUpWidnow = this.checkPopups(document) ? 1 : -1;

    // 23. Iframe
    features.Iframe = document.querySelector('iframe') ? 1 : -1;

    // 24. age_of_domain
    const domainAge = await this.getDomainAge(hostname);
    features.age_of_domain = domainAge > 180 ? -1 : 1;

    // 25. DNSRecord
    features.DNSRecord = await this.checkDNSRecord(hostname) ? -1 : 1;

    // 26. web_traffic
    features.web_traffic = await this.getWebTraffic(hostname);

    // 27. Page_Rank
    features.Page_Rank = await this.getPageRank(hostname);

    // 28. Google_Index
    features.Google_Index = await this.checkGoogleIndex(hostname) ? 1 : -1;

    // 29. Links_pointing_to_page
    features.Links_pointing_to_page = await this.getBacklinks(hostname);

    // 30. Statistical_report
    features.Statistical_report = await this.checkPhishStats(hostname) ? 1 : -1;

    return features;
  }

  async getCertificateIssuer() { return 'Trusted'; }
  async checkDomainAge(hostname) { return false; }
  checkFavicon(document) {
    const favicon = document.querySelector('link[rel*="icon"]');
      return favicon ? true : false;
  
  }
  analyzeExternalRequests(document, hostname) {
    const elements = document.querySelectorAll('img, script, link');
    let external = 0, total = 0;
    elements.forEach(el => {
      const src = el.src || el.href;
      if (src) {
        try {
          const url = new URL(src, window.location.href);
          if (url.hostname !== hostname) external++;
          total++;
        } catch {}
      }
    });
    if (total === 0) return -1;
    const percentage = (external / total) * 100;
    if (percentage < 40) return -1;
    if (percentage >= 40 && percentage < 70) return 0;
    return 1;
  }
  analyzeAnchors(document, hostname) {
    const anchors = document.querySelectorAll('a[href]');
    let external = 0, total = 0;
    anchors.forEach(a => {
      try {
        const url = new URL(a.href, window.location.href);
        if (url.hostname !== hostname) external++;
        total++;
      } catch {}
    });
    if (total === 0) return -1;
    const percentage = (external / total) * 100;
    if (percentage < 31) return -1;
    if (percentage >= 31 && percentage < 67) return 0;
    return 1;
  }
  analyzeLinksInTags(document, hostname) {
    const tags = document.querySelectorAll('link, script');
    let external = 0, total = 0;
    tags.forEach(tag => {
      const src = tag.src || tag.href;
      if (src) {
        try {
          const url = new URL(src, window.location.href);
          if (url.hostname !== hostname) external++;
          total++;
        } catch {}
      }
    });
    if (total === 0) return -1;
    const percentage = (external / total) * 100;
    if (percentage < 17) return -1;
    if (percentage >= 17 && percentage < 81) return 0;
    return 1;
  }
  analyzeSFH(document, hostname, fullUrl) {
    const forms = document.querySelectorAll('form[action]');
    if (forms.length === 0) return -1;
    for (let form of forms) {
      const action = form.getAttribute('action').toLowerCase();
      if (action === '' || action === 'about:blank') return -1;
      if (action.startsWith('#')) return 0;
      try {
        const actionUrl = new URL(action, window.location.href);
        if (actionUrl.hostname !== hostname) return 1;
      } catch {
        return 1;
      }
    }
    return -1;
  }
  checkMailToForms(document) {
    return document.querySelectorAll('form[action*="mailto:"]').length > 0;
  }
  checkAbnormalURL(urlObj, hostname) {
    return hostname.replace('www.', '') !== urlObj.hostname.replace('www.', '');
  }
  countRedirects(fullUrl) {
    return (fullUrl.match(/\/\//g) || []).length - 1;
  }
  checkMouseOver(document) {
    const elements = document.querySelectorAll('*[onmouseover]');
    for (let el of elements) {
      const onmouseover = el.getAttribute('onmouseover');
      if (onmouseover && onmouseover.includes('window.status')) return true;
    }
    return false;
  }
  checkRightClickDisabled(document) {
    return document.body.hasAttribute('oncontextmenu');
  }
  checkPopups(document) {
    return !!document.querySelector('*[onclick*="window.open"], *[onclick*="popup"]');
  }
  async getDomainAge(hostname) { return 365; }
  async checkDNSRecord(hostname) { return true; }
  async getWebTraffic(hostname) { return -1; }
  async getPageRank(hostname) { return -1; }
  async checkGoogleIndex(hostname) { return true; }
  async getBacklinks(hostname) { return -1; }
  async checkPhishStats(hostname) { return false; }
}