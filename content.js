// content.js
(function() {
  let navContainer = null;
  let navList = null;

  // Gemini uses various classes for user messages, but often attributes like data-test-id are more stable
  // We'll try to find common patterns for user message blocks
  const USER_QUERY_SELECTORS = [
    'user-query',
    '[data-test-id="user-query"]',
    '[data-test-id="user-query-content"]',
    '.user-query-content',
    'message[is-user="true"]'
  ];

  function initNavigator() {
    if (document.getElementById('gemini-chat-navigator')) {
      return;
    }

    navContainer = document.createElement('div');
    navContainer.id = 'gemini-chat-navigator';
    // 默认收起
    navContainer.className = 'collapsed';
    
    // SVG paths
    const PATH_LEFT = 'M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z';
    const PATH_RIGHT = 'M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z';
    
    const header = document.createElement('div');
    header.className = 'navigator-header';
    
    // Auto collapse when mouse leaves the navigator
    navContainer.addEventListener('mouseleave', () => {
      if (!navContainer.classList.contains('collapsed')) {
        navContainer.classList.add('collapsed');
      }
    });

    header.addEventListener('click', () => {
      navContainer.classList.toggle('collapsed');
    });

    // Remove text title as requested
    
    // SVG icon for toggle (now only visible when collapsed)
    const toggleIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    toggleIcon.setAttribute('viewBox', '0 0 24 24');
    toggleIcon.setAttribute('width', '24');
    toggleIcon.setAttribute('height', '24');
    toggleIcon.className = 'navigator-toggle';
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // Initial path: Left because it starts collapsed
    path.setAttribute('d', PATH_LEFT);
    toggleIcon.appendChild(path);

    header.appendChild(toggleIcon);
    navContainer.appendChild(header);

    navList = document.createElement('div');
    navList.id = 'gemini-navigator-list';
    navContainer.appendChild(navList);

    document.body.appendChild(navContainer);
  }

  function getUserQueries() {
    // Try each selector until we find nodes
    for (const selector of USER_QUERY_SELECTORS) {
      const nodes = document.querySelectorAll(selector);
      if (nodes && nodes.length > 0) {
        return nodes;
      }
    }
    
    // Fallback: search for elements containing typical user prompt structures if the direct selectors fail
    // In Gemini, user messages often appear in specific containers without simple classes
    // This looks for div elements that have a specific structure usually found in user messages.
    // However, it's safer to rely on the primary selectors first.
    return [];
  }

  function updateNavigator() {
    if (!navList) return;

    const userQueries = getUserQueries();
    
    if (userQueries.length === 0) {
      navList.innerHTML = '<div id="gemini-navigator-empty">暂未发现用户问题 / No queries found</div>';
      return;
    }

    // Clear current list
    navList.innerHTML = '';

    userQueries.forEach((queryNode, index) => {
      // Add ID if not exists
      const anchorId = `gemini-user-query-${index}`;
      
      // Usually the actual text is inside the node, we want the text content
      let text = queryNode.textContent.trim();
      
      // Clean up text (remove edit/copy button text if they are captured)
      // Usually user-query has clean text, but sometimes it might include "Edit text" etc.
      // Remove "你说" prefix if it exists
      if (text.startsWith('你说')) {
        text = text.substring(2).trim();
      }
      if (!text) return;
      
      // If text is too long, we might just use the first line or limit characters in CSS
      // We keep full text in title attribute for hover, but CSS text-overflow handles the visual truncation

      const item = document.createElement('div');
      item.className = 'navigator-item';
      item.textContent = text;
      item.title = text; // hover to show full text

      item.addEventListener('click', () => {
        // Find the nearest common ancestor or scroll the node itself
        // Sometimes the queryNode is hidden or inside a flex container that doesn't scroll well
        // We scroll the closest wrapper that might be the main container, or just the node.
        const scrollTarget = queryNode.closest('message') || queryNode.closest('[class*="query"]') || queryNode;
        
        scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Highlight effect
        const originalBg = scrollTarget.style.backgroundColor;
        const originalTransition = scrollTarget.style.transition;
        scrollTarget.style.transition = 'background-color 0.5s';
        scrollTarget.style.backgroundColor = 'rgba(255, 235, 59, 0.4)'; // Yellowish highlight
        
        setTimeout(() => {
          scrollTarget.style.backgroundColor = originalBg;
          setTimeout(() => {
            scrollTarget.style.transition = originalTransition;
            if (scrollTarget.style.length === 0) {
              scrollTarget.removeAttribute('style');
            }
          }, 500);
        }, 1500);
      });

      navList.appendChild(item);
    });
  }

  // Use a debounce function to limit update frequency
  let updateTimeout = null;
  function debounceUpdate() {
    if (updateTimeout) clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
      updateNavigator();
    }, 500); // 500ms delay after DOM mutations stop
  }

  function observeDOM() {
    initNavigator();
    updateNavigator(); // Initial check

    // We observe the main body or the specific chat container if we can find it
    // Gemini chat container is usually inside main or specific div
    const targetNode = document.body;
    
    if (!targetNode) return;

    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      
      // Only trigger update if meaningful nodes are added/removed
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
            // We ignore changes within our own navigator
            if (mutation.target.id !== 'gemini-chat-navigator' && 
                mutation.target.id !== 'gemini-navigator-list') {
              shouldUpdate = true;
              break;
            }
          }
        } else if (mutation.type === 'characterData') {
           shouldUpdate = true;
           break;
        }
      }
      
      if (shouldUpdate) {
        debounceUpdate();
      }
    });

    observer.observe(targetNode, { 
      childList: true, 
      subtree: true,
      characterData: true // Sometimes text is updated dynamically (e.g., editing prompt)
    });
  }

  // Ensure execution after DOM is somewhat ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeDOM);
  } else {
    observeDOM();
  }

  // Handle SPA navigation within Gemini (it uses History API)
  let lastUrl = location.href; 
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      // On URL change, we might need a fresh update
      debounceUpdate();
    }
  }).observe(document, {subtree: true, childList: true});

})();
