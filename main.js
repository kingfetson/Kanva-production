try{if(localStorage.getItem("__framer_force_showing_editorbar_since")){const n=document.createElement("link");n.rel = "modulepreload";n.href="https:
      (function() {
        window.__FcCheckoutConfigs = window.__FcCheckoutConfigs || {};
        const previousSettings = { 
          checkout: { ...window.__FcCheckoutConfigs }
        };
        window.__FcCheckoutConfigs = {
          ...window.__FcCheckoutConfigs,
          checkoutLocale: "en",
          defaultCountry: "Germany",
          defaultCountryCode: "DE",
          defaultCurrency: "EUR",
          defaultCurrencySymbol: "€",
          metaPixelId: "",
          googleAnalyticsId: "",
          filterByVendor: "",
          filterByCollection: "",
          filterByProductType: "",
          filterByTags: "",
          variantColorValues: [],
          variantColorTitles: ["Color"]
        };
        const existingLocale = localStorage.getItem('checkoutLocale');
        if (existingLocale === null) {
          localStorage.setItem('checkoutLocale', 'en');
        }
        const existingCountry = localStorage.getItem('selectedCountry');
        if (existingCountry === null) { 
          localStorage.setItem('selectedCountry', 'Germany');
        }
        const existingCountryCode = localStorage.getItem('selectedCountryCode');
        if (existingCountryCode === null) {
          localStorage.setItem('selectedCountryCode', 'DE');
        }
        const existingCurrency = localStorage.getItem('selectedCurrency');
        if (existingCurrency === null) {
          localStorage.setItem('selectedCurrency', 'EUR');
        }
        const existingCurrencySymbol = localStorage.getItem('selectedCurrencySymbol');
        if (existingCurrencySymbol === null) {
          localStorage.setItem('selectedCurrencySymbol', '€');
        }
        const checkoutEvent = new CustomEvent('checkout__settings-updated', {
          detail: {
            previous: previousSettings.checkout,
            current: window.__FcCheckoutConfigs
          }
        });
        document.dispatchEvent(checkoutEvent);
      })();
    (function() {
      window.shopXtools = window.shopXtools || {};
      window.shopXtools.version = "2.5";
      window.FCConsentManager = {
        isBannerPresent: function() {
          if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            try {
              const framerConsent = localStorage.getItem('framerCookiesConsentMode');
              return !!framerConsent;
            } catch (e) {
              return false;
            }
          }
          return false;
        },
        getConsent: function() {
          const bannerDetected = this.isBannerPresent();
          if (!bannerDetected) {
            return {
              necessary: true,
              analytics: true,
              marketing: true,
              preferences: true,
              bannerDetected: false,
            };
          }
          try {
            const dismissed = localStorage.getItem('framerCookiesDismissed');
            if (!dismissed || dismissed === 'false') {
              return {
                necessary: true,
                analytics: false,
                marketing: false,
                preferences: false,
                bannerDetected: true,
              };
            }
            const framerConsent = localStorage.getItem('framerCookiesConsentMode');
            if (framerConsent) {
              const consent = JSON.parse(framerConsent);
              return {
                necessary: consent.necessary === true,
                analytics: consent.analytics === true,
                marketing: consent.marketing === true,
                preferences: consent.preferences === true,
                bannerDetected: true,
              };
            }
          } catch (e) {
            console.warn('[FC Privacy] Error reading framerCookiesConsentMode:', e);
          }
          if (bannerDetected && !localStorage.getItem('framerCookiesConsentMode')) {
            return {
              necessary: true,
              analytics: false,
              marketing: false,
              preferences: false,
              bannerDetected: true,
            };
          }
          const entries = window.google_tag_data?.ics?.entries || {};
          const getConsentValue = function(entry) {
            if (!entry) return 'denied';
            if (typeof entry === 'string') return entry;
            if (entry.update !== undefined) return entry.update;
            if (entry.initial !== undefined) return entry.initial;
            if (entry.default !== undefined) return entry.default;
            return 'denied';
          };
          return {
            necessary: getConsentValue(entries.security_storage) === 'granted',
            analytics: getConsentValue(entries.analytics_storage) === 'granted',
            marketing: getConsentValue(entries.ad_storage) === 'granted',
            preferences: getConsentValue(entries.functionality_storage) === 'granted',
            bannerDetected: true,
          };
        },
        canTrackAnalytics: function() {
          return this.getConsent().analytics;
        },
        canTrackMarketing: function() {
          return this.getConsent().marketing;
        },
        canStorePreferences: function() {
          return this.getConsent().preferences;
        },
        hasNecessaryConsent: function() {
          return this.getConsent().necessary;
        },
        logConsentState: function() {
          const consent = this.getConsent();
          console.group('[FC Privacy] Consent State');
          console.log('Current Consent:', consent);
          console.log('Tracking Status:', {
            GA4_initialized: !!window.__fcGAInitialized,
            MetaPixel_initialized: !!window.__fcMetaPixelInitialized,
            Shopify_sync_initialized: !!window.__FCShopifySyncInitialized
          });
          console.log('Active Listeners:', this._listeners.length);
          console.groupEnd();
        },
        logShopifySync: function() {
          console.group('[FC Privacy] Shopify Sync Debug');
          console.log('1. Sync initialized:', !!window.__FCShopifySyncInitialized);
          console.log('2. Can share cookies:', window.FCDomainValidator.canShareCookies());
          console.log('3. Checkout URL:', window.shopXtools?.cart?.checkoutUrl || 'N/A');
          console.log('4. Current domain:', window.location.hostname);
          const checkoutUrl = window.shopXtools?.cart?.checkoutUrl;
          if (checkoutUrl) {
            try {
              console.log('5. Checkout domain:', new URL(checkoutUrl).hostname);
            } catch(e) {
              console.log('5. Checkout domain: Invalid URL');
            }
          } else {
            console.log('5. Checkout domain: N/A');
          }
          console.log('6. Root domain:', window.FCDomainValidator.extractRootDomain(window.location.hostname));
          console.log('7. window.Shopify exists:', typeof window.Shopify !== 'undefined');
          console.log('8. Script element exists:', !!document.querySelector('script[src*="consent-tracking-api"]'));
          if (checkoutUrl && !window.FCDomainValidator.canShareCookies()) {
            console.warn('Domain mismatch: Shopify Privacy API cannot sync consent between different root domains');
            console.warn('Framer domain:', window.location.hostname);
            console.warn('Checkout domain:', new URL(checkoutUrl).hostname);
            console.warn('Solution: Use a custom domain on the same root domain as your Shopify checkout');
          }
          console.groupEnd();
        },
        _listeners: [],
        _initialized: false,
        _eventHandlers: {},
        _originalDataLayerPush: null,
        _pollInterval: null,
        onConsentChange: function(callback) {
          if (typeof callback !== 'function') return function() {};
          this._listeners.push(callback);
          if (!this._initialized) {
            this._initializeListeners();
            this._initialized = true;
          }
          const self = this;
          return function() {
            self._listeners = self._listeners.filter(function(cb) { return cb !== callback; });
            if (self._listeners.length === 0) {
              self._cleanupListeners();
            }
          };
        },
        _initializeListeners: function() {
          const self = this;
          this._eventHandlers.cookieConsentUpdate = function() {
            self._notifyListeners();
          };
          this._eventHandlers.storageChange = function(e) {
            if (e.key === 'framerCookiesConsentMode') {
              self._notifyListeners();
            }
          };
          window.addEventListener('cookie_consent_update', this._eventHandlers.cookieConsentUpdate);
          window.addEventListener('storage', this._eventHandlers.storageChange);
          let lastConsentValue = localStorage.getItem('framerCookiesConsentMode');
          let lastDismissedValue = localStorage.getItem('framerCookiesDismissed');
          this._pollInterval = setInterval(function() {
            const currentConsent = localStorage.getItem('framerCookiesConsentMode');
            const currentDismissed = localStorage.getItem('framerCookiesDismissed');
            if (currentConsent !== lastConsentValue || currentDismissed !== lastDismissedValue) {
              lastConsentValue = currentConsent;
              lastDismissedValue = currentDismissed;
              self._notifyListeners();
            }
          }, 200);
          if (window.dataLayer && !this._originalDataLayerPush) {
            this._originalDataLayerPush = window.dataLayer.push;
            window.dataLayer.push = function() {
              const result = self._originalDataLayerPush.apply(window.dataLayer, arguments);
              for (let i = 0; i < arguments.length; i++) {
                const data = arguments[i];
                if (Array.isArray(data) && data.length >= 2 && data[0] === 'consent') {
                  setTimeout(function() { self._notifyListeners(); }, 100);
                  break;
                }
                if (data && typeof data === 'object' && !Array.isArray(data)) {
                  if ('analytics_storage' in data || 'ad_storage' in data) {
                    setTimeout(function() { self._notifyListeners(); }, 100);
                    break;
                  }
                }
              }
              return result;
            };
          }
        },
        _cleanupListeners: function() {
          if (this._eventHandlers.cookieConsentUpdate) {
            window.removeEventListener('cookie_consent_update', this._eventHandlers.cookieConsentUpdate);
          }
          if (this._eventHandlers.storageChange) {
            window.removeEventListener('storage', this._eventHandlers.storageChange);
          }
          if (this._pollInterval) {
            clearInterval(this._pollInterval);
            this._pollInterval = null;
          }
          if (window.dataLayer && this._originalDataLayerPush) {
            window.dataLayer.push = this._originalDataLayerPush;
            this._originalDataLayerPush = null;
          }
          this._eventHandlers = {};
          this._initialized = false;
        },
        _notifyListeners: function() {
          const consent = this.getConsent();
          this._listeners.forEach(function(callback) {
            try {
              callback(consent);
            } catch (error) {
              console.error('[FC Privacy] Error in consent change listener:', error);
            }
          });
        },
      };
      (function() {
        window.FCConsentManager.onConsentChange(function() {
        });
      })();
      window.FCDomainValidator = {
        extractRootDomain: function(hostname) {
          try {
            const parts = hostname.toLowerCase().split('.');
            if (parts.length <= 1) return hostname;
            const multiPartTLDs = ['co.uk', 'co.nz', 'co.za', 'com.au', 'com.br'];
            const lastTwo = parts.slice(-2).join('.');
            if (multiPartTLDs.indexOf(lastTwo) !== -1) {
              return parts.slice(-3).join('.');
            }
            return parts.slice(-2).join('.');
          } catch (e) {
            return hostname;
          }
        },
        areDomainsAligned: function(url1, url2) {
          try {
            const hostname1 = new URL(url1).hostname;
            const hostname2 = new URL(url2).hostname;
            const root1 = this.extractRootDomain(hostname1);
            const root2 = this.extractRootDomain(hostname2);
            return root1 === root2 && root1 !== '';
          } catch (e) {
            return false;
          }
        },
        canShareCookies: function() {
          const framerDomain = window.location.href;
          const checkoutUrl = window.shopXtools?.cart?.checkoutUrl;
          if (!checkoutUrl) return false;
          return this.areDomainsAligned(framerDomain, checkoutUrl);
        },
        logDomainInfo: function() {
          const framerDomain = window.location.hostname;
          const checkoutUrl = window.shopXtools?.cart?.checkoutUrl;
          const canSync = this.canShareCookies();
          console.log('[FC Privacy] Domain Status:', {
            framer: framerDomain,
            checkout: checkoutUrl ? new URL(checkoutUrl).hostname : 'N/A',
            canSync: canSync ? '✓ Aligned' : '✗ Not aligned',
          });
        },
      };
      const fcConfigs = {
        storefrontDomain: "7sexct-fc.myshopify.com",
        storefrontAccessToken: "f0afdf32171277caa14ac9dca02efd76",
      };
      const CURRENCIES = {"AED":"د.إ","AFN":"Af","ALL":"L","AMD":"֏","ANG":"ƒ","AOA":"Kz","ARS":"$","AUD":"$","AWG":"ƒ","AZN":"₼","BAM":"KM","BBD":"$","BDT":"৳","BGN":"лв","BHD":"د.ب","BIF":"FBu","BMD":"$","BND":"$","BOB":"Bs.","BRL":"R$","BSD":"$","BTN":"Nu.","BWP":"P","BYN":"Br","BZD":"BZ$","CAD":"$","CDF":"FC","CHF":"Fr","CLP":"$","CNY":"¥","COP":"$","CRC":"₡","CVE":"$","CZK":"Kč","DJF":"Fdj","DKK":"kr","DOP":"RD$","DZD":"د.ج","EGP":"£","ERN":"Nfk","ETB":"Br","EUR":"€","FJD":"$","FKP":"£","GBP":"£","GEL":"₾","GHS":"₵","GIP":"£","GMD":"D","GNF":"FG","GTQ":"Q","GYD":"$","HKD":"$","HNL":"L","HRK":"kn","HTG":"G","HUF":"Ft","IDR":"Rp","ILS":"₪","INR":"₹","IQD":"ع.د","IRR":"﷼","ISK":"kr","JEP":"£","JMD":"J$","JOD":"د.ا","JPY":"¥","KES":"KSh","KGS":"сом","KHR":"៛","KID":"$","KMF":"CF","KRW":"₩","KWD":"د.ك","KYD":"$","KZT":"₸","LAK":"₭","LBP":"£","LKR":"රු","LRD":"$","LSL":"L","LTL":"Lt","LVL":"Ls","LYD":"ل.د","MAD":"د.م.","MDL":"MDL","MGA":"Ar","MKD":"ден","MMK":"Ks","MNT":"₮","MOP":"MOP$","MRU":"UM","MUR":"₨","MVR":"ރ","MWK":"MK","MXN":"$","MYR":"RM","MZN":"MT","NAD":"$","NGN":"₦","NIO":"C$","NOK":"kr","NPR":"रू","NZD":"$","OMR":"ر.ع.","PAB":"B/.","PEN":"S/.","PGK":"K","PHP":"₱","PKR":"₨","PLN":"zł","PYG":"₲","QAR":"ر.ق","RON":"lei","RSD":"Дин.","RUB":"₽","RWF":"FRw","SAR":"ر.س","SBD":"$","SCR":"₨","SDG":"ج.س.","SEK":"kr","SGD":"$","SHP":"£","SLL":"Le","SOS":"Sh","SRD":"$","SSP":"£","STN":"Db","SYP":"£","SZL":"E","THB":"฿","TJS":"ЅМ","TMT":"T","TND":"د.ت","TOP":"T$","TRY":"₺","TTD":"TT$","TWD":"NT$","TZS":"TSh","UAH":"₴","UGX":"USh","USD":"$","UYU":"$","UZS":"so'm","VED":"Bs.S.","VES":"Bs.","VND":"₫","VUV":"VT","WST":"T","XAF":"FCFA","XCD":"$","XOF":"CFA","XPF":"₣","XXX":"","YER":"﷼","ZAR":"R","ZMW":"ZK","BYR":"Br","STD":"Db","VEF":"Bs."}; 
      const knownCurrenciesWithCodeAsSymbol = ["CHF","PLN","SEK","NOK","DKK","CZK","HUF","RON","HRK","BGN","ISK","MDL","BYN","KZT","AMD","UZS","TJS","KGS","MNT","GEL","AFN","MRU","RWF","XAF","XOF","XPF"]; 
      let defaultCountry = '';
      let defaultCountryCode = '';
      let defaultCurrency = '';
      let defaultCurrencySymbol = '';
      document.addEventListener('checkout__settings-updated', (event) => {
        const { current } = event.detail;
        if (current) {
          defaultCountry = current.defaultCountry || '';
          defaultCountryCode = current.defaultCountryCode || '';
          defaultCurrency = current.defaultCurrency || '';
          defaultCurrencySymbol = current.defaultCurrencySymbol || '';
          if (!localStorage.getItem('selectedCountry')) {
            localStorage.setItem('selectedCountry', defaultCountry);
          }
          if (!localStorage.getItem('selectedCountryCode')) {
            localStorage.setItem('selectedCountryCode', defaultCountryCode);
          }
          if (!localStorage.getItem('selectedCurrency')) {
            localStorage.setItem('selectedCurrency', defaultCurrency);
          }
          if (!localStorage.getItem('selectedCurrencySymbol')) {
            localStorage.setItem('selectedCurrencySymbol', defaultCurrencySymbol);
          }
          localStorage.removeItem('fc_products');
          localStorage.removeItem('fc_products_timestamp');
          const currentCountryCode = localStorage.getItem('selectedCountryCode');
          if (currentCountryCode) {
            fetchProductsByCountry(currentCountryCode).catch(error => {
              console.error('Error refetching products after currency change:', error);
              window.shopXtools.status = "ready";
            });
          }
        }
      });
      let domain;
      let products = [];
      const getProductsByIdsQuery = `
        query GetProductsByIds($ids: [ID!]!, $countryCode: CountryCode) @inContext(country: $countryCode) {
          nodes(ids: $ids) {
            ... on Product {
              id
              title
              vendor
              handle
              productType
              tags
              createdAt
              collections(first: 250) {
                edges {
                  node {
                    id
                    title
                    handle
                  }
                }
              }
              images(first: 20) {
                edges {
                  node {
                    url
                    altText
                    width
                    height
                   }
                  }
              }
              metafields(identifiers: [
                { namespace: "custom", key: "fc_color" },
                { namespace: "custom", key: "fc_size" }
              ]) {
                key
                namespace
                value
              }
              sellingPlanGroups(first: 1) {
                edges {
                  node {
                    name
                    options {
                      name
                      values
                    }
                    sellingPlans(first: 10) {
                      edges {
                        node {
                          id
                          name
                          description
                          recurringDeliveries
                          priceAdjustments {
                            orderCount
                            adjustmentValue {
                              __typename
                              ... on SellingPlanPercentagePriceAdjustment {
                                adjustmentPercentage
                              }
                              ... on SellingPlanFixedAmountPriceAdjustment {
                                adjustmentAmount {
                                  amount
                                  currencyCode
                                }
                              }
                              ... on SellingPlanFixedPriceAdjustment {
                                price {
                                  amount
                                  currencyCode
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
              options {
                id
                name
                values
              }
              compareAtPriceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
                maxVariantPrice {
                  amount
                  currencyCode
                }
              }
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
                maxVariantPrice {
                  amount
                  currencyCode
                }
              }
              variants(first: 250) {
                pageInfo {
                  hasNextPage
                  hasPreviousPage
                  endCursor
                }
                edges {
                  node {
                    id
                    image {
                      url
                      altText
                      width
                      height
                    }
                    title
                    sku
                    quantityAvailable
                    availableForSale
                    requiresShipping
                    selectedOptions {
                      name
                      value
                    }
                    price {
                      amount
                      currencyCode
                    }
                    compareAtPrice {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
        }
      `;
      const getCartQuery = `
        query GetCart($cartId: ID!) {
          cart(id: $cartId) {
            id
            createdAt
            updatedAt
            checkoutUrl
            buyerIdentity {
              countryCode
            }
            lines(first: 250) {
              edges {
                node {
                  id
                  quantity
                  sellingPlanAllocation { 
                    checkoutChargeAmount {
                      amount
                      currencyCode
                    }
                    sellingPlan {
                      id
                      name
                      description
                    }
                  }
                  merchandise {
                    ... on ProductVariant {
                      id
                      title
                      image {
                        url
                        altText
                        width
                        height
                      }
                      selectedOptions {
                        name
                        value
                      }
                      product {
                        title
                        handle
                      }
                      price {
                        amount
                        currencyCode
                      }
                      compareAtPrice {
                        amount
                        currencyCode
                      }
                    }
                  }
                  attributes {
                    key
                    value
                  }
                  cost {
                    subtotalAmount {
                      amount
                      currencyCode
                    }
                    totalAmount {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
            attributes {
              key
              value
            }
            cost {
              totalAmount {
                amount
                currencyCode
              }
              subtotalAmount {
                amount
                currencyCode
              }
            }
          }
        }
      `;
      const getCartQueryNoPlans = `
        query GetCart($cartId: ID!) {
          cart(id: $cartId) {
            id
            createdAt
            updatedAt
            checkoutUrl
            buyerIdentity {
              countryCode
            }
            lines(first: 250) {
              edges {
                node {
                  id
                  quantity
                  merchandise {
                    ... on ProductVariant {
                      id
                      title
                      image {
                        url
                        altText
                        width
                        height
                      }
                      selectedOptions {
                        name
                        value
                      }
                      product {
                        title
                        handle
                      }
                      price {
                        amount
                        currencyCode
                      }
                      compareAtPrice {
                        amount
                        currencyCode
                      }
                    }
                  }
                  attributes {
                    key
                    value
                  }
                  cost {
                    subtotalAmount {
                      amount
                      currencyCode
                    }
                    totalAmount {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
            attributes {
              key
              value
            }
            cost {
              totalAmount {
                amount
                currencyCode
              }
              subtotalAmount {
                amount
                currencyCode
              }
            }
          }
        }
      `;
      const getAvailableCurrencies = `
        query GetAvailableCurrencies {
          localization {
            availableCountries {
              currency {
                isoCode
                name
                symbol
              }
              isoCode
              name
            }
          }
        }
      `;
      const getProductsQueryByCollection = `
        query GetProductsByCollection($cursor: String, $countryCode: CountryCode, $collectionHandle: String!) @inContext(country: $countryCode) {
          collection(handle: $collectionHandle) {
            products(first: 250, after: $cursor) {
              edges {
                node {
                  id
                  title
                  vendor
                  handle
                  productType
                  tags
                  collections(first: 250) {
                    edges {
                      node {
                        id
                        title
                        handle
                      }
                    }
                  }
                  images(first: 20) {
                    edges {
                      node {
                        url
                        altText
                        width
                        height
                      }
                    }
                  }
                  metafields(identifiers: [
                    { namespace: "custom", key: "fc_color" },
                    { namespace: "custom", key: "fc_size" }
                  ]) {
                    key
                    namespace
                    value
                  }
                  sellingPlanGroups(first: 1) {
                    edges {
                      node {
                        name
                        options {
                          name
                          values
                        }
                        sellingPlans(first: 10) {
                          edges {
                            node {
                              id
                              name
                              description
                              recurringDeliveries
                              priceAdjustments {
                                orderCount
                                adjustmentValue {
                                  __typename
                                  ... on SellingPlanPercentagePriceAdjustment {
                                    adjustmentPercentage
                                  }
                                  ... on SellingPlanFixedAmountPriceAdjustment {
                                    adjustmentAmount {
                                      amount
                                      currencyCode
                                    }
                                  }
                                  ... on SellingPlanFixedPriceAdjustment {
                                    price {
                                      amount
                                      currencyCode
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                  options {
                    id
                    name
                    values
                  }
                  compareAtPriceRange {
                    minVariantPrice {
                      amount
                      currencyCode
                    }
                    maxVariantPrice {
                      amount
                      currencyCode
                    }
                  }
                  priceRange {
                    minVariantPrice {
                      amount
                      currencyCode
                    }
                    maxVariantPrice {
                      amount
                      currencyCode
                    }
                  }
                  variants(first: 250) {
                    pageInfo {
                      hasNextPage
                      hasPreviousPage
                      endCursor
                    }
                    edges {
                      node {
                        id
                        image {
                          url
                          altText
                          width
                          height
                        }
                        title
                        sku
                        quantityAvailable
                        availableForSale
                        requiresShipping
                        selectedOptions {
                          name
                          value
                        }
                        price {
                          amount
                          currencyCode
                        }
                        compareAtPrice {
                          amount
                          currencyCode
                        }
                      }
                    }
                  }
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      `;
      const getLessProductsQueryByCollection = `
        query GetProductsByCollection($cursor: String, $countryCode: CountryCode, $collectionHandle: String!) @inContext(country: $countryCode) {
          collection(handle: $collectionHandle) {
            products(first: 80, after: $cursor) {
              edges {
                node {
                  id
                  title
                  vendor
                  handle
                  productType
                  tags
                  collections(first: 250) {
                    edges {
                      node {
                        id
                        title
                        handle
                      }
                    }
                  }
                  images(first: 20) {
                    edges {
                      node {
                        url
                        altText
                        width
                        height
                      }
                    }
                  }
                  metafields(identifiers: [
                    { namespace: "custom", key: "fc_color" },
                    { namespace: "custom", key: "fc_size" }
                  ]) {
                    key
                    namespace
                    value
                  }
                  sellingPlanGroups(first: 1) {
                    edges {
                      node {
                        name
                        options {
                          name
                          values
                        }
                        sellingPlans(first: 10) {
                          edges {
                            node {
                              id
                              name
                              description
                              recurringDeliveries
                              priceAdjustments {
                                orderCount
                                adjustmentValue {
                                  __typename
                                  ... on SellingPlanPercentagePriceAdjustment {
                                    adjustmentPercentage
                                  }
                                  ... on SellingPlanFixedAmountPriceAdjustment {
                                    adjustmentAmount {
                                      amount
                                      currencyCode
                                    }
                                  }
                                  ... on SellingPlanFixedPriceAdjustment {
                                    price {
                                      amount
                                      currencyCode
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                  options {
                    id
                    name
                    values
                  }
                  compareAtPriceRange {
                    minVariantPrice {
                      amount
                      currencyCode
                    }
                    maxVariantPrice {
                      amount
                      currencyCode
                    }
                  }
                  priceRange {
                    minVariantPrice {
                      amount
                      currencyCode
                    }
                    maxVariantPrice {
                      amount
                      currencyCode
                    }
                  }
                  variants(first: 250) {
                    pageInfo {
                      hasNextPage
                      hasPreviousPage
                      endCursor
                    }
                    edges {
                      node {
                        id
                        image {
                          url
                          altText
                          width
                          height
                        }
                        title
                        sku
                        quantityAvailable
                        availableForSale
                        requiresShipping
                        selectedOptions {
                          name
                          value
                        }
                        price {
                          amount
                          currencyCode
                        }
                        compareAtPrice {
                          amount
                          currencyCode
                        }
                      }
                    }
                  }
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      `;
      const getProductsQueryByCollectionBackup = `
        query GetProductsByCollectionBackup($cursor: String, $countryCode: CountryCode, $collectionHandle: String!) @inContext(country: $countryCode) {
          collection(handle: $collectionHandle) {
            products(first: 250, after: $cursor) {
              edges {
                node {
                  id
                  title
                  vendor
                  handle
                  productType
                  tags
                  collections(first: 250) {
                    edges {
                      node {
                        id
                        title
                        handle
                      }
                    }
                  }
                  images(first: 20) {
                    edges {
                      node {
                        url
                        altText
                        width
                        height
                      }
                    }
                  }
                  metafields(identifiers: [
                    { namespace: "custom", key: "fc_color" },
                    { namespace: "custom", key: "fc_size" }
                  ]) {
                    key
                    namespace
                    value
                  }
                  options {
                    id
                    name
                    values
                  }
                  compareAtPriceRange {
                    minVariantPrice {
                      amount
                      currencyCode
                    }
                    maxVariantPrice {
                      amount
                      currencyCode
                    }
                  }
                  priceRange {
                    minVariantPrice {
                      amount
                      currencyCode
                    }
                    maxVariantPrice {
                      amount
                      currencyCode
                    }
                  }
                  variants(first: 250) {
                    pageInfo {
                      hasNextPage
                      hasPreviousPage
                      endCursor
                    }
                    edges {
                      node {
                        id
                        image {
                          url
                          altText
                          width
                          height
                        }
                        title
                        sku
                        quantityAvailable
                        availableForSale
                        requiresShipping
                        selectedOptions {
                          name
                          value
                        }
                        price {
                          amount
                          currencyCode
                        }
                        compareAtPrice {
                          amount
                          currencyCode
                        }
                      }
                    }
                  }
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      `;
      const getProductsQueryByCountry = `
        query GetProductsByCountry ($cursor: String, $countryCode: CountryCode, $query: String) @inContext(country: $countryCode) {
          products(
            first: 250, 
            after: $cursor, 
            query: $query
          ) {
            edges {
              node {
                id
                title
                vendor
                handle
                productType
                tags
                collections(first: 250) {
                  edges {
                    node {
                      id
                      title
                      handle
                    }
                  }
                }
                images(first: 20) {
                  edges {
                    node {
                      url
                      altText
                      width
                      height
                    }
                  }
                }
                metafields(identifiers: [
                  { namespace: "custom", key: "fc_color" },
                  { namespace: "custom", key: "fc_size" }
                ]) {
                  key
                  namespace
                  value
                }
                sellingPlanGroups(first: 1) {
                  edges {
                    node {
                      name
                      options {
                        name
                        values
                      }
                      sellingPlans(first: 10) {
                        edges {
                          node {
                            id
                            name
                            description
                            recurringDeliveries
                            priceAdjustments {
                              orderCount
                              adjustmentValue {
                                __typename
                                ... on SellingPlanPercentagePriceAdjustment {
                                  adjustmentPercentage
                                }
                                ... on SellingPlanFixedAmountPriceAdjustment {
                                  adjustmentAmount {
                                    amount
                                    currencyCode
                                  }
                                }
                                ... on SellingPlanFixedPriceAdjustment {
                                  price {
                                    amount
                                    currencyCode
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
                options {
                  id
                  name
                  values
                }
                compareAtPriceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                  maxVariantPrice {
                    amount
                    currencyCode
                  }
                }
                priceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                  maxVariantPrice {
                    amount
                    currencyCode
                  }
                }
                variants(first: 250) {
                  pageInfo {
                    hasNextPage
                    hasPreviousPage
                    endCursor
                  }
                  edges {
                    node {
                      id
                      image {
                        url
                        altText
                        width
                        height
                      }
                      title
                      sku
                      quantityAvailable
                      availableForSale
                      requiresShipping
                      selectedOptions {
                        name
                        value
                      }
                      price {
                        amount
                        currencyCode
                      }
                      compareAtPrice {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;
      const getProductsQueryByCountryBackup = `
        query GetProductsByCountryBackup($cursor: String, $countryCode: CountryCode, $query: String) @inContext(country: $countryCode) {
          products(
            first: 250, 
            after: $cursor, 
            query: $query
          ) {
            edges {
              node {
                id
                title
                vendor
                handle
                productType
                tags
                collections(first: 250) {
                  edges {
                    node {
                      id
                      title
                      handle
                    }
                  }
                }
                images(first: 20) {
                  edges {
                    node {
                      url
                      altText
                      width
                      height
                    }
                  }
                }
                metafields(identifiers: [
                  { namespace: "custom", key: "fc_color" },
                  { namespace: "custom", key: "fc_size" }
                ]) {
                  key
                  namespace
                  value
                }
                options {
                  id
                  name
                  values
                }
                compareAtPriceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                  maxVariantPrice {
                    amount
                    currencyCode
                  }
                }
                priceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                  maxVariantPrice {
                    amount
                    currencyCode
                  }
                }
                variants(first: 250) {
                  pageInfo {
                    hasNextPage
                    hasPreviousPage
                    endCursor
                  }
                  edges {
                    node {
                      id
                      image {
                        url
                        altText
                        width
                        height
                      }
                      title
                      sku
                      quantityAvailable
                      availableForSale
                      requiresShipping
                      selectedOptions {
                        name
                        value
                      }
                      price {
                        amount
                        currencyCode
                      }
                      compareAtPrice {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;
      const getLessProductsQueryByCountry = `
        query GetProductsByCountry ($cursor: String, $countryCode: CountryCode, $query: String) @inContext(country: $countryCode) {
          products(
            first: 80, 
            after: $cursor, 
            query: $query
          ) {
            edges {
              node {
                id
                title
                vendor
                handle
                productType
                tags
                collections(first: 250) {
                  edges {
                    node {
                      id
                      title
                      handle
                    }
                  }
                }
                images(first: 20) {
                  edges {
                    node {
                      url
                      altText
                      width
                      height
                    }
                  }
                }
                metafields(identifiers: [
                  { namespace: "custom", key: "fc_color" },
                  { namespace: "custom", key: "fc_size" }
                ]) {
                  key
                  namespace
                  value
                }
                sellingPlanGroups(first: 1) {
                  edges {
                    node {
                      name
                      options {
                        name
                        values
                      }
                      sellingPlans(first: 10) {
                        edges {
                          node {
                            id
                            name
                            description
                            recurringDeliveries
                            priceAdjustments {
                              orderCount
                              adjustmentValue {
                                __typename
                                ... on SellingPlanPercentagePriceAdjustment {
                                  adjustmentPercentage
                                }
                                ... on SellingPlanFixedAmountPriceAdjustment {
                                  adjustmentAmount {
                                    amount
                                    currencyCode
                                  }
                                }
                                ... on SellingPlanFixedPriceAdjustment {
                                  price {
                                    amount
                                    currencyCode
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
                options {
                  id
                  name
                  values
                }
                compareAtPriceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                  maxVariantPrice {
                    amount
                    currencyCode
                  }
                }
                priceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                  maxVariantPrice {
                    amount
                    currencyCode
                  }
                }
                variants(first: 250) {
                  pageInfo {
                    hasNextPage
                    hasPreviousPage
                    endCursor
                  }
                  edges {
                    node {
                      id
                      image {
                        url
                        altText
                        width
                        height
                      }
                      title
                      sku
                      quantityAvailable
                      availableForSale
                      requiresShipping
                      selectedOptions {
                        name
                        value
                      }
                      price {
                        amount
                        currencyCode
                      }
                      compareAtPrice {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;
      window.shopXtools = window.shopXtools || {};
      window.shopXtools.products = [];
      window.shopXtools.fetchCart = null;
      window.shopXtools.dispatchEvent = (eventType, detail) => {
            const newEvent = new CustomEvent(eventType, { detail });
            document.dispatchEvent(newEvent);
          };
      window.shopXtools.handleCartMutation = async (mutation, variables) => {
        const endpoint = `https:
        const token = fcConfigs.storefrontAccessToken;
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Storefront-Access-Token": token,
            },
            body: JSON.stringify({
              query: mutation,
              variables,
            }),
          });
          const result = await response.json();
          if (response.ok && !result.errors) {
            if (result.data && (result.data.cartCreate || result.data.cartLinesAdd || 
                result.data.cartLinesRemove || result.data.cartLinesUpdate || 
                result.data.cartBuyerIdentityUpdate)) {
              const cartData = result.data.cartCreate?.cart || 
                              result.data.cartLinesAdd?.cart || 
                              result.data.cartLinesRemove?.cart || 
                              result.data.cartLinesUpdate?.cart ||
                              result.data.cartBuyerIdentityUpdate?.cart;
              if (cartData) {
                window.shopXtools.cart = cartData;
                localStorage.setItem("shopXtools.cart", JSON.stringify(cartData));
                if (cartData.checkoutUrl) {
                  document.dispatchEvent(new CustomEvent('data__cart-updated', {
                    detail: { cart: cartData }
                  }));
                }
                if (result.data.cartBuyerIdentityUpdate && cartData.buyerIdentity && cartData.buyerIdentity.countryCode) {
                  initializeCurrencySettings();
                }
              }
            }
            return result.data;
          } else {
            console.error("GraphQL errors:", result.errors);
            return null;
          }
        } catch (error) {
          console.error("Network error:", error);
          return null;
        }
      };
        window.shopXtools.handleTemporaryCartMutation = async (mutation, variables) => {
        const endpoint = `https:
        const token = fcConfigs.storefrontAccessToken;
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Storefront-Access-Token": token,
            },
            body: JSON.stringify({
              query: mutation,
              variables,
            }),
          });
          const result = await response.json();
          if (response.ok && !result.errors) {
            if (result.data && (result.data.cartCreate || result.data.cartLinesAdd || 
                result.data.cartLinesRemove || result.data.cartLinesUpdate || 
                result.data.cartBuyerIdentityUpdate)) {
              const cartData = result.data.cartCreate?.cart || 
                              result.data.cartLinesAdd?.cart || 
                              result.data.cartLinesRemove?.cart || 
                              result.data.cartLinesUpdate?.cart ||
                              result.data.cartBuyerIdentityUpdate?.cart;
              if (cartData) {
                if (result.data.cartBuyerIdentityUpdate && cartData.buyerIdentity && cartData.buyerIdentity.countryCode) {
                  initializeCurrencySettings();
                }
              }
            }
            return result.data; 
          } else {
            console.error("GraphQL errors:", result.errors);
            return null;
          }
        } catch (error) {
          console.error("Network error:", error);
          return null;
        }
      };
      window.shopXtools.fetchCart = async function(cartId) {
        const variables = { cartId: cartId };
        const endpoint = `https:
        const tryFetchCart = async (query, queryName) => {
          try {
            const response = await fetch(endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Shopify-Storefront-Access-Token": fcConfigs.storefrontAccessToken,
              },
              body: JSON.stringify({ query: query, variables }),
            });
            const result = await response.json();
            if (result.errors) {
              console.error(`${queryName} failed with errors:`, result.errors);
              return null;
            }
            if (result.data && result.data.cart) {
              window.shopXtools.cart = result.data.cart;
              localStorage.setItem("shopXtools.cart", JSON.stringify(result.data.cart));
              if (result.data.cart.checkoutUrl) {
                document.dispatchEvent(new CustomEvent('data__cart-updated', {
                  detail: { cart: result.data.cart }
                }));
              }
              if (result.data.cart.buyerIdentity && result.data.cart.buyerIdentity.countryCode) {
                initializeCurrencySettings();
              }
              return result.data.cart;
            } else {
              console.error(`Cart data not found in response from ${queryName}:`, result);
              return null;
            }
          } catch (error) {
            console.error(`Network error during ${queryName}:`, error);
            return null;
          }
        };
        let cartData = await tryFetchCart(getCartQuery, "Primary cart query");
        if (!cartData) {
          cartData = await tryFetchCart(getCartQueryNoPlans, "Backup cart query");
        }
        return cartData;
      };
      const configValidation = () => {
        if (!fcConfigs.storefrontDomain) {
          throw Error("Storefront domain not found");
        }
        if (!fcConfigs.storefrontAccessToken) {
          throw Error("Storefront access token not found");
        }
      };
      const setDomainUrl = () => {
        let storeDomain = "https:
        if (fcConfigs.storefrontDomain) {
          storeDomain = fcConfigs.storefrontDomain.startsWith("http")
            ? fcConfigs.storefrontDomain
            : `https:
        }
        domain = new URL(storeDomain);
      };
      const shopify = async (type, query, variables) => {
        const endpoint = `https:
        const response = await fetch(endpoint, {
          method: "POST",
          body: JSON.stringify({ [type]: query, variables }),
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Storefront-Access-Token": fcConfigs.storefrontAccessToken,
          },
        });
        const json = await response.json();
        return json.data;
      };
      window.shopXtools.priorityQueue = [];
      window.shopXtools.priorityFetching = false;
      window.shopXtools.pendingPriorityRequests = new Set();
      const getProducts = (_id) => {
        const fullId = _id.startsWith('gid:
        console.log("checking fullId", fullId)
        if (window.shopXtools) {
        console.log("shopXtools initialized, trying to find the product")
          const product = window.shopXtools.products?.find(
            ({ node: product }) => product && product.id === fullId
          );
          if (product) {
            console.log("returning found product", product)
            return product;
          }
          if (!window.shopXtools.pendingPriorityRequests.has(fullId)) {
            window.shopXtools.pendingPriorityRequests.add(fullId);
            window.shopXtools.priorityQueue.push(fullId);
          }
        }
      };
      window.shopXtools.getProducts = getProducts;
      const fetchProductsByIds = async (productIds, countryCode) => {
        if (!productIds || productIds.length === 0) return [];
        if (!domain || !domain.host) {
          setTimeout(() => fetchProductsByIds(productIds, countryCode), 100);
          return [];
        }
        const existingIds = new Set(
          (window.shopXtools.products || []).map(({ node }) => node?.id).filter(Boolean)
        );
        const missingIds = productIds.filter(id => {
          const fullId = id.startsWith('gid:
          return !existingIds.has(fullId);
        });
        if (missingIds.length === 0) return [];
        try {
          const endpoint = `https:
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Storefront-Access-Token": fcConfigs.storefrontAccessToken,
            },
            body: JSON.stringify({
              query: getProductsByIdsQuery,
              variables: {
                ids: missingIds,
                countryCode: countryCode || localStorage.getItem("selectedCountryCode") || "US"
              }
            }),
          });
          const result = await response.json();
          if (result.errors) {
            console.error('Error fetching products by IDs:', result.errors);
            missingIds.forEach(id => {
              window.shopXtools.pendingPriorityRequests.delete(
                id.startsWith('gid:
              );
            });
            return [];
          }
          if (result.data?.nodes) {
            const products = result.data.nodes
              .filter(node => node !== null && node.id)
              .map(node => {
                if (!node.id || !node.handle || !node.title) {
                  console.warn('Priority product missing required fields, skipping:', {
                    id: node.id,
                    handle: node.handle,
                    title: node.title
                  });
                  return null;
                }
                return {
                  node: {
                    id: node.id,
                    handle: node.handle,
                    title: node.title,
                    vendor: node.vendor,
                    productType: node.productType,
                    tags: node.tags,
                    metafields: node.metafields,
                    collections: Array.isArray(node.collections)
                      ? node.collections 
                      : (node.collections?.edges || []).map(edge => ({
                        node: {
                          id: edge.node.id,
                          handle: edge.node.handle,
                          title: edge.node.title
                        }
                    })),
                    variants: {
                      edges: (node.variants?.edges || []).map(({ node: variant }) => ({
                        node: {
                          id: variant.id,
                          title: variant.title,
                          price: variant.price,
                          availableForSale: variant.availableForSale,
                          selectedOptions: variant.selectedOptions || [],
                          quantityAvailable: variant.quantityAvailable || 0,
                          compareAtPrice: variant.compareAtPrice,
                          requiresShipping: variant.requiresShipping
                        }
                      }))
                    },
                    options: node.options || [],
                    priceRange: node.priceRange,
                    compareAtPriceRange: node.compareAtPriceRange,
                    sellingPlanGroups: node.sellingPlanGroups ? {
                      edges: (node.sellingPlanGroups.edges || []).map(({ node: sellingPlanGroup }) => ({
                        node: {
                          name: sellingPlanGroup.name,
                          options: sellingPlanGroup.options,
                          sellingPlans: {
                            edges: (sellingPlanGroup.sellingPlans.edges || []).map(({ node: sellingPlan }) => ({
                              node: {
                                id: sellingPlan.id,
                                name: sellingPlan.name,
                                description: sellingPlan.description,
                                recurringDeliveries: sellingPlan.recurringDeliveries,
                                priceAdjustments: sellingPlan.priceAdjustments
                              }
                            }))
                          }
                        }
                      }))
                    } : null
                  }
                };
              })
              .filter(Boolean); 
            if (products.length > 0) {
            console.log('Fetched priority products by IDs:', products)
              const existingProducts = window.shopXtools.products || [];
              const newProductIds = new Set(products.map(({ node }) => node.id));
              console.log('existingProducts products:', existingProducts)
              const allProductsAlreadyExist = products.every(({ node }) =>
                existingProducts.some(({ node: existing }) => existing.id === node.id)
              );
              console.log('allProductsAlreadyExist products:', allProductsAlreadyExist)
              products.forEach(({ node }) => {
                window.shopXtools.pendingPriorityRequests.delete(node.id);
              });
              if (allProductsAlreadyExist) {
                console.log('Priority products already exist, skipping dispatch to prevent re-render');
                return products;
              }
              const filteredExisting = existingProducts.filter(
                ({ node }) => node && !newProductIds.has(node.id)
              );
              console.log('filteredExisting products:', filteredExisting)
              window.shopXtools.products = [...products, ...filteredExisting];
              if (window.shopXtools.productsWithPrices) {
                const countryCodeKey = countryCode || localStorage.getItem("selectedCountryCode") || "US";
                const existingForCountry = window.shopXtools.productsWithPrices[countryCodeKey] || [];
                const filteredForCountry = existingForCountry.filter(
                  ({ node }) => node && !newProductIds.has(node.id)
                );
                window.shopXtools.productsWithPrices[countryCodeKey] = [
                  ...products,
                  ...filteredForCountry
                ];
              }
              requestAnimationFrame(() => {
                window.shopXtools.dispatchEvent('data__products-ready', {
                  products: window.shopXtools.products,
                  isInitialLoad: false,
                  isPriorityFetch: true
                });
                console.log('Priority products merged and dispatched via data__products-ready:', {
                  priorityProducts: products,
                  products: window.shopXtools.products,
                  totalProducts: window.shopXtools.products.length,
                  requestedIds: missingIds
                })
              });
              return products;
            }
          }
          missingIds.forEach(id => {
            window.shopXtools.pendingPriorityRequests.delete(
              id.startsWith('gid:
            );
          });
          return [];
        } catch (error) {
          console.error('Error fetching products by IDs:', error);
          missingIds.forEach(id => {
            window.shopXtools.pendingPriorityRequests.delete(
              id.startsWith('gid:
            );
          });
          return [];
        }
      };
      const processPriorityQueue = async () => {
        if (window.shopXtools.priorityQueue.length === 0) return;
        if (!domain || !domain.host) {
          setTimeout(() => processPriorityQueue(), 100);
          return;
        }
        window.shopXtools.priorityFetching = true;
        const countryCode = localStorage.getItem("selectedCountryCode") || "US";
        const batchSize = 50;
        const queue = [...window.shopXtools.priorityQueue];
        window.shopXtools.priorityQueue = [];
        for (let i = 0; i < queue.length; i += batchSize) {
          const batch = queue.slice(i, i + batchSize);
          await fetchProductsByIds(batch, countryCode);
          if (i + batchSize < queue.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        window.shopXtools.priorityFetching = false;
        if (window.shopXtools.priorityQueue.length > 0) {
          setTimeout(processPriorityQueue, 0);
        }
      };
      const fetchAvailableCurrencies = async () => {
        if (!domain || !domain.host) {
          console.warn("fetchAvailableCurrencies: domain not ready; skipping fetch");
          return null;
        }
        const endpoint = `https:
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Storefront-Access-Token": fcConfigs.storefrontAccessToken,
            },
            body: JSON.stringify({ query: getAvailableCurrencies }),
          });
          const result = await response.json();
          if (result.errors) {
            console.error("Error fetching currencies:", result.errors);
            return null;
          }
          const availableCurrenciesAndCountries = result?.data?.localization?.availableCountries;
          sessionStorage.setItem("availableCurrenciesAndCountries", JSON.stringify(availableCurrenciesAndCountries));
          return { availableCurrenciesAndCountries };
        } catch (error) {
          console.error("Error fetching currencies:", error);
          return null;
        }
      };
      window.shopXtools.fetchAvailableCurrencies = fetchAvailableCurrencies;
      const initializeCurrencySettings = async () => {
        if (!domain) {
            await setDomainUrl();
        }
        if (!domain || !domain.host) {
            console.error("Domain is still undefined after initialization. Cannot fetch currencies.");
            return;
        }
        let availableCurrenciesAndCountries = JSON.parse(sessionStorage.getItem("availableCurrenciesAndCountries"));
        if (!availableCurrenciesAndCountries) {
            const currencies = await fetchAvailableCurrencies();
            if (!currencies) {
                console.error("Failed to fetch available currencies");
                return;
            }
            availableCurrenciesAndCountries = currencies.availableCurrenciesAndCountries;
            sessionStorage.setItem("availableCurrenciesAndCountries", JSON.stringify(availableCurrenciesAndCountries));
        }
        const fcCheckoutConfigs = window.__FcCheckoutConfigs || {};
        const configCountry = fcCheckoutConfigs.defaultCountry;
        const configCountryCode = fcCheckoutConfigs.defaultCountryCode;
        const configCurrency = fcCheckoutConfigs.defaultCurrency;
        const configCurrencySymbol = fcCheckoutConfigs.defaultCurrencySymbol;
        let storedCurrency = localStorage.getItem("selectedCurrency");
        let storedCountry = localStorage.getItem("selectedCountry");
        let storedCountryCode = localStorage.getItem("selectedCountryCode");
        let storedCurrencySymbol = localStorage.getItem("selectedCurrencySymbol");
        let cart;
        try {
          const cartData = localStorage.getItem("shopXtools.cart");
          if (cartData) {
            cart = JSON.parse(cartData);
          } else {
            cart = {};
          }
        } catch (error) {
          console.error("Error parsing cart data:", error);
          cart = {};
        }
        const buyerIdentity = cart.buyerIdentity || {};
        const countryCodeFromCart = buyerIdentity.countryCode;
        window.shopXtools.cart = cart;
        let finalCountryCode;
        let finalCurrency = null;
        let finalCountry = null;
        let finalCurrencySymbol = null;
        if (countryCodeFromCart) {
          finalCountryCode = countryCodeFromCart;
        } else if (storedCountryCode && storedCurrency && storedCountry && storedCurrencySymbol) {
          finalCountryCode = storedCountryCode;
          finalCurrency = storedCurrency;
          finalCountry = storedCountry;
          finalCurrencySymbol = storedCurrencySymbol;
        } else if (configCountryCode && configCurrency && configCountry) {
          finalCountryCode = configCountryCode;
          finalCurrency = configCurrency;
          finalCountry = configCountry;
          finalCurrencySymbol = configCurrencySymbol;
        } else {
          if (availableCurrenciesAndCountries && availableCurrenciesAndCountries.length > 0) {
            finalCountryCode = availableCurrenciesAndCountries[0].isoCode;
          } else {
            console.error("No country data available");
            return;
          }
        }
        if (!finalCurrency || !finalCountry) {
          const matchedCountry = availableCurrenciesAndCountries.find(c => c.isoCode === finalCountryCode);
          if (matchedCountry) {
            finalCurrency = matchedCountry.currency.isoCode;
            finalCountry = matchedCountry.name;
            if (knownCurrenciesWithCodeAsSymbol[finalCurrency]){
              finalCurrencySymbol = finalCurrency
            } else {
              finalCurrencySymbol = CURRENCIES[finalCurrency];
            }
          } else {
            if (availableCurrenciesAndCountries && availableCurrenciesAndCountries.length > 0) {
              const firstCountry = availableCurrenciesAndCountries[0];
              finalCountryCode = firstCountry.isoCode;
              finalCurrency = firstCountry.currency.isoCode;
              finalCountry = firstCountry.name;
              if (knownCurrenciesWithCodeAsSymbol[finalCurrency]){
                finalCurrencySymbol = finalCurrency
              } else {
                finalCurrencySymbol = CURRENCIES[finalCurrency];
              }
            } else {
              console.error("Cannot determine country settings");
              return;
            }
          }
        }
        localStorage.setItem("selectedCountry", finalCountry);
        localStorage.setItem("selectedCurrency", finalCurrency);
        localStorage.setItem("selectedCountryCode", finalCountryCode);
        localStorage.setItem("selectedCurrencySymbol", finalCurrencySymbol);
        window.shopXtools.defaultCurrency = finalCurrency;
        window.shopXtools.defaultCountry = finalCountry;
        window.shopXtools.defaultCountryCode = finalCountryCode;
        window.shopXtools.defaultCurrencySymbol = finalCurrencySymbol;
        const currencyEvent = new CustomEvent('currency__settings-updated', {
          detail: {
            previous: {
              defaultCountry: storedCountry,
              defaultCountryCode: storedCountryCode,
              defaultCurrency: storedCurrency,
              defaultCurrencySymbol: storedCurrencySymbol
            },
            current: {
              defaultCountry: finalCountry,
              defaultCountryCode: finalCountryCode,
              defaultCurrency: finalCurrency,
              defaultCurrencySymbol: finalCurrencySymbol
            }
          }
        });
        document.dispatchEvent(currencyEvent);
      };
      const handleProductData = (newProducts, countryCode, isInitialLoad = false, cursor = null) => {
        try {
          if (!Array.isArray(newProducts)) {
            console.warn('handleProductData: newProducts is not an array, converting to empty array');
            newProducts = [];
          }
          const transformedProducts = newProducts.map(({ node }) => {
            if (!node || typeof node !== 'object') {
              console.warn('handleProductData: Invalid node structure, skipping product');
              return null;
            }
            if (!node.id || !node.handle || !node.title) {
              console.warn('handleProductData: Product missing required fields, skipping:', { 
                id: node.id, 
                handle: node.handle, 
                title: node.title 
              });
              return null;
            }
            if (isInitialLoad) {
              return {
                node: {
                  id: node.id,
                  handle: node.handle,
                  title: node.title,
                  priceRange: node.priceRange,
                  compareAtPriceRange: node.compareAtPriceRange || null,
                  productType: node.productType || null,
                  tags: Array.isArray(node.tags) ? node.tags : [],
                  collections: (() => {
                    try {
                      return node.collections?.edges ? 
                        node.collections.edges.map(edge => ({
                          node: {
                            id: edge.node?.id || '',
                            handle: edge.node?.handle || '',
                            title: edge.node?.title || ''
                          }
                        })).filter(col => col.node.id && col.node.handle) : [];
                    } catch (error) {
                      console.warn('Error processing collections, using empty array:', error);
                      return [];
                    }
                  })(),
                  metafields: node.metafields || [],
                  variants: { 
                    edges: (() => {
                      try {
                        return (node.variants?.edges || []).map(({ node: variant }) => ({
                          node: {
                            id: variant?.id || '',
                            title: variant?.title || '',
                            price: variant?.price || null,
                            availableForSale: Boolean(variant?.availableForSale),
                            selectedOptions: Array.isArray(variant?.selectedOptions) ? variant.selectedOptions : [],
                            quantityAvailable: Number(variant?.quantityAvailable) || 0,
                            compareAtPrice: variant?.compareAtPrice || null
                          }
                        })).filter(v => v.node.id); 
                      } catch (error) {
                        console.warn('Error processing variants, using empty array:', error);
                        return [];
                      }
                    })()
                  },
                  options: node.options || []
                }
              };
            }
            return {
              node: {
                id: node.id,
                handle: node.handle,
                title: node.title,
                vendor: node.vendor,
                productType: node.productType,
                tags: node.tags,
                metafields: node.metafields,
                collections: Array.isArray(node.collections)
                  ? node.collections 
                  : (node.collections?.edges || []).map(edge => ({
                    node: {
                      id: edge.node.id,
                      handle: edge.node.handle,
                      title: edge.node.title
                    }
                })),
                variants: { 
                  edges: (node.variants?.edges || []).map(({ node: variant }) => ({
                    node: {
                      id: variant.id,
                      title: variant.title,
                      price: variant.price,
                      availableForSale: variant.availableForSale,
                      selectedOptions: variant.selectedOptions || [],
                      quantityAvailable: variant.quantityAvailable || 0,
                      compareAtPrice: variant.compareAtPrice,
                      requiresShipping: variant.requiresShipping
                    }
                  }))
                },
                options: node.options || [],
                priceRange: node.priceRange,
                compareAtPriceRange: node.compareAtPriceRange,
                sellingPlanGroups: node.sellingPlanGroups ? {
                  edges: (node.sellingPlanGroups.edges || []).map(({ node: sellingPlanGroup }) => ({
                    node: {
                      name: sellingPlanGroup.name,
                      options: sellingPlanGroup.options,
                      sellingPlans: {
                        edges: (sellingPlanGroup.sellingPlans.edges || []).map(({ node: sellingPlan }) => ({
                          node: {
                            id: sellingPlan.id,
                            name: sellingPlan.name,
                            description: sellingPlan.description,
                            recurringDeliveries: sellingPlan.recurringDeliveries,
                            priceAdjustments: sellingPlan.priceAdjustments
                          }
                        }))
                      }
                    }
                  }))
                } : null
              }
            };
          }).filter(Boolean); 
          if (transformedProducts.length !== newProducts.length) {
            console.warn('handleProductData: Filtered out ' + (newProducts.length - transformedProducts.length) + ' invalid products');
          }
          if (!cursor) {
            products = transformedProducts;
          } else {
            products = [...products, ...transformedProducts];
          }
          const CHUNK_SIZE = 50;
          const chunks = [];
          for (let i = 0; i < products.length; i += CHUNK_SIZE) {
            chunks.push(products.slice(i, i + CHUNK_SIZE));
          }
          let storageQuotaExceeded = false;
          try {
            if (!storageQuotaExceeded) {
              try {
                const oldMetadata = JSON.parse(sessionStorage.getItem('fc_products_' + countryCode + '_metadata') || '{}');
                if (oldMetadata.totalChunks) {
                  for (let i = 0; i < oldMetadata.totalChunks; i++) {
                    sessionStorage.removeItem('fc_products_' + countryCode + '_chunk_' + i);
                  }
                }
              } catch (error) {
                console.warn('Storage quota exceeded during cleanup, switching to in-memory only');
                storageQuotaExceeded = true;
              }
            }
            if (!storageQuotaExceeded) {
              for (let i = 0; i < chunks.length; i++) {
                const chunkKey = 'fc_products_' + countryCode + '_chunk_' + i;
                try {
                  sessionStorage.setItem(chunkKey, JSON.stringify(chunks[i]));
                } catch (storageError) {
                  console.warn('Storage quota exceeded at chunk', i, ', switching to in-memory only');
                  storageQuotaExceeded = true;
                  break;
                }
              }
              if (!storageQuotaExceeded) {
                const metadata = {
                  totalChunks: chunks.length,
                  totalProducts: products.length,
                  lastUpdated: Date.now(),
                  isComplete: !cursor
                };
                try {
                  sessionStorage.setItem('fc_products_' + countryCode + '_metadata', JSON.stringify(metadata));
                } catch (error) {
                  console.warn('Storage quota exceeded during metadata update');
                  storageQuotaExceeded = true;
                }
              }
            }
          } catch (error) {
            console.warn('Storage operations failed, proceeding with in-memory only');
            storageQuotaExceeded = true;
          }
          window.shopXtools.productsWithPrices = { [countryCode]: products };
          window.shopXtools.products = products;
          window.shopXtools.status = "ready";
          window.shopXtools.dispatchEvent('data__products-ready', { 
            products: window.shopXtools.products,
            isInitialLoad
          });
          if (isInitialLoad && !cursor) {
            const { vendor, collection, productType, tag } = window.shopXtools.lastAppliedFilters || {};
            setTimeout(() => {
              fetchCompleteProductData(countryCode, vendor, collection, productType, tag);
            }, 0);
          }
        } catch (error) {
          console.error('Error in handleProductData:', error);
          window.shopXtools.status = "error";
        }
      };
      const filterProductsClientSide = (products, filters) => {
        const { vendor, collection, productType, tag } = filters;
        return products.filter(({ node }) => {
          if (vendor && node.vendor !== vendor) {
            return false;
          }
          if (collection) {
            const collections = node.collections || [];
            const matchingCollection = collections.find(col => 
              col.handle === collection.toLowerCase() || 
              col.title === collection
            );
            if (!matchingCollection) {
              return false;
            }
          }
          if (productType && node.productType !== productType) {
            return false;
          }
          if (tag) {
            const tags = node.tags || [];
            if (!tags.includes(tag)) {
              return false;
            }
          }
          return true;
        });
      };
      const fetchProductsByCountry = async (countryCode, cursor = null, vendor = null, collection = null, productType = null, tag = null) => {
        if (!cursor) {
          const newFilters = { vendor, collection, productType, tag };
          window.shopXtools.lastAppliedFilters = newFilters;
          try {
            const storedFilters = JSON.parse(sessionStorage.getItem('fc_filters') || '{}');
            const filtersChanged = JSON.stringify(storedFilters) !== JSON.stringify(newFilters);
            if (filtersChanged) {
              sessionStorage.setItem('fc_filters', JSON.stringify(newFilters));
              products = [];
              return fetchProductsByCountry(countryCode, null, vendor, collection, productType, tag);
            }
          } catch (error) {
            console.error('Error handling filter storage:', error);
          }
          products = [];
          try {
            const metadata = JSON.parse(sessionStorage.getItem('fc_products_' + countryCode + '_metadata') || '{}');
            if (metadata.totalChunks > 0) {
              let cachedProducts = [];
              for (let i = 0; i < metadata.totalChunks; i++) {
                const chunkKey = 'fc_products_' + countryCode + '_chunk_' + i;
                const chunk = JSON.parse(sessionStorage.getItem(chunkKey) || '[]');
                cachedProducts = cachedProducts.concat(chunk);
              }
              if (cachedProducts.length > 0) {
                handleProductData(cachedProducts, countryCode, false, cursor);
                if (Date.now() - metadata.lastUpdated > 60000 || !metadata.isComplete) {
                } else {
                  return;
                }
              }
            }
          } catch (error) {
            console.error('Error loading from cache:', error);
          }
        }
        try {
          let response;
          let variables;
          let query;
          if (collection) {
            query = getProductsQueryByCollection;
            variables = {
              countryCode,
              collectionHandle: collection.toLowerCase(),
              ...(cursor && { cursor })
            };
          } else {
            query = getProductsQueryByCountry;
            const queryParts = [];
            if (vendor) queryParts.push(`vendor:${vendor}`);
            if (productType) queryParts.push(`product_type:${productType}`);
            if (tag) queryParts.push(`tag:${tag}`);
            const queryString = queryParts.length > 0 ? queryParts.join(" AND ") : null;
            variables = {
              countryCode,
              ...(cursor && { cursor }),
              ...(queryString && { query: queryString })
            };
          }
          response = await fetch(`https:
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Storefront-Access-Token": fcConfigs.storefrontAccessToken,
            },
            body: JSON.stringify({ query, variables }),
          });
          const result = await response.json();
          if (collection) {
            if (!result.errors && result.data?.collection?.products) {
              const newProducts = result.data.collection.products.edges || [];
              handleProductData(newProducts, countryCode, true, cursor);
              const pageInfo = result.data.collection.products.pageInfo;
              if (pageInfo.hasNextPage && pageInfo.endCursor) {
                await fetchProductsByCountry(countryCode, pageInfo.endCursor, vendor, collection, productType, tag);
              } else {
                const metadata = {
                  totalChunks: Math.ceil(products.length / 50),
                  totalProducts: products.length,
                  lastUpdated: Date.now(),
                  isComplete: true
                };
                sessionStorage.setItem('fc_products_' + countryCode + '_metadata', JSON.stringify(metadata));
              }
            } else if (result.errors) {
              console.error('Error fetching collection products:', result.errors);
              window.shopXtools.status = "error";
            } else if (!result.data?.collection) {
              console.error('Collection not found:', collection);
              window.shopXtools.status = "ready";
              window.shopXtools.products = [];
              window.shopXtools.dispatchEvent('data__products-ready', { 
                products: [],
                isInitialLoad: false
              });
            }
          } else {
            if (!result.errors && result.data?.products) {
              const newProducts = result.data.products.edges || [];
              handleProductData(newProducts, countryCode, true, cursor);
              const pageInfo = result.data.products.pageInfo;
              if (pageInfo.hasNextPage && pageInfo.endCursor) {
                await fetchProductsByCountry(countryCode, pageInfo.endCursor, vendor, collection, productType, tag);
              } else {
                const metadata = {
                  totalChunks: Math.ceil(products.length / 50),
                  totalProducts: products.length,
                  lastUpdated: Date.now(),
                  isComplete: true
                };
                sessionStorage.setItem('fc_products_' + countryCode + '_metadata', JSON.stringify(metadata));
              }
            }
          }
        } catch (error) {
          console.error('Error fetching products:', error);
          window.shopXtools.status = "error";
        }
      };
      const fetchCompleteProductData = async (countryCode, vendor, collection, productType, tag) => {
        let cursor = null;
        let allProducts = [];
        try {
            while (true) {
                let response;
                let variables;
                let query;
                if (collection) {
                    query = getLessProductsQueryByCollection;
                    variables = {
                        countryCode,
                        collectionHandle: collection.toLowerCase(),
                        ...(cursor && { cursor })
                    };
                } else {
                    query = getLessProductsQueryByCountry;
                    const queryParts = [];
                    if (vendor) queryParts.push(`vendor:${vendor}`);
                    if (productType) queryParts.push(`product_type:${productType}`);
                    if (tag) queryParts.push(`tag:${tag}`);
                    const queryString = queryParts.length > 0 ? queryParts.join(" AND ") : null;
                    variables = {
                        countryCode,
                        cursor,
                        ...(queryString && { query: queryString })
                    };
                }
                response = await fetch(`https:
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Shopify-Storefront-Access-Token": fcConfigs.storefrontAccessToken,
                    },
                    body: JSON.stringify({ query, variables }),
                });
                const result = await response.json();
                if (collection) {
                    if (!result.errors && result.data?.collection?.products) {
                        const newProducts = result.data.collection.products.edges || [];
                        allProducts = [...allProducts, ...newProducts];
                        if (allProducts.length >= 500 || !result.data.collection.products.pageInfo.hasNextPage) {
                            handleProductData(allProducts, countryCode, false, cursor);
                            allProducts = [];
                        }
                        if (!result.data.collection.products.pageInfo.hasNextPage) {
                            break;
                        }
                        cursor = result.data.collection.products.pageInfo.endCursor;
                    } else {
                        console.error('Error fetching complete collection data:', result.errors);
                        break;
                    }
                } else {
                    if (!result.errors && result.data?.products) {
                        const newProducts = result.data.products.edges || [];
                        allProducts = [...allProducts, ...newProducts];
                        if (allProducts.length >= 500 || !result.data.products.pageInfo.hasNextPage) {
                            handleProductData(allProducts, countryCode, false, cursor);
                            allProducts = [];
                        }
                        if (!result.data.products.pageInfo.hasNextPage) {
                            break;
                        }
                        cursor = result.data.products.pageInfo.endCursor;
                    } else {
                        console.error('Error fetching complete product data:', result.errors);
                        break;
                    }
                }
            }
        } catch (error) {
            console.error('Error in background data fetch:', error);
        }
      };
      window.shopXtools = window.shopXtools || {};
      window.shopXtools.fetchProductsByCountry = fetchProductsByCountry;
      window.shopXtools.fetchProductsByIds = fetchProductsByIds;
      window.shopXtools.processPriorityQueue = processPriorityQueue;
      if (typeof setInterval !== 'undefined') {
        setInterval(() => {
          if (window.shopXtools.priorityQueue && 
              window.shopXtools.priorityQueue.length > 0 && 
              !window.shopXtools.priorityFetching &&
              domain && domain.host) {
            processPriorityQueue();
          }
        }, 500); 
      }
      configValidation();
      setDomainUrl();
  const validateDomainForFreePlan = () => {
    if ("free" === "free") {
      const isFramerSubdomain = domain.host.includes('framer.app');
      if (isFramerSubdomain) {
        console.error('Free plan users can only use a Framer subdomain');
        return false;
      }
    }
    return true;
  };
  if (!validateDomainForFreePlan()) {
    return;
  }
  if ("free" === "free") {
    const insertWidget = () => {
      const widget = document.createElement('div');
      widget.innerHTML = `
        <div 
          style="
            position: fixed;
            bottom: 60px;
            right: 20px;
            border-radius: 10px;
            overflow: hidden;
            z-index: 999999;
            transition: opacity 0.3s ease;
            box-shadow:
              rgba(0, 0, 0, 0.26) 0px 0.636953px 1.14652px -1.125px, 
              rgba(0, 0, 0, 0.24) 0px 1.9316px 3.47689px -2.25px, 
              rgba(0, 0, 0, 0.192) 0px 5.10612px 9.19102px -3.375px, 
              rgba(0, 0, 0, 0.03) 0px 16px 28.8px -4.5px;
            width: 142px;
            background: white;
          "
          onmouseover="this.style.opacity = '1'"
          onmouseout="this.style.opacity = '1'"
        >
          <a 
            href="https:
            target="_blank" 
            style="
              display: block;
              line-height: 0;
            "
          >
            <img 
              src="https:
              alt="Framer Commerce"
              width="142"
              height="36"
              style="display: block; width: 100%; height: auto;"
            />
          </a>
        </div>
      `;
      const existingWidget = document.querySelector('[data-framercommerce-widget]');
      if (!existingWidget) {
        widget.setAttribute('data-framercommerce-widget', 'true');
        document.body.appendChild(widget);
      }
    };
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(insertWidget, 1);
    } else {
      document.addEventListener('DOMContentLoaded', insertWidget);
    }
    window.addEventListener('load', insertWidget);
  }
      const initializeCartFromLocalStorage = () => {
        try {
          const cartData = localStorage.getItem("shopXtools.cart");
          if (cartData) {
            const cart = JSON.parse(cartData);
            window.shopXtools.cart = cart;
            if (cart.buyerIdentity && cart.buyerIdentity.countryCode) {
            }
          } else {
            window.shopXtools.cart = {};
          }
        } catch (error) {
          console.error("Error initializing cart from localStorage:", error);
          window.shopXtools.cart = {};
        }
      };
      initializeCartFromLocalStorage();
      if (!validateDomainForFreePlan()) {
        window.shopXtools.products = [];
        window.shopXtools.status = "ready";
        window.shopXtools.getProducts = () => null;
        return;
      }
      if (!window.shopXtools || !Array.isArray(window.shopXtools.products) || window.shopXtools.products.length === 0) {
        initializeCurrencySettings().then(() => {
            const storedCountryCode = localStorage.getItem("selectedCountryCode");
            if (storedCountryCode) {
              let storedFilters;
              try {
                storedFilters = JSON.parse(sessionStorage.getItem('fc_filters') || '{}');
              } catch (error) {
                console.error('Error reading stored filters:', error);
                storedFilters = {};
              }
              window.shopXtools.lastAppliedFilters = {
                vendor: storedFilters.vendor || null,
                collection: storedFilters.collection || null,
                productType: storedFilters.productType || null,
                tag: storedFilters.tag || null
              };
              window.shopXtools.getFilteredProducts = (filters = null) => {
                if (window.shopXtools.status !== "ready") {
                  console.warn("Products not yet loaded, please wait for data__products-ready event");
                  return [];
                }
                if (filters) {
                  const countryCode = localStorage.getItem("selectedCountryCode");
                  if (!countryCode) {
                    console.error("No country code available for product fetch");
                    return [];
                  }
                  window.shopXtools.lastAppliedFilters = { 
                    ...window.shopXtools.lastAppliedFilters,
                    ...filters
                  };
                  window.shopXtools.fetchProductsByCountry(
                    countryCode,
                    null,
                    filters.vendor || null,
                    filters.collection || null,
                    filters.productType || null,
                    filters.tag || null
                  );
                  return null;
                }
                const existingFilters = window.shopXtools.lastAppliedFilters;
                if (existingFilters.vendor || existingFilters.collection || existingFilters.productType || existingFilters.tag) {
                  const allProducts = window.shopXtools.productsWithPrices?.[localStorage.getItem("selectedCountryCode")] || [];
                  return filterProductsClientSide(allProducts, existingFilters);
                }
                return window.shopXtools.products;
              };
              window.shopXtools.areProductsFiltered = () => {
                const filters = window.shopXtools.lastAppliedFilters || {};
                return !!(filters.vendor || filters.collection || filters.productType || filters.tag);
              };
              window.shopXtools.getFilterInfo = () => {
                const filters = window.shopXtools.lastAppliedFilters || {};
                const activeFilters = {};
                if (filters.vendor) activeFilters.vendor = filters.vendor;
                if (filters.collection) activeFilters.collection = filters.collection;
                if (filters.productType) activeFilters.productType = filters.productType;
                if (filters.tag) activeFilters.tag = filters.tag;
                const allProductsCount = window.shopXtools.productsWithPrices?.[localStorage.getItem("selectedCountryCode")]?.length || 0;
                const filteredProductsCount = window.shopXtools.products?.length || 0;
                return {
                  isFiltered: window.shopXtools.areProductsFiltered(),
                  activeFilters,
                  allProductsCount,
                  filteredProductsCount,
                  filterRate: allProductsCount ? Math.round((filteredProductsCount / allProductsCount) * 100) : 100
                };
              };
              window.shopXtools.clearFilters = () => {
                window.shopXtools.lastAppliedFilters = {
                  vendor: null,
                  collection: null,
                  productType: null,
                  tag: null
                };
                const countryCode = localStorage.getItem("selectedCountryCode");
                if (!countryCode) {
                  console.error("No country code available for product fetch");
                  return;
                }
                return window.shopXtools.fetchProductsByCountry(countryCode);
              };
              const fcConfig = window.__FcCheckoutConfigs || {};
              let vendor = null;
              let collection = null;
              let productType = null;
              let tag = null;
              if (fcConfig.filterByVendor) {
                vendor = fcConfig.filterByVendor;
              }
              if (fcConfig.filterByCollection) {
                collection = fcConfig.filterByCollection;
              }
              if (fcConfig.filterByProductType) {
                productType = fcConfig.filterByProductType;
              }
              if (fcConfig.filterByTags) {
                tag = fcConfig.filterByTags;
              }
              window.shopXtools.lastAppliedFilters = {
                vendor: vendor,
                collection: collection,
                productType: productType,
                tag: tag
              };
              fetchProductsByCountry(
                storedCountryCode, 
                null, 
                vendor, 
                collection, 
                productType, 
                tag
              ).catch(error => {
                console.error('Error fetching products by country:', error);
                window.shopXtools.status = "ready";
              });
            } else {
                console.error('No country code available for product fetch');
            }
        }).catch(error => {
            console.error('Error during initialization:', error);
        });
      }
      window.__currencyMap = CURRENCIES;
      if (typeof window !== "undefined") {
        window.addEventListener(
          "popstate",
          (event) => {
          const urlParams = new URLSearchParams(window.location.search)
          const hasVariant = urlParams.has("variant")
          const currentPath = window.location.pathname
          const urlHandle = currentPath.split("/").filter(Boolean).pop()
          const isProductPage = (
            Array.isArray(window.shopXtools?.products)
              ? window.shopXtools.products.some(({ node }) => node.handle === urlHandle)
              : false
          )
            if (isProductPage && hasVariant) {
              event.stopImmediatePropagation()
              window.location.reload()
            }
          },
          true
        )
      }
      if (typeof window !== "undefined") {
        const cleanVariantData = () => {
          const urlParams = new URLSearchParams(window.location.search)
          const hasVariant = urlParams.has("variant")
          const currentPath = window.location.pathname
          const urlHandle = currentPath.split("/").filter(Boolean).pop()
          const isProductPage = (
            Array.isArray(window.shopXtools?.products)
              ? window.shopXtools.products.some(({ node }) => node.handle === urlHandle)
              : false
          )
          if (!isProductPage && hasVariant) {
            urlParams.delete("variant")
            const newUrl = `${window.location.pathname}${urlParams.toString() ? "?" + urlParams.toString() : ""}`;
            window.history.replaceState({}, "", newUrl)
            try {
              for (let i = sessionStorage.length - 1; i >= 0; i--) {
                  const key = sessionStorage.key(i)
                  if (key && key.startsWith("fc_active_variant_")) {
                    sessionStorage.removeItem(key)
                  }
              }
            } catch (error) {
              console.error(
                "Error clearing variant from sessionStorage:",
                error
              )
            }
          }
          if (!isProductPage) {
            try {
              for (let i = sessionStorage.length - 1; i >= 0; i--) {
                  const key = sessionStorage.key(i)
                  if (key && key.startsWith("fc_active_variant_")) {
                    sessionStorage.removeItem(key)
                  }
              }
            } catch (error) {
              console.error(
                "Error clearing variant from sessionStorage:",
                error
              )
            }
          }
        }
        window.addEventListener("popstate", cleanVariantData)
        const originalPushState = history.pushState
        const originalReplaceState = history.replaceState
        history.pushState = function (...args) {
          originalPushState.apply(this, args)
          cleanVariantData()
        }
        history.replaceState = function (...args) {
          originalReplaceState.apply(this, args)
          cleanVariantData()
        }
      }
      (function initializeShopifyConsentSync() {
        document.addEventListener('data__cart-updated', function(e) {
          if (!window.__FCShopifySyncInitialized && e.detail && e.detail.cart && e.detail.cart.checkoutUrl) {
            window.__FCShopifySyncInitialized = true;
            if (!window.FCDomainValidator.canShareCookies()) {
              console.warn('[FC Privacy] Shopify sync skipped: domains cannot share cookies. Run window.FCConsentManager.logShopifySync() for details.');
              return;
            }
            if (!window.FCConsentManager.isBannerPresent()) {
              return;
            }
            const script = document.createElement('script');
            script.src = 'https:
            script.async = true;
            script.onload = function() {
              let attempts = 0;
              const maxAttempts = 50; 
              const checkShopifyReady = function() {
                attempts++;
                if (typeof window.Shopify !== 'undefined' && typeof window.Shopify.customerPrivacy !== 'undefined') {
                  syncConsentToShopify();
                  if (window.FCConsentManager && typeof window.FCConsentManager.onConsentChange === 'function') {
                    window.FCConsentManager.onConsentChange(function(newConsent) {
                      syncConsentToShopify();
                    });
                  }
                  window.addEventListener('cookie_consent_update', function() {
                    syncConsentToShopify();
                  });
                  if (window.dataLayer) {
                    const originalPush = window.dataLayer.push;
                    window.dataLayer.push = function() {
                      const result = originalPush.apply(window.dataLayer, arguments);
                      if (arguments[0] && typeof arguments[0] === 'object') {
                        const data = arguments[0];
                        if ('consent' in data || 'analytics_storage' in data || 'ad_storage' in data) {
                          setTimeout(function() {
                            syncConsentToShopify();
                          }, 100);
                        }
                      }
                      return result;
                    };
                  }
                } else if (attempts < maxAttempts) {
                  setTimeout(checkShopifyReady, 100);
                } else {
                  console.error('[FC Privacy] Timeout waiting for window.Shopify.customerPrivacy');
                }
              };
              checkShopifyReady();
            };
            script.onerror = function() {
              console.error('[FC Privacy] Failed to load Shopify Privacy API script');
            };
            document.head.appendChild(script);
          }
        });
        function syncConsentToShopify() {
          if (!window.Shopify || !window.Shopify.customerPrivacy) {
            return;
          }
          const consent = window.FCConsentManager.getConsent();
          if (!consent.bannerDetected) {
            return;
          }
          const checkoutUrl = window.shopXtools?.cart?.checkoutUrl;
          if (!checkoutUrl) {
            return;
          }
          try {
            const checkoutDomain = new URL(checkoutUrl).hostname;
            const framerHostname = window.location.hostname;
            const rootDomain = window.FCDomainValidator.extractRootDomain(framerHostname);
            window.Shopify.customerPrivacy.setTrackingConsent(
              {
                sale_of_data: consent.marketing,
                analytics: consent.analytics,
                marketing: consent.marketing,
                preferences: consent.preferences,
                headlessStorefront: true,
                checkoutRootDomain: checkoutDomain,
                storefrontRootDomain: rootDomain,
                storefrontAccessToken: fcConfigs.storefrontAccessToken
              },
              function(error) {
                if (error) {
                  console.error('[FC Privacy] Error syncing consent to Shopify:', error);
                }
              }
            );
          } catch (error) {
            console.error('[FC Privacy] Error syncing consent:', error);
          }
        }
      })();
    })();
(()=>{function u(){function n(t,e,i){let r=document.createElement("a");r.href=t,r.target=i,r.rel=e,document.body.appendChild(r),r.click(),r.remove()}function o(t){if(this.dataset.hydrated){this.removeEventListener("click",o);return}t.preventDefault(),t.stopPropagation();let e=this.getAttribute("href");if(!e)return;if(/Mac|iPod|iPhone|iPad/u.test(navigator.userAgent)?t.metaKey:t.ctrlKey)return n(e,"","_blank");let r=this.getAttribute("rel")??"",c=this.getAttribute("target")??"";n(e,r,c)}function a(t){if(this.dataset.hydrated){this.removeEventListener("auxclick",o);return}t.preventDefault(),t.stopPropagation();let e=this.getAttribute("href");e&&n(e,"","_blank")}function s(t){if(this.dataset.hydrated){this.removeEventListener("keydown",s);return}if(t.key!=="Enter")return;t.preventDefault(),t.stopPropagation();let e=this.getAttribute("href");if(!e)return;let i=this.getAttribute("rel")??"",r=this.getAttribute("target")??"";n(e,i,r)}document.querySelectorAll("[data-nested-link]").forEach(t=>{t instanceof HTMLElement&&(t.addEventListener("click",o),t.addEventListener("auxclick",a),t.addEventListener("keydown",s))})}return u})()()
!function(){var w="framer_variant";function u(a,r){let e=r.indexOf("#"),t=e===-1?r:r.substring(0,e),o=e===-1?"":r.substring(e),n=t.indexOf("?"),h=n===-1?t:t.substring(0,n),d=n===-1?"":t.substring(n),s=new URLSearchParams(d),m=new URLSearchParams(a);for(let[i,l]of m)s.has(i)||i!==w&&s.append(i,l);let c=s.toString();return c===""?t+o:h+"?"+c+o}var g='div#main a[href^="#"],div#main a[href^="/"],div#main a[href^="."]',f="div#main a[data-framer-preserve-params]",S=document.currentScript?.hasAttribute("data-preserve-internal-params");if(window.location.search&&!navigator.webdriver&&!/bot|-google|google-|yandex|ia_archiver|crawl|spider/iu.test(navigator.userAgent)){let a=document.querySelectorAll(S?`${g},${f}`:f);for(let r of a){let e=u(window.location.search,r.href);r.setAttribute("href",e)}}
}()
var animator=(()=>{var L=(e,r,t)=>t>r?r:t<e?e:t;var U=()=>{};function _(e){let r;return()=>(r===void 0&&(r=e()),r)}var Q=e=>e;var D=e=>e*1e3,O=e=>e/1e3;var J=e=>Array.isArray(e)&&typeof e[0]=="number";var ee={value:null,addProjectionMetrics:null};var re={layout:0,mainThread:0,waapi:0};var $=(e,r,t=10)=>{let o="",s=Math.max(Math.round(r/t),2);for(let i=0;i<s;i++)o+=Math.round(e(i/(s-1))*1e4)/1e4+", ";return`linear(${o.substring(0,o.length-2)})`};function j(e){let r=0,t=50,o=e.next(r);for(;!o.done&&r<2e4;)r+=t,o=e.next(r);return r>=2e4?1/0:r}function ye(e,r=100,t){let o=t({...e,keyframes:[0,r]}),s=Math.min(j(o),2e4);return{type:"keyframes",ease:i=>o.next(s*i).value/r,duration:O(s)}}var g={stiffness:100,damping:10,mass:1,velocity:0,duration:800,bounce:.3,visualDuration:.3,restSpeed:{granular:.01,default:2},restDelta:{granular:.005,default:.5},minDuration:.01,maxDuration:10,minDamping:.05,maxDamping:1};function ne(e,r){return e*Math.sqrt(1-r*r)}var Be=12;function Ke(e,r,t){let o=t;for(let s=1;s<Be;s++)o=o-e(o)/r(o);return o}var oe=.001;function Ge({duration:e=g.duration,bounce:r=g.bounce,velocity:t=g.velocity,mass:o=g.mass}){let s,i;U(e<=D(g.maxDuration),"Spring duration must be 10 seconds or less","spring-duration-limit");let n=1-r;n=L(g.minDamping,g.maxDamping,n),e=L(g.minDuration,g.maxDuration,O(e)),n<1?(s=m=>{let p=m*n,c=p*e,u=p-t,x=ne(m,n),A=Math.exp(-c);return oe-u/x*A},i=m=>{let c=m*n*e,u=c*t+t,x=Math.pow(n,2)*Math.pow(m,2)*e,A=Math.exp(-c),d=ne(Math.pow(m,2),n);return(-s(m)+oe>0?-1:1)*((u-x)*A)/d}):(s=m=>{let p=Math.exp(-m*e),c=(m-t)*e+1;return-oe+p*c},i=m=>{let p=Math.exp(-m*e),c=(t-m)*(e*e);return p*c});let f=5/e,a=Ke(s,i,f);if(e=D(e),isNaN(a))return{stiffness:g.stiffness,damping:g.damping,duration:e};{let m=Math.pow(a,2)*o;return{stiffness:m,damping:n*2*Math.sqrt(o*m),duration:e}}}var Le=["duration","bounce"],Re=["stiffness","damping","mass"];function Ae(e,r){return r.some(t=>e[t]!==void 0)}function ze(e){let r={velocity:g.velocity,stiffness:g.stiffness,damping:g.damping,mass:g.mass,isResolvedFromDuration:!1,...e};if(!Ae(e,Re)&&Ae(e,Le))if(r.velocity=0,e.visualDuration){let t=e.visualDuration,o=2*Math.PI/(t*1.2),s=o*o,i=2*L(.05,1,1-(e.bounce||0))*Math.sqrt(s);r={...r,mass:g.mass,stiffness:s,damping:i}}else{let t=Ge({...e,velocity:0});r={...r,...t,mass:g.mass},r.isResolvedFromDuration=!0}return r}function E(e=g.visualDuration,r=g.bounce){let t=typeof e!="object"?{visualDuration:e,keyframes:[0,1],bounce:r}:e,{restSpeed:o,restDelta:s}=t,i=t.keyframes[0],n=t.keyframes[t.keyframes.length-1],f={done:!1,value:i},{stiffness:a,damping:m,mass:p,duration:c,velocity:u,isResolvedFromDuration:x}=ze({...t,velocity:-O(t.velocity||0)}),A=u||0,d=m/(2*Math.sqrt(a*p)),h=n-i,y=O(Math.sqrt(a/p)),F=Math.abs(h)<5;o||(o=F?g.restSpeed.granular:g.restSpeed.default),s||(s=F?g.restDelta.granular:g.restDelta.default);let w,v,M,G,Y,H;if(d<1)M=ne(y,d),G=(A+d*y*h)/M,w=l=>{let T=Math.exp(-d*y*l);return n-T*(G*Math.sin(M*l)+h*Math.cos(M*l))},Y=d*y*G+h*M,H=d*y*h-G*M,v=l=>Math.exp(-d*y*l)*(Y*Math.sin(M*l)+H*Math.cos(M*l));else if(d===1){w=T=>n-Math.exp(-y*T)*(h+(A+y*h)*T);let l=A+y*h;v=T=>Math.exp(-y*T)*(y*l*T-A)}else{let l=y*Math.sqrt(d*d-1);w=S=>{let k=Math.exp(-d*y*S),P=Math.min(l*S,300);return n-k*((A+d*y*h)*Math.sinh(P)+l*h*Math.cosh(P))/l};let T=(A+d*y*h)/l,V=d*y*T-h*l,N=d*y*h-T*l;v=S=>{let k=Math.exp(-d*y*S),P=Math.min(l*S,300);return k*(V*Math.sinh(P)+N*Math.cosh(P))}}let Z={calculatedDuration:x&&c||null,velocity:l=>D(v(l)),next:l=>{if(!x&&d<1){let V=Math.exp(-d*y*l),N=Math.sin(M*l),S=Math.cos(M*l),k=n-V*(G*N+h*S),P=D(V*(Y*N+H*S));return f.done=Math.abs(P)<=o&&Math.abs(n-k)<=s,f.value=f.done?n:k,f}let T=w(l);if(x)f.done=l>=c;else{let V=D(v(l));f.done=Math.abs(V)<=o&&Math.abs(n-T)<=s}return f.value=f.done?n:T,f},toString:()=>{let l=Math.min(j(Z),2e4),T=$(V=>Z.next(l*V).value,l,30);return l+"ms "+T},toTransition:()=>{}};return Z}E.applyToOptions=e=>{let r=ye(e,100,E);return e.ease=r.ease,e.duration=D(r.duration),e.type="keyframes",e};var he=["transformPerspective","x","y","z","translateX","translateY","translateZ","scale","scaleX","scaleY","rotate","rotateX","rotateY","rotateZ","skew","skewX","skewY"],ie=new Set(he);var Te={};function Me(e,r){let t=_(e);return()=>Te[r]??t()}var be=Me(()=>{try{document.createElement("div").animate({opacity:0},{easing:"linear(0, 1)"})}catch{return!1}return!0},"linearEasing");var C=([e,r,t,o])=>`cubic-bezier(${e}, ${r}, ${t}, ${o})`;var ae={linear:"linear",ease:"ease",easeIn:"ease-in",easeOut:"ease-out",easeInOut:"ease-in-out",circIn:C([0,.65,.55,1]),circOut:C([.55,0,1,.45]),backIn:C([.31,.01,.66,-.59]),backOut:C([.33,1.53,.69,.99])};function se(e,r){if(e)return typeof e=="function"?be()?$(e,r):"ease-out":J(e)?C(e):Array.isArray(e)?e.map(t=>se(t,r)||ae.easeOut):ae[e]}function W(e,r,t,{delay:o=0,duration:s=300,repeat:i=0,repeatType:n="loop",ease:f="easeOut",times:a}={},m=void 0){let p={[r]:t};a&&(p.offset=a);let c=se(f,s);Array.isArray(c)&&(p.easing=c),ee.value&&re.waapi++;let u={delay:o,duration:s,easing:Array.isArray(c)?"linear":c,fill:"both",iterations:i+1,direction:n==="reverse"?"alternate":"normal"};m&&(u.pseudoElement=m);let x=e.animate(p,u);return ee.value&&x.finished.finally(()=>{re.waapi--}),x}function ve(e){return e.replace(/([A-Z])/g,r=>`-${r.toLowerCase()}`)}var q="framerAppearId",pe="data-"+ve(q);function me(e){return e.props[pe]}var b=new Map,I=new Map;var B=(e,r)=>{let t=ie.has(r)?"transform":r;return`${e}: ${t}`};function fe(e,r,t){let o=B(e,r),s=b.get(o);if(!s)return null;let{animation:i,startTime:n}=s;function f(){window.MotionCancelOptimisedAnimation?.(e,r,t)}return i.onfinish=f,n===null||window.MotionHandoffIsComplete?.(e)?(f(),null):n}var X,K,ce=new Set;function Fe(){ce.forEach(e=>{e.animation.play(),e.animation.startTime=e.startTime}),ce.clear()}function le(e,r,t,o,s){if(window.MotionIsMounted)return;let i=e.dataset[q];if(!i)return;window.MotionHandoffAnimation=fe;let n=B(i,r);K||(K=W(e,r,[t[0],t[0]],{duration:1e4,ease:"linear"}),b.set(n,{animation:K,startTime:null}),window.MotionHandoffAnimation=fe,window.MotionHasOptimisedAnimation=(a,m)=>{if(!a)return!1;if(!m)return I.has(a);let p=B(a,m);return!!b.get(p)},window.MotionHandoffMarkAsComplete=a=>{I.has(a)&&I.set(a,!0)},window.MotionHandoffIsComplete=a=>I.get(a)===!0,window.MotionCancelOptimisedAnimation=(a,m,p,c)=>{let u=B(a,m),x=b.get(u);x&&(p&&c===void 0?p.postRender(()=>{p.postRender(()=>{x.animation.cancel()})}):x.animation.cancel(),p&&c?(ce.add(x),p.render(Fe)):(b.delete(u),b.size||(window.MotionCancelOptimisedAnimation=void 0)))},window.MotionCheckAppearSync=(a,m,p)=>{let c=me(a);if(!c)return;let u=window.MotionHasOptimisedAnimation?.(c,m),x=a.props.values?.[m];if(!u||!x)return;let A=p.on("change",d=>{x.get()!==d&&(window.MotionCancelOptimisedAnimation?.(c,m),A())});return A});let f=()=>{K.cancel();let a=W(e,r,t,o);X===void 0&&(X=performance.now()),a.startTime=X,b.set(n,{animation:a,startTime:X}),s&&s(a)};I.set(i,!1),K.ready?K.ready.then(f).catch(Q):f()}var ue=["transformPerspective","x","y","z","translateX","translateY","translateZ","scale","scaleX","scaleY","rotate","rotateX","rotateY","rotateZ","skew","skewX","skewY"],Ne={x:"translateX",y:"translateY",z:"translateZ",transformPerspective:"perspective"},$e={translateX:"px",translateY:"px",translateZ:"px",x:"px",y:"px",z:"px",perspective:"px",transformPerspective:"px",rotate:"deg",rotateX:"deg",rotateY:"deg"};function Ve(e,r){let t=$e[e];return!t||typeof r=="string"&&r.endsWith(t)?r:`${r}${t}`}function xe(e){return ue.includes(e)}var je=(e,r)=>ue.indexOf(e)-ue.indexOf(r);function Se({transform:e,transformKeys:r},t){let o={},s=!0,i="";r.sort(je);for(let n of r){let f=e[n],a=!0;typeof f=="number"?a=f===(n.startsWith("scale")?1:0):a=parseFloat(f)===0,a||(s=!1,i+=`${Ne[n]||n}(${e[n]}) `),t&&(o[n]=e[n])}return i=i.trim(),t?i=t(o,i):s&&(i="none"),i}function de(e,r){let t=new Set(Object.keys(e));for(let o in r)t.add(o);return Array.from(t)}function ge(e,r){let t=r-e.length;if(t<=0)return e;let o=new Array(t).fill(e[e.length-1]);return e.concat(o)}function R(e){return e*1e3}var Pe={duration:.001},z={opacity:1,scale:1,translateX:0,translateY:0,translateZ:0,x:0,y:0,z:0,rotate:0,rotateX:0,rotateY:0};function Oe(e,r,t,o,s){return t.delay&&(t.delay=R(t.delay)),t.type==="spring"?qe(e,r,t,o,s):Ye(e,r,t,o,s)}function We(e,r,t){let o={},s=0,i=0;for(let n of de(e,r)){let f=e[n]??z[n],a=r[n]??z[n];if(f===void 0||a===void 0||n!=="transformPerspective"&&f===a&&f===z[n])continue;n==="transformPerspective"&&(o[n]=[f,a]);let m=Qe(f,a,t),{duration:p,keyframes:c}=m;p===void 0||c===void 0||(p>s&&(s=p,i=c.length),o[n]=c)}return{keyframeValuesByProps:o,longestDuration:s,longestLength:i}}function qe(e,r,t,o,s){let i={},{keyframeValuesByProps:n,longestDuration:f,longestLength:a}=We(e,r,t);if(!a)return i;let m={ease:"linear",duration:f,delay:t.delay},p=s?Pe:m,c={};for(let[x,A]of Object.entries(n))xe(x)?c[x]=ge(A,a):i[x]={keyframes:ge(A,a),options:x==="opacity"?m:p};let u=Ce(c,o);return u&&(i.transform={keyframes:u,options:p}),i}function Xe(e){let{type:r,duration:t,...o}=e;return{duration:R(t),...o}}function Ye(e,r,t,o,s){let i=Xe(t);if(!i)return;let n={},f=s?Pe:i,a={};for(let p of de(e,r)){let c=e[p]??z[p],u=r[p]??z[p];c===void 0||u===void 0||p!=="transformPerspective"&&c===u||(xe(p)?a[p]=[c,u]:n[p]={keyframes:[c,u],options:p==="opacity"?i:f})}let m=Ce(a,o);return m&&(n.transform={keyframes:m,options:f}),n}var He=["duration","bounce"],Ze=["stiffness","damping","mass"];function Ee(e){return Ze.some(r=>r in e)?!1:He.some(r=>r in e)}function Ue(e,r,t){return Ee(t)?`${e}-${r}-${t.duration}-${t.bounce}`:`${e}-${r}-${t.damping}-${t.stiffness}-${t.mass}`}function _e(e){return Ee(e)?{...e,duration:R(e.duration)}:e}var De=new Map,we=10;function Qe(e,r,t){let o=Ue(e,r,t),s=De.get(o);if(s)return s;let i=[e,r],n=E({..._e(t),keyframes:i}),f={done:!1,value:i[0]},a=[],m=0;for(;!f.done&&m<R(10);)f=n.next(m),a.push(f.value),m+=we;i=a;let p=m-we,u={keyframes:i,duration:p,ease:"linear"};return De.set(o,u),u}function Ce(e,r){let t=[],o=Object.values(e)[0]?.length;if(!o)return;let s=Object.keys(e);for(let i=0;i<o;i++){let n={};for(let[a,m]of Object.entries(e)){let p=m[i];p!==void 0&&(n[a]=Ve(a,p))}let f=Se({transform:n,transformKeys:s},r);t.push(f)}return t}function Je(e,r){if(!r)for(let t in e){let o=e[t];return o?.legacy===!0?o:void 0}}function ke(e,r,t,o,s,i){for(let[n,f]of Object.entries(e)){let a=i?f[i]:void 0;if(a===null||!a&&f.default===null)continue;let m=a??f.default??Je(f,i);if(!m)continue;let{initial:p,animate:c,transformTemplate:u}=m;if(!p||!c)continue;let{transition:x,...A}=c,d=Oe(p,A,x,er(u,o),s);if(!d)continue;let h={},y={};for(let[w,v]of Object.entries(d))h[w]=v.keyframes,y[w]=v.options;let F=i?`:not(.hidden-${i}) `:"";r(`${F}[${t}="${n}"]`,h,y)}}function er(e,r){if(!(!e||!r))return(t,o)=>e.replace(r,o)}function Ie(e){return e?e.find(t=>t.mediaQuery?window.matchMedia(t.mediaQuery).matches===!0:!1)?.hash:void 0}var kt={animateAppearEffects:ke,getActiveVariantHash:Ie,spring:E,startOptimizedAppearAnimation:le};return kt})()
{"157ou9q":{"default":{"initial":{"opacity":0.001,"rotate":0,"rotateX":0,"rotateY":0,"scale":1,"skewX":0,"skewY":0,"x":0,"y":10},"animate":{"opacity":1,"rotate":0,"rotateX":0,"rotateY":0,"scale":1,"skewX":0,"skewY":0,"transition":{"delay":1.2,"duration":0.4,"ease":[0.44,0,0.56,1],"type":"tween"},"x":0,"y":0}}}}
[{"hash":"72rtr7","mediaQuery":"(min-width: 1280px)"},{"hash":"1g6n99x","mediaQuery":"(min-width: 810px) and (max-width: 1279.98px)"},{"hash":"1vb5nd8","mediaQuery":"(max-width: 809.98px)"},{"hash":"1w4xkco","mediaQuery":"(max-width: 809.98px)"},{"hash":"9a97y7","mediaQuery":"(min-width: 810px) and (max-width: 1279.98px)"},{"hash":"nzezew","mediaQuery":"(min-width: 1280px)"}]
(()=>{function c(i,o,s){if(window.__framer_disable_appear_effects_optimization__||typeof animator>"u")return;let e={detail:{bg:document.hidden}};requestAnimationFrame(()=>{let a="framer-appear-start";performance.mark(a,e),animator.animateAppearEffects(JSON.parse(window.__framer__appearAnimationsContent.text),(m,p,d)=>{let t=document.querySelector(m);if(t)for(let[r,f]of Object.entries(p))animator.startOptimizedAppearAnimation(t,r,f,d[r])},i,o,s&&window.matchMedia("(prefers-reduced-motion:reduce)").matches===!0,animator.getActiveVariantHash(JSON.parse(window.__framer__breakpoints.text)));let n="framer-appear-end";performance.mark(n,e),performance.measure("framer-appear",{start:a,end:n,detail:e.detail})})}return c})()("data-framer-appear-id","__Appear_Animation_Transform__",false)
typeof document<"u"&&(window.process={...window.process,env:{...window.process?.env,NODE_ENV:"production"}});
[{"0":1,"1":2},["Map"],["Map",3,4,5,6,7,8,9,10,11,12,13,14,15,16],"getSlugByRecordId|M1ipNc4mH|default|BsZ4uAL_0","orders-returns","getSlugByRecordId|M1ipNc4mH|default|wMd1LjDmG","shipping-delivery","getSlugByRecordId|u80klI_ya|default|awk1u2qPP","glow-milk","getSlugByRecordId|VpI7X80Hv|default|ObWeJfIam","effortless-glow-skincare-tips-for-natural-beauty","getSlugByRecordId|xLswf_qdK|default|tYmDrJXih","lotions","getSlugByRecordId|xLswf_qdK|default|OxqcYPOaK","cleansers","getSlugByRecordId|xLswf_qdK|default|cj4oB_X7T","moisturizers"]