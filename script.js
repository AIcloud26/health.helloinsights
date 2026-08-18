/*
 * health.helloinsights.online — Shared JavaScript
 * ES5 compatible
 * Handles: article loading, search, filtering, pagination, UI
 */
(function () {
  'use strict';

  /* --------------------------------------------------
   * State
   * -------------------------------------------------- */
  var state = {
    articles: [],
    filteredArticles: [],
    currentPage: 1,
    perPage: 6,
    currentCategory: 'all',
    searchQuery: '',
    totalPages: 1
  };

  /* --------------------------------------------------
   * DOM Ready
   * -------------------------------------------------- */
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  /* --------------------------------------------------
   * Load Articles from JSON
   * -------------------------------------------------- */
  function loadArticles() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'health-index.json', true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            var data = JSON.parse(xhr.responseText);
            state.articles = data.filter(function (a) {
              return a.status === 'published';
            });
            state.filteredArticles = state.articles.slice();
            state.totalPages = Math.ceil(state.filteredArticles.length / state.perPage);
            renderCards();
          } catch (e) {
            showEmptyState('Failed to load articles. Please refresh the page.');
          }
        } else {
          showEmptyState('Unable to load articles. Please try again later.');
        }
      }
    };
    xhr.send();
  }

  /* --------------------------------------------------
   * Filter by Category
   * -------------------------------------------------- */
  function filterByCategory(category) {
    state.currentCategory = category;
    state.currentPage = 1;
    applyFilters();
    updateFilterButtons();
  }

  function updateFilterButtons() {
    var buttons = document.querySelectorAll('.filter-btn');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var cat = btn.getAttribute('data-category');
      if (cat === state.currentCategory) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  }

  /* --------------------------------------------------
   * Search
   * -------------------------------------------------- */
  function handleSearch(query) {
    state.searchQuery = query;
    state.currentPage = 1;
    applyFilters();
  }

  /* --------------------------------------------------
   * Apply all filters (category + search)
   * -------------------------------------------------- */
  function applyFilters() {
    var result = state.articles.slice();

    // Category filter
    if (state.currentCategory && state.currentCategory !== 'all') {
      result = result.filter(function (a) {
        return a.category === state.currentCategory;
      });
    }

    // Search filter with XSS prevention
    if (state.searchQuery && state.searchQuery.trim().length > 0) {
      var q = state.searchQuery.trim().toLowerCase();
      result = result.filter(function (a) {
        var haystack = (a.title + ' ' + a.excerpt + ' ' + a.category + ' ' + a.author).toLowerCase();
        return haystack.indexOf(q) !== -1;
      });
    }

    state.filteredArticles = result;
    state.totalPages = Math.ceil(result.length / state.perPage);
    renderCards();
    updateSearchCount();
  }

  function updateSearchCount() {
    var countEl = document.querySelector('.search-count');
    if (countEl) {
      countEl.textContent = state.filteredArticles.length + ' article' +
        (state.filteredArticles.length !== 1 ? 's' : '') + ' found';
    }
  }

  /* --------------------------------------------------
   * Escape HTML to prevent XSS
   * -------------------------------------------------- */
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /* --------------------------------------------------
   * Format Date
   * -------------------------------------------------- */
  function formatDate(isoDate) {
    if (!isoDate) return '';
    var parts = isoDate.split('-');
    var months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    var month = months[parseInt(parts[1], 10) - 1];
    var day = parseInt(parts[2], 10);
    var year = parts[0];
    return month + ' ' + day + ', ' + year;
  }

  /* --------------------------------------------------
   * Calculate Reading Time
   * -------------------------------------------------- */
  function getReadingTime(article) {
    if (article.readingTime) {
      return article.readingTime + ' min read';
    }
    return '';
  }

  /* --------------------------------------------------
   * Get category display name
   * -------------------------------------------------- */
  function getCategoryLabel(category) {
    var labels = {
      research: 'Research',
      nutrition: 'Nutrition',
      fitness: 'Fitness',
      sleep: 'Sleep',
      lifestyle: 'Lifestyle',
      trends: 'Trends'
    };
    return labels[category] || category;
  }

  /* --------------------------------------------------
   * Get card CSS class based on article type
   * -------------------------------------------------- */
  function getCardClass(articleType) {
    var mapping = {
      'research-explainer': 'research-card',
      'nutrition-guide': 'nutrition-card',
      'fitness-guide': 'fitness-card',
      'sleep-guide': 'sleep-card',
      'lifestyle-card': 'lifestyle-card',
      'health-trend-analysis': 'trend-card'
    };
    return mapping[articleType] || '';
  }

  /* --------------------------------------------------
   * Render Article Cards
   * -------------------------------------------------- */
  function renderCards() {
    var container = document.querySelector('.card-grid');
    if (!container) return;

    var start = (state.currentPage - 1) * state.perPage;
    var end = start + state.perPage;
    var pageArticles = state.filteredArticles.slice(start, end);

    if (pageArticles.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No articles match your search.</p></div>';
      hidePagination();
      return;
    }

    var html = '';
    for (var i = 0; i < pageArticles.length; i++) {
      html += buildCardHtml(pageArticles[i]);
    }
    container.innerHTML = html;
    renderPagination();
    lazyLoadImages();
  }

  /* --------------------------------------------------
   * Build Single Card HTML
   * -------------------------------------------------- */
  function buildCardHtml(article) {
    var cardClass = getCardClass(article.articleType);
    var date = formatDate(article.publishDate);
    var readTime = getReadingTime(article);
    var catLabel = getCategoryLabel(article.category);

    var html = '<article class="article-card ' + escapeHtml(cardClass) + '">';
    html += '<a href="/' + escapeHtml(article.slug) + '/" class="card-image-wrap">';
    html += '<div class="card-image-container">';
    html += '<img class="card-image" data-src="' + escapeHtml(article.coverImage) + '" alt="' + escapeHtml(article.title) + '" loading="lazy">';
    html += '</div></a>';
    html += '<div class="card-body">';
    html += '<div class="card-meta-top">';
    html += '<a href="/' + escapeHtml(article.category) + '/" class="card-category card-category--' + escapeHtml(article.category) + '">' + escapeHtml(catLabel) + '</a>';
    html += '</div>';
    html += '<h3 class="card-title"><a href="/' + escapeHtml(article.slug) + '/">' + escapeHtml(article.title) + '</a></h3>';
    html += '<p class="card-desc">' + escapeHtml(article.excerpt) + '</p>';
    html += '<div class="card-footer">';
    html += '<span>' + escapeHtml(article.author) + '</span>';
    html += '<span class="card-sep">·</span>';
    html += '<span>' + escapeHtml(date) + '</span>';
    if (readTime) {
      html += '<span class="card-sep">·</span>';
      html += '<span class="card-readtime">' + escapeHtml(readTime) + '</span>';
    }
    html += '</div>';
    html += '</div></article>';
    return html;
  }

  /* --------------------------------------------------
   * Pagination
   * -------------------------------------------------- */
  function renderPagination() {
    var container = document.querySelector('.pagination');
    if (!container) return;

    if (state.totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    var html = '<nav class="pagination-list" aria-label="Pagination">';

    // Prev button
    if (state.currentPage > 1) {
      html += '<button class="page-btn" data-page="' + (state.currentPage - 1) + '" aria-label="Previous page">&laquo; Prev</button>';
    }

    // Page numbers
    for (var i = 1; i <= state.totalPages; i++) {
      if (i === state.currentPage) {
        html += '<button class="page-btn active" data-page="' + i + '" aria-current="page">' + i + '</button>';
      } else {
        html += '<button class="page-btn" data-page="' + i + '">' + i + '</button>';
      }
    }

    // Next button
    if (state.currentPage < state.totalPages) {
      html += '<button class="page-btn" data-page="' + (state.currentPage + 1) + '" aria-label="Next page">Next &raquo;</button>';
    }

    html += '</nav>';
    container.innerHTML = html;

    // Bind click events
    var buttons = container.querySelectorAll('.page-btn');
    for (var j = 0; j < buttons.length; j++) {
      buttons[j].addEventListener('click', function (e) {
        var page = parseInt(e.target.getAttribute('data-page'), 10);
        if (page && page !== state.currentPage) {
          state.currentPage = page;
          renderCards();
          scrollToCards();
        }
      });
    }
  }

  function hidePagination() {
    var container = document.querySelector('.pagination');
    if (container) {
      container.innerHTML = '';
    }
  }

  function scrollToCards() {
    var target = document.querySelector('.card-grid');
    if (target) {
      var rect = target.getBoundingClientRect();
      var top = rect.top + window.pageYOffset - 80;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  }

  /* --------------------------------------------------
   * Empty / Error State
   * -------------------------------------------------- */
  function showEmptyState(message) {
    var container = document.querySelector('.card-grid');
    if (container) {
      container.innerHTML = '<div class="empty-state"><p>' + escapeHtml(message) + '</p></div>';
    }
  }

  /* --------------------------------------------------
   * Lazy Loading Images
   * -------------------------------------------------- */
  function lazyLoadImages() {
    var images = document.querySelectorAll('img[data-src]');
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            var img = entries[i].target;
            img.src = img.getAttribute('data-src');
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        }
      }, { rootMargin: '200px' });

      for (var j = 0; j < images.length; j++) {
        observer.observe(images[j]);
      }
    } else {
      // Fallback for older browsers
      for (var k = 0; k < images.length; k++) {
        images[k].src = images[k].getAttribute('data-src');
        images[k].removeAttribute('data-src');
      }
    }
  }

  /* --------------------------------------------------
   * Mobile Menu Toggle
   * -------------------------------------------------- */
  function initMobileMenu() {
    var toggle = document.querySelector('.menu-toggle');
    var nav = document.querySelector('.main-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', !expanded);
      nav.classList.toggle('nav-open');
      document.body.style.overflow = expanded ? '' : 'hidden';
    });
  }

  /* --------------------------------------------------
   * Search Overlay
   * -------------------------------------------------- */
  function initSearchOverlay() {
    var searchBtn = document.querySelector('.search-btn');
    var overlay = document.querySelector('.search-overlay');
    var closeBtn = document.querySelector('.search-close');
    var input = document.querySelector('.search-input');

    if (!searchBtn || !overlay) return;

    searchBtn.addEventListener('click', function () {
      overlay.classList.add('active');
      overlay.setAttribute('aria-hidden', 'false');
      if (input) input.focus();
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        closeSearchOverlay(overlay);
      });
    }

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        closeSearchOverlay(overlay);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
        closeSearchOverlay(overlay);
      }
    });

    if (input) {
      var debounceTimer;
      input.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
          handleSearch(input.value);
        }, 300);
      });
    }
  }

  function closeSearchOverlay(overlay) {
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    var input = overlay.querySelector('.search-input');
    if (input) input.value = '';
    state.searchQuery = '';
    state.filteredArticles = state.currentCategory === 'all'
      ? state.articles.slice()
      : state.articles.filter(function (a) { return a.category === state.currentCategory; });
    state.totalPages = Math.ceil(state.filteredArticles.length / state.perPage);
    state.currentPage = 1;
    renderCards();
  }

  /* --------------------------------------------------
   * Header Scroll Effect
   * -------------------------------------------------- */
  function initHeaderScroll() {
    var header = document.querySelector('.site-header');
    if (!header) return;

    var scrollThreshold = 20;
    window.addEventListener('scroll', function () {
      if (window.pageYOffset > scrollThreshold) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  /* --------------------------------------------------
   * Back to Top
   * -------------------------------------------------- */
  function initBackToTop() {
    var btn = document.querySelector('.back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', function () {
      if (window.pageYOffset > 400) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* --------------------------------------------------
   * Smooth Scroll for Anchor Links
   * -------------------------------------------------- */
  function initSmoothScroll() {
    var links = document.querySelectorAll('a[href^="#"]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function (e) {
        var href = this.getAttribute('href');
        if (href === '#') return;
        var target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          var top = target.getBoundingClientRect().top + window.pageYOffset - 80;
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
      });
    }
  }

  /* --------------------------------------------------
   * Category Filter Buttons
   * -------------------------------------------------- */
  function initCategoryFilters() {
    var buttons = document.querySelectorAll('.filter-btn');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function (e) {
        var cat = e.target.getAttribute('data-category');
        if (cat) {
          filterByCategory(cat);
        }
      });
    }
  }

  /* --------------------------------------------------
   * FAQ Accordion
   * -------------------------------------------------- */
  function initFaqAccordion() {
    var questions = document.querySelectorAll('.faq-question');
    for (var i = 0; i < questions.length; i++) {
      questions[i].addEventListener('click', function () {
        var item = this.parentElement;
        item.classList.toggle('open');
      });
    }
  }

  /* --------------------------------------------------
   * Initialize Everything
   * -------------------------------------------------- */
  ready(function () {
    initHeaderScroll();
    initMobileMenu();
    initSearchOverlay();
    initBackToTop();
    initSmoothScroll();
    initCategoryFilters();
    initFaqAccordion();
    lazyLoadImages();
    loadArticles();
  });

})();
