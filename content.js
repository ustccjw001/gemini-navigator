// content.js
(function() {
  let navContainer = null;
  let navList = null;
  let filterToggle = null;

  // State
  let showFavoritesOnly = false; // 默认不筛选收藏
  let favorites = new Set(JSON.parse(localStorage.getItem('gemini_navigator_favorites') || '[]'));
  let customLabels = JSON.parse(localStorage.getItem('gemini_navigator_labels') || '{}');
  let isEditing = false; // 标记是否正在编辑

  function saveFavorites() {
    localStorage.setItem('gemini_navigator_favorites', JSON.stringify([...favorites]));
  }

  function saveLabels() {
    localStorage.setItem('gemini_navigator_labels', JSON.stringify(customLabels));
  }

  const STAR_OUTLINE_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/></svg>`;
  const STAR_FILLED_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="#fbbc04"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;
  const EDIT_SVG = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`;
  const ARROW_UP_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/></svg>`;


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

    // SVG icon for toggle (now visible when collapsed or expanded)
    const toggleIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    toggleIcon.setAttribute('viewBox', '0 0 24 24');
    toggleIcon.setAttribute('width', '24');
    toggleIcon.setAttribute('height', '24');
    // Ensure no inline fill overrides CSS
    toggleIcon.removeAttribute('fill');
    toggleIcon.className = 'navigator-toggle';
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    path.setAttribute('d', PATH_LEFT);
    // Explicitly set path fill to inherit or currentColor to respect CSS
    path.setAttribute('fill', 'currentColor');
    toggleIcon.appendChild(path);

    // Filter toggle
    filterToggle = document.createElement('div');
    filterToggle.className = 'header-btn filter-toggle';
    filterToggle.title = '切换收藏筛选 / Toggle Favorites Filter';
    filterToggle.innerHTML = showFavoritesOnly ? STAR_FILLED_SVG : STAR_OUTLINE_SVG;
    
    filterToggle.addEventListener('click', (e) => {
      e.stopPropagation(); // 防止触发 header 的收起事件
      showFavoritesOnly = !showFavoritesOnly;
      filterToggle.innerHTML = showFavoritesOnly ? STAR_FILLED_SVG : STAR_OUTLINE_SVG;
      updateNavigator();
    });

    // Scroll to top button
    const scrollTopBtn = document.createElement('div');
    scrollTopBtn.className = 'header-btn scroll-top-btn';
    scrollTopBtn.title = '加载更早会话 / Scroll to Top';
    scrollTopBtn.innerHTML = ARROW_UP_SVG;
    
    scrollTopBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Gemini's scrolling is tricky. We try to find the deepest scrollable container.
      // Often it's `.infinite-scroller`, `main`, or `.message-list`
      const containers = [
        document.querySelector('.infinite-scroller'),
        document.querySelector('chat-window'),
        document.querySelector('main'),
        document.querySelector('.conversation-container'),
        document.querySelector('[data-test-id="chat-history"]'),
        document.body,
        document.documentElement
      ];

      // Find the first container that actually has scrollable content
      let scrolled = false;
      for (const container of containers) {
        if (container && (container.scrollHeight > container.clientHeight)) {
          container.scrollTo({ top: 0, behavior: 'smooth' });
          scrolled = true;
          // Don't break, scroll all possible containers just in case Gemini uses nested scrolling
        }
      }

      // Fallback: Just scroll the window
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Another fallback for Gemini specific behavior: simulate pressing "Page Up" or "Home"
      // Sometimes Gemini intercepts keyboard events for scrolling
      try {
        const firstMessage = document.querySelector('message, [class*="query"]');
        if (firstMessage) {
           firstMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } catch (err) {}
    });

    const headerActions = document.createElement('div');
    headerActions.className = 'header-actions';
    headerActions.appendChild(scrollTopBtn);
    headerActions.appendChild(filterToggle);

    header.appendChild(toggleIcon);
    header.appendChild(headerActions);
    navContainer.appendChild(header);

    navList = document.createElement('div');
    navList.id = 'gemini-navigator-list';
    navContainer.appendChild(navList);

    document.body.appendChild(navContainer);
  }

  function getUserQueries() {
    for (const selector of USER_QUERY_SELECTORS) {
      const nodes = document.querySelectorAll(selector);
      if (nodes && nodes.length > 0) {
        return nodes;
      }
    }
    return [];
  }

  function updateNavigator() {
    if (!navList || isEditing) return; // 如果正在编辑，暂停更新以防输入框被重置

    const queryNodes = Array.from(getUserQueries());
    
    // Clear current list
    navList.innerHTML = '';

    let displayedCount = 0;

    // 倒序排列：最新的问题排在上面
    queryNodes.reverse().forEach((queryNode, index) => {
      let text = queryNode.textContent.trim();
      
      if (text.startsWith('你说')) {
        text = text.substring(2).trim();
      }
      if (!text) return;
      
      const originalText = text;
      const displayText = customLabels[originalText] || originalText;
      
      const isFav = favorites.has(originalText);
      if (showFavoritesOnly && !isFav) return;

      displayedCount++;

      const item = document.createElement('div');
      item.className = 'navigator-item';
      
      const textSpan = document.createElement('span');
      textSpan.className = 'item-text';
      textSpan.textContent = displayText;
      textSpan.title = displayText;

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'item-actions';

      const editSpan = document.createElement('span');
      editSpan.className = 'item-edit';
      editSpan.innerHTML = EDIT_SVG;
      editSpan.title = '重命名 / Rename';

      const starSpan = document.createElement('span');
      starSpan.className = 'item-star';
      starSpan.innerHTML = isFav ? STAR_FILLED_SVG : STAR_OUTLINE_SVG;
      
      editSpan.addEventListener('click', (e) => {
        e.stopPropagation();
        
        isEditing = true; // 开启编辑状态
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = textSpan.textContent;
        input.className = 'item-edit-input';
        
        item.insertBefore(input, textSpan);
        item.removeChild(textSpan);
        
        input.focus();
        actionsDiv.style.display = 'none';

        function finishEdit() {
          isEditing = false; // 结束编辑状态
          const newVal = input.value.trim();
          if (newVal && newVal !== originalText) {
            customLabels[originalText] = newVal;
          } else if (!newVal || newVal === originalText) {
            // If empty or same as original, revert to original
            delete customLabels[originalText];
          }
          saveLabels();
          updateNavigator();
        }

        input.addEventListener('blur', finishEdit);
        input.addEventListener('keydown', (ke) => {
          if (ke.key === 'Enter') {
            input.blur();
          } else if (ke.key === 'Escape') {
            isEditing = false; // 取消编辑
            updateNavigator();
          }
          ke.stopPropagation();
        });
      });

      starSpan.addEventListener('click', (e) => {
        e.stopPropagation(); // 防止触发跳转事件
        if (favorites.has(originalText)) {
          favorites.delete(originalText);
        } else {
          favorites.add(originalText);
        }
        saveFavorites();
        starSpan.innerHTML = favorites.has(originalText) ? STAR_FILLED_SVG : STAR_OUTLINE_SVG;
        // 如果当前是收藏筛选模式，取消收藏后直接更新列表
        if (showFavoritesOnly) {
          updateNavigator();
        }
      });

      actionsDiv.appendChild(editSpan);
      actionsDiv.appendChild(starSpan);

      item.appendChild(textSpan);
      item.appendChild(actionsDiv);

      item.addEventListener('click', (e) => {
        // 如果点到了输入框，不执行跳转
        if (e.target.tagName.toLowerCase() === 'input') return;
        
        const scrollTarget = queryNode.closest('message') || queryNode.closest('[class*="query"]') || queryNode;
        scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Highlight effect
        const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const highlightColor = isDarkMode ? 'rgba(255, 235, 59, 0.2)' : 'rgba(255, 235, 59, 0.4)';
        
        const originalBg = scrollTarget.style.backgroundColor;
        const originalTransition = scrollTarget.style.transition;
        scrollTarget.style.transition = 'background-color 0.5s';
        scrollTarget.style.backgroundColor = highlightColor;
        
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

    if (displayedCount === 0) {
      navList.innerHTML = showFavoritesOnly 
        ? '<div id="gemini-navigator-empty">暂无收藏 / No favorites found</div>'
        : '<div id="gemini-navigator-empty">暂未发现用户问题 / No queries found</div>';
    }
  }

  let updateTimeout = null;
  function debounceUpdate() {
    if (updateTimeout) clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
      updateNavigator();
    }, 500);
  }

  function observeDOM() {
    initNavigator();
    updateNavigator();

    const targetNode = document.body;
    if (!targetNode) return;

    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
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
      characterData: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeDOM);
  } else {
    observeDOM();
  }

  let lastUrl = location.href; 
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      debounceUpdate();
    }
  }).observe(document, {subtree: true, childList: true});

})();
