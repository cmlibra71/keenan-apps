/**
 * Keenan SDK — auto-injected into every sandboxed app.
 *
 * Provides:
 *   Keenan.api.get(path, params?)   — GET  /api/v1/commerce/...
 *   Keenan.api.post(path, body?)    — POST
 *   Keenan.api.put(path, body?)     — PUT
 *   Keenan.api.delete(path)         — DELETE
 *   Keenan.context                  — { userId, userName, userEmail, scopes }
 *   Keenan.ready                    — Promise that resolves when bridge token is received
 *   Keenan.onTokenRefresh(fn)       — Register callback for token refreshes
 */
;(function () {
  "use strict";

  // --- State -----------------------------------------------------------

  var _token = null;
  var _expiresAt = null;
  var _apiBase = "/api/v1/commerce";
  var _context = { userId: null, userName: null, userEmail: null, scopes: [] };
  var _readyResolve = null;
  var _readyPromise = new Promise(function (resolve) { _readyResolve = resolve; });
  var _refreshCallbacks = [];
  var _initialized = false;

  // --- Bridge token listener -------------------------------------------

  window.addEventListener("message", function (e) {
    if (!e.data || e.data.type !== "portal:bridge-token") return;

    _token = e.data.token || null;
    _expiresAt = e.data.expiresAt || null;
    _apiBase = e.data.apiBase || "/api/v1/commerce";
    _context = {
      userId: e.data.userId || null,
      userName: e.data.userName || null,
      userEmail: e.data.userEmail || null,
      scopes: Array.isArray(e.data.scopes) ? e.data.scopes : [],
    };

    if (!_initialized) {
      _initialized = true;
      if (_readyResolve) _readyResolve();
    }

    // Notify refresh callbacks (for apps that need to re-fetch on token rotation)
    for (var i = 0; i < _refreshCallbacks.length; i++) {
      try { _refreshCallbacks[i](); } catch (_) { /* ignore */ }
    }
  });

  // --- API methods ------------------------------------------------------

  function buildUrl(path, params) {
    // Ensure path starts with /
    if (path.charAt(0) !== "/") path = "/" + path;
    var url = _apiBase + path;

    if (params && typeof params === "object") {
      var qs = [];
      var keys = Object.keys(params);
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        var v = params[k];
        if (v === undefined || v === null) continue;
        qs.push(encodeURIComponent(k) + "=" + encodeURIComponent(String(v)));
      }
      if (qs.length) url += "?" + qs.join("&");
    }
    return url;
  }

  function request(method, path, paramsOrBody) {
    if (!_token) {
      return Promise.reject(new Error("Keenan SDK: No bridge token available. Wait for Keenan.ready before making API calls."));
    }

    var url, opts;

    if (method === "GET" || method === "DELETE") {
      url = buildUrl(path, paramsOrBody);
      opts = {
        method: method,
        headers: {
          "X-API-Key": _token,
          "Accept": "application/json",
        },
      };
    } else {
      url = buildUrl(path);
      opts = {
        method: method,
        headers: {
          "X-API-Key": _token,
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
      };
      if (paramsOrBody !== undefined && paramsOrBody !== null) {
        opts.body = JSON.stringify(paramsOrBody);
      }
    }

    return fetch(url, opts).then(function (res) {
      // Parse JSON for all responses; let caller handle errors via .status
      var contentType = res.headers.get("content-type") || "";
      if (contentType.indexOf("application/json") !== -1) {
        return res.json().then(function (data) {
          if (!res.ok) {
            var err = new Error(data.error || data.message || "API error " + res.status);
            err.status = res.status;
            err.data = data;
            throw err;
          }
          return data;
        });
      }
      if (!res.ok) {
        var err = new Error("API error " + res.status);
        err.status = res.status;
        throw err;
      }
      return res.text();
    });
  }

  // --- Public API -------------------------------------------------------

  window.Keenan = {
    /** Resolves when the first bridge token is received from the portal. */
    ready: _readyPromise,

    /** Current user context (populated after ready). */
    get context() { return _context; },

    /** Register a callback for token refreshes (e.g., to re-fetch data). */
    onTokenRefresh: function (fn) {
      if (typeof fn === "function") _refreshCallbacks.push(fn);
    },

    /** Commerce API client — all methods return Promises. */
    api: {
      /**
       * GET request to the Commerce API.
       * @param {string} path - e.g., "/catalog/products"
       * @param {Object} [params] - Query string parameters
       * @returns {Promise<any>}
       */
      get: function (path, params) { return request("GET", path, params); },

      /**
       * POST request to the Commerce API.
       * @param {string} path - e.g., "/orders"
       * @param {Object} [body] - JSON request body
       * @returns {Promise<any>}
       */
      post: function (path, body) { return request("POST", path, body); },

      /**
       * PUT request to the Commerce API.
       * @param {string} path - e.g., "/catalog/products/123"
       * @param {Object} [body] - JSON request body
       * @returns {Promise<any>}
       */
      put: function (path, body) { return request("PUT", path, body); },

      /**
       * DELETE request to the Commerce API.
       * @param {string} path - e.g., "/catalog/products/123"
       * @param {Object} [params] - Query string parameters
       * @returns {Promise<any>}
       */
      delete: function (path, params) { return request("DELETE", path, params); },
    },
  };
})();
