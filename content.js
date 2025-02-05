const {
  LOCATION_PATTERNS,
  LOCATION_PHRASES,
  JOB_INDICATORS,
  POST_SELECTORS,
  CONTENT_SELECTORS
} = CONSTANTS;

// Default settings
let userCountry = 'US';
let showRemote = true;

// Load saved settings from Chrome storage
chrome.storage.sync.get(['country', 'showRemote'], (result) => {
  if (result.country) userCountry = result.country;
  if (result.showRemote !== undefined) showRemote = result.showRemote;
});

class ProgressiveLoader {
  constructor() {
    this.processedPosts = new Set();
    this.isProcessing = false;
    this.queue = [];
    this.batchSize = 5;
    this.processingDelay = 100;

    this.viewportObserver = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        root: null,
        rootMargin: '100px 0px',
        threshold: 0.1
      }
    );
  }

  addToQueue(post) {
    if (this.processedPosts.has(post)) return;

    this.queue.push(post);
    this.processedPosts.add(post);

    if (!this.isProcessing) {
      this.processBatch();
    }
  }

  async processBatch() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const batch = this.queue.splice(0, this.batchSize);

    batch.forEach(post => {
      if (isJobPost(post)) {
        const text = post.textContent.toLowerCase();
        if (!isJobAllowedForUser(text)) {
          filterPost(post, userCountry);
        }
      }
    });

    if (this.queue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, this.processingDelay));
      requestAnimationFrame(() => this.processBatch());
    } else {
      this.isProcessing = false;
    }
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.addToQueue(entry.target);
        this.viewportObserver.unobserve(entry.target);
      }
    });
  }

  observePost(post) {
    if (!this.processedPosts.has(post)) {
      this.viewportObserver.observe(post);
    }
  }
}

function isJobPost(post) {
  const text = post.textContent.toLowerCase();
  return JOB_INDICATORS.some(indicator => text.includes(indicator));
}

function isJobAllowedForUser(text) {
  const patterns = LOCATION_PATTERNS[userCountry];
  const textLower = text.toLowerCase();

  // Check for phrases like "based in Europe" etc.
  for (const phrase of LOCATION_PHRASES) {
    const index = textLower.indexOf(phrase);
    if (index !== -1) {
      // Look at the next few words after the phrase
      const followingText = textLower.slice(index + phrase.length, index + phrase.length + 50);
      if (patterns.filter.some(location => followingText.includes(location.toLowerCase()))) {
        return false;
      }
    }
  }

  // Check for remote work allowances
  if (showRemote && textLower.includes('remote')) {
    const isAllowed = patterns.allowed.some(location =>
      textLower.includes(`remote from ${location}`) ||
      textLower.includes(`${location} remote`) ||
      textLower.includes(`remote ${location}`) ||
      textLower.includes(`remote work from ${location}`) ||
      textLower.includes(`remote position in ${location}`) ||
      textLower.includes(`${location}-based remote`)
    );
    if (isAllowed) return true;
  }

  // Check for general location restrictions
  return !patterns.filter.some(location => {
    const restrictivePatterns = [
      `\\b${location}\\b`,
      `${location} only`,
      `${location}( |-)based`,
      `in ${location}`,
      `from ${location}`,
      `within ${location}`,
      `${location} region`,
      `${location} area`,
      `${location} location`,
      `position in ${location}`,
      `in ${location}`,
      `remote within ${location}`,
      `role in ${location}`,
      `located in ${location}`,
      `working in ${location}`,
      `based in ${location}`,
      `work in ${location}`,
      `based in ${location}`,
      `located in ${location}`,
      `relocate to ${location}`,
      `must be in ${location}`,
      `must live in ${location}`,
      `must reside in ${location}`,
      `${location} office`,
      `${location} timezone`,
      `${location} working hours`,
      `authorized to work in ${location}`,
      `right to work in ${location}`,
      `valid work permit in ${location}`,
      `${location} work authorization`
    ];
    const combinedPattern = new RegExp(restrictivePatterns.join('|'), 'i');
    return combinedPattern.test(text);
  });
}

function filterPost(postContainer, location) {
  if (postContainer.hasAttribute('data-filtered')) return;

  // Set up the container
  postContainer.style.position = 'relative';
  postContainer.setAttribute('data-filtered', 'true');

  // Create our warning banner
  const banner = document.createElement('div');
  banner.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    background: #ff595e;
    color: white;
    padding: 8px;
    text-align: center;
    z-index: 2;
    font-size: 14px;
    transition: all 0.3s ease-in-out;
    pointer-events: auto;
  `;
  banner.textContent = `Position not available in ${LOCATION_PATTERNS[location].name} - Click to show`;
  banner.setAttribute('data-filter-banner', 'true');

  // Add banner at the top
  postContainer.insertBefore(banner, postContainer.firstChild);

  // Create a single overlay for the entire job card
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    transition: all 0.3s ease-in-out;
    z-index: 1;
    pointer-events: none;
  `;
  overlay.setAttribute('data-content-overlay', 'true');

  // Add the overlay
  postContainer.appendChild(overlay);

  // Handle hover effects
  const handleEnter = () => {
    if (postContainer.hasAttribute('data-filtered')) {
      overlay.style.backdropFilter = 'blur(2px)';
      overlay.style.webkitBackdropFilter = 'blur(2px)';
      overlay.style.background = 'rgba(255, 255, 255, 0.5)';
    }
  };

  const handleLeave = () => {
    if (postContainer.hasAttribute('data-filtered')) {
      overlay.style.backdropFilter = 'blur(4px)';
      overlay.style.webkitBackdropFilter = 'blur(4px)';
      overlay.style.background = 'rgba(255, 255, 255, 0.8)';
    }
  };

  postContainer.addEventListener('mouseenter', handleEnter);
  postContainer.addEventListener('mouseleave', handleLeave);

  // Handle click to show
  banner.addEventListener('click', (e) => {
    e.stopPropagation();

    requestAnimationFrame(() => {
      overlay.style.opacity = '0';
      banner.style.transform = 'translateY(-100%)';
      banner.style.opacity = '0';

      setTimeout(() => {
        overlay.remove();
        banner.remove();
        postContainer.style.position = '';
        postContainer.removeEventListener('mouseenter', handleEnter);
        postContainer.removeEventListener('mouseleave', handleLeave);
        postContainer.removeAttribute('data-filtered');
        postContainer.setAttribute('data-user-cleared', 'true');
      }, 300);
    });
  });
}

// Listen for settings changes from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'settingsUpdated') {
    userCountry = message.settings.country;
    showRemote = message.settings.showRemote;
    reprocessPosts();
  }
});

function reprocessPosts() {
  document.querySelectorAll('[data-filtered]').forEach(post => {
    // Remove all overlays
    post.querySelectorAll('[data-content-overlay]').forEach(overlay => overlay.remove());

    // Remove the banner
    const banner = post.querySelector('[data-filter-banner]');
    if (banner) banner.remove();

    // Reset all content area styles
    CONTENT_SELECTORS.forEach(selector => {
      post.querySelectorAll(selector).forEach(area => {
        area.style.position = '';
      });
    });

    // Reset post container styles
    post.style.position = '';
    post.removeAttribute('data-filtered');
    post.removeAttribute('data-user-cleared');
  });

  // Reprocess with new settings
  document.querySelectorAll(POST_SELECTORS).forEach(post => {
    if (isJobPost(post)) {
      const text = post.textContent.toLowerCase();
      if (!isJobAllowedForUser(text)) {
        filterPost(post, userCountry);
      }
    }
  });
}

// Initialize loader
const loader = new ProgressiveLoader();

// Setup mutation observer
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.matches?.(POST_SELECTORS)) {
          loader.observePost(node);
        }
        node.querySelectorAll?.(POST_SELECTORS)?.forEach(post => {
          loader.observePost(post);
        });
      }
    });
  });
});

// Initialize extension
function initialize() {
  document.querySelectorAll(POST_SELECTORS).forEach(post => {
    loader.observePost(post);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  let scrollTimeout;
  window.addEventListener('scroll', () => {
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      document.querySelectorAll(`${POST_SELECTORS}:not([data-filtered])`).forEach(post => {
        if (!loader.processedPosts.has(post)) {
          loader.observePost(post);
        }
      });
    }, 150);
  }, { passive: true });
}

// Start when ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
