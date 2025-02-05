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

    // Add debug counter
    this.processCount = new Map();

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
    // Debug logging
    if (!this.processCount.has(post)) {
      this.processCount.set(post, 0);
    }
    this.processCount.set(post, this.processCount.get(post) + 1);

    if (this.processCount.get(post) > 1) {
      return;
    }

    if (this.processedPosts.has(post)) {
      return;
    }

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
  // First check if we're inside an already filtered container
  if (post.closest('[data-filtered]')) {
    return false;
  }

  // If we're on the jobs page, use class-based detection
  const jobClasses = [
    'job-card-container',
    'jobs-search-results__list-item',
    'discovery-templates-entity-item'
  ];

  if (jobClasses.some(cls => post.classList.contains(cls))) {
    return true;
  }

  // Fallback to text content check for feed posts
  const text = post.textContent.toLowerCase();
  return JOB_INDICATORS.some(indicator => text.includes(indicator));
}

function isJobAllowedForUser(text) {
  const patterns = LOCATION_PATTERNS[userCountry];
  const textLower = text.toLowerCase();

  // First check for filtered locations, as these should block even if remote
  const foundFilteredLocation = patterns.filter.some(location => {
    const locationLower = location.toLowerCase();
    // For state codes, be more strict
    if (locationLower.length === 2) {
      return new RegExp(`\\b${locationLower}\\b`, 'i').test(text) ||
                     new RegExp(`, ${locationLower}\\b`, 'i').test(text);
    }
    // For full location names
    return textLower.includes(locationLower);
  });

  if (foundFilteredLocation) {
    // Even if it's remote, if it mentions a filtered location specifically, don't allow
    // Unless it explicitly allows our location
    if (showRemote && textLower.includes('remote')) {
      const isExplicitlyAllowed = patterns.allowed.some(location => {
        const locationLower = location.toLowerCase();
        return textLower.includes(`${locationLower} (remote)`) ||
                       textLower.includes(`remote ${locationLower}`) ||
                       textLower.includes(`${locationLower} remote`);
      });

      if (isExplicitlyAllowed) {
        return true;
      }
    }

    return false;
  }

  // If no filtered locations found, check if it's in allowed locations
  const hasAllowedLocation = patterns.allowed.some(location => {
    const locationLower = location.toLowerCase();
    return textLower.includes(locationLower);
  });

  if (hasAllowedLocation) {
    return true;
  }

  // If it's remote and doesn't mention any locations, allow it
  return showRemote && textLower.includes('remote') &&
      !textLower.match(/\b(in|at|from)\s+[^,\n\r]+\b/i);
}

function filterPost(postContainer, location) {
  // Check if this post or any of its ancestors are already filtered
  if (postContainer.hasAttribute('data-filtered') || postContainer.closest('[data-filtered]')) {
    return;
  }

  // Set up the container
  postContainer.style.position = 'relative';
  postContainer.setAttribute('data-filtered', 'true');

  // Create overlay FIRST and add it immediately with blur already applied
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
    z-index: 1;
    pointer-events: none;
  `;
  overlay.setAttribute('data-content-overlay', 'true');
  postContainer.appendChild(overlay);

  // Create banner and add it AFTER overlay is in place
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
    cursor: pointer;
    pointer-events: auto;
  `;
  banner.textContent = `Position not available in ${LOCATION_PATTERNS[location].name} - Click to show`;
  banner.setAttribute('data-filter-banner', 'true');
  postContainer.insertBefore(banner, postContainer.firstChild);

  // Handle hover effects
  const handleEnter = () => {
    if (postContainer.hasAttribute('data-filtered')) {
      overlay.style.background = 'rgba(255, 255, 255, 0.5)';
      overlay.style.backdropFilter = 'blur(2px)';
      overlay.style.webkitBackdropFilter = 'blur(2px)';
    }
  };

  const handleLeave = () => {
    if (postContainer.hasAttribute('data-filtered')) {
      overlay.style.background = 'rgba(255, 255, 255, 0.8)';
      overlay.style.backdropFilter = 'blur(4px)';
      overlay.style.webkitBackdropFilter = 'blur(4px)';
    }
  };

  postContainer.addEventListener('mouseenter', handleEnter);
  postContainer.addEventListener('mouseleave', handleLeave);

  // Direct click handler that removes everything immediately
  function removeFilter(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    overlay.remove();
    banner.remove();
    postContainer.style.position = '';
    postContainer.removeEventListener('mouseenter', handleEnter);
    postContainer.removeEventListener('mouseleave', handleLeave);
    postContainer.removeAttribute('data-filtered');
    postContainer.setAttribute('data-user-cleared', 'true');
  }

  banner.addEventListener('click', removeFilter, true);
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
