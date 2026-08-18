/*
 * health.helloinsights.online — Ad Configuration
 * ES5 compatible
 * Last updated: 2026-05-23
 */
(function (root) {
  'use strict';

  var AdsConfig = {
    site: 'health.helloinsights.online',
    version: '20260523',

    /* --------------------------------------------------
     * Google AdSense
     * -------------------------------------------------- */
    adsense: {
      clientId: 'ca-pub-XXXXXXXXXXXXXXXX',
      autoAds: true,
      slots: {
        /* --- Layout / Zone slots --- */
        'health-zone-top': {
          id: 'health-zone-top',
          description: 'Health sub-site header banner',
          format: 'horizontal',
          sizes: [[970, 250], [970, 90], [728, 90]],
          responsive: true
        },
        'health-zone-mid': {
          id: 'health-zone-mid',
          description: 'Mid-page banner between sections',
          format: 'rectangle',
          sizes: [[336, 280], [300, 250]],
          responsive: true
        },
        'health-zone-bottom': {
          id: 'health-zone-bottom',
          description: 'Footer area banner',
          format: 'horizontal',
          sizes: [[970, 90], [728, 90], [468, 60]],
          responsive: true
        },

        /* --- Article page slots --- */
        'health-article-banner': {
          id: 'health-article-banner',
          description: 'Above article content',
          format: 'horizontal',
          sizes: [[970, 250], [970, 90], [728, 90]],
          responsive: true
        },
        'health-article-mid': {
          id: 'health-article-mid',
          description: 'In-article mid-content slot',
          format: 'rectangle',
          sizes: [[336, 280], [300, 250]],
          responsive: true
        },
        'health-article-bottom': {
          id: 'health-article-bottom',
          description: 'Below article content',
          format: 'rectangle',
          sizes: [[336, 280], [300, 250], [728, 90]],
          responsive: true
        },

        /* --- Category page slots --- */
        'health-research-top': {
          id: 'health-research-top',
          description: 'Research category page top',
          format: 'horizontal',
          sizes: [[970, 90], [728, 90]],
          responsive: true
        },
        'health-nutrition-top': {
          id: 'health-nutrition-top',
          description: 'Nutrition category page top',
          format: 'horizontal',
          sizes: [[970, 90], [728, 90]],
          responsive: true
        },
        'health-fitness-top': {
          id: 'health-fitness-top',
          description: 'Fitness category page top',
          format: 'horizontal',
          sizes: [[970, 90], [728, 90]],
          responsive: true
        }
      }
    },

    /* --------------------------------------------------
     * MGID
     * -------------------------------------------------- */
    mgid: {
      enabled: false,
      accountId: '',
      widgets: {}
    },

    /* --------------------------------------------------
     * General settings
     * -------------------------------------------------- */
    settings: {
      /* Minimum time (ms) before showing ads after page load */
      loadDelay: 1500,

      /* Lazy-load ads that are below the fold */
      lazyLoad: true,

      /* Threshold (px) for lazy-loading trigger */
      lazyThreshold: 300,

      /* CLS prevention — reserve space before ad renders */
      clsProtection: {
        enabled: true,
        minHeight: {
          desktop: 250,
          mobile: 200
        }
      },

      /* Do not show ads on these paths (regex patterns) */
      excludePaths: [
        '^/search',
        '^/404'
      ],

      /* Maximum ads visible at once (viewability compliance) */
      maxVisibleAds: 3
    }
  };

  /* --------------------------------------------------
   * Helper: get slot config by ID
   * -------------------------------------------------- */
  AdsConfig.getSlot = function (slotId) {
    return this.adsense.slots[slotId] || null;
  };

  /* --------------------------------------------------
   * Helper: check if ads should load on current path
   * -------------------------------------------------- */
  AdsConfig.shouldLoadAds = function () {
    if (typeof window === 'undefined' || !window.location) {
      return true;
    }
    var path = window.location.pathname;
    var patterns = this.settings.excludePaths;
    for (var i = 0; i < patterns.length; i++) {
      if (new RegExp(patterns[i]).test(path)) {
        return false;
      }
    }
    return true;
  };

  /* --------------------------------------------------
   * Helper: get CLS min-height for current viewport
   * -------------------------------------------------- */
  AdsConfig.getClsMinHeight = function () {
    if (!this.settings.clsProtection.enabled) {
      return 0;
    }
    var w = (typeof window !== 'undefined') ? window.innerWidth : 1024;
    return (w <= 768)
      ? this.settings.clsProtection.minHeight.mobile
      : this.settings.clsProtection.minHeight.desktop;
  };

  /* --------------------------------------------------
   * Export
   * -------------------------------------------------- */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdsConfig;
  } else {
    root.AdsConfig = AdsConfig;
  }

})(typeof window !== 'undefined' ? window : this);
