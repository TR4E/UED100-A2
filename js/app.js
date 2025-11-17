/*
  app.js
  -------
  Provides all interactive behaviour for the Assessment 3 enhanced prototype.

  ASSESSMENT 3 ENHANCEMENTS:
  • Input sanitization to prevent XSS attacks
  • Comprehensive form validation with clear error messages
  • Toast notification system for user feedback
  • Loading states for async-like operations
  • Enhanced accessibility with ARIA attribute management
  • Keyboard navigation improvements
  • Password visibility toggle
  • Real-time validation feedback
  • Better error handling and user guidance

  Key Features Implemented:
  • Mock login (client-only; no backend)
  • Local session persistence using localStorage
  • Tab-based navigation controlling visible screens
  • Rendering of static mock transactions
  • Transfer form input validation (BSB + Account + Amount)
  • Security-focused input handling

  Security Notice:
  This is intentionally NOT real banking logic.
  No passwords are stored; this is demonstration only.
  Real environments require server-side authentication, secure cookies, 
  CSRF protection, HTTPS, etc.
*/

(function () {

  /*
    ================================================================
    UTILITY FUNCTIONS
    ================================================================
  */

  /*
    Utility: Shorthand DOM selection helpers
    $()       → returns first matching element
    $$()      → returns array of all matching elements
  */
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));


  /*
    ================================================================
    SECURITY: INPUT SANITIZATION
    ================================================================
  */

  /**
   * Sanitizes user input to prevent XSS attacks
   * Escapes HTML special characters
   * @param {string} str - Input string to sanitize
   * @returns {string} - Sanitized string
   */
  function sanitizeInput(str) {
    if (typeof str !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Validates and sanitizes numeric input
   * @param {string} value - Input value
   * @returns {number|null} - Parsed number or null if invalid
   */
  function sanitizeNumber(value) {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }


  /*
    ================================================================
    TOAST NOTIFICATION SYSTEM
    ================================================================
  */

  const toastContainer = $('#toastContainer');
  let toastCounter = 0;

  /**
   * Shows a toast notification to the user
   * @param {string} message - Message to display
   * @param {string} type - Type of toast: 'success', 'error', or 'info'
   * @param {number} duration - How long to show (ms), default 4000
   */
  function showToast(message, type = 'info', duration = 4000) {
    const toastId = `toast-${toastCounter++}`;
    const sanitizedMessage = sanitizeInput(message);
    
    // Icon SVGs for different toast types
    const icons = {
      success: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>`,
      error: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>`,
      info: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>`
    };

    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      ${icons[type]}
      <span class="toast-message">${sanitizedMessage}</span>
    `;

    toastContainer.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out forwards';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }


  /*
    ================================================================
    LOADING STATE MANAGEMENT
    ================================================================
  */

  /**
   * Shows loading state on a button
   * @param {HTMLElement} button - Button element
   */
  function showLoading(button) {
    const text = button.querySelector('.btn-text');
    const loader = button.querySelector('.btn-loader');
    if (text) text.hidden = true;
    if (loader) loader.hidden = false;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
  }

  /**
   * Hides loading state on a button
   * @param {HTMLElement} button - Button element
   */
  function hideLoading(button) {
    const text = button.querySelector('.btn-text');
    const loader = button.querySelector('.btn-loader');
    if (text) text.hidden = false;
    if (loader) loader.hidden = true;
    button.disabled = false;
    button.setAttribute('aria-busy', 'false');
  }

  /**
   * Simulates async operation (for demonstration)
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise}
   */
  function simulateAsync(ms = 800) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


  /*
    ================================================================
    YEAR DISPLAY
    ================================================================
  */
  
  $("#year").textContent = new Date().getFullYear();


  /*
    ================================================================
    NAVIGATION AND ROUTING
    ================================================================
  */

  /*
    Sections represent separate application screens.
    Only one section is visible at a time.
  */
  const sections = ["login", "dashboard", "transactions", "transfer"];
  const tabNav = $("#appTabs");

  /**
   * Controls which section of the interface is visible
   * @param {string} id - Section ID to show
   */
  function show(id) {
    sections.forEach((sec) => {
      const el = $("#" + sec);
      if (el) {
        el.hidden = sec !== id;
        // Update ARIA attributes for accessibility
        el.setAttribute('aria-hidden', sec !== id);
      }
    });

    // Show/hide tab navigation based on authenticated state
    const isAppScreen = (id === "dashboard" || id === "transactions" || id === "transfer");
    tabNav.hidden = !isAppScreen;

    // Update active tab indicator
    if (isAppScreen) {
      updateActiveTab(id);
    }

    // Announce page change to screen readers
    announcePageChange(id);
  }

  /**
   * Updates the active tab indicator
   * @param {string} tabId - ID of the active tab
   */
  function updateActiveTab(tabId) {
    $$("#appTabs .tab").forEach((tab) => {
      const isActive = tab.dataset.tab === tabId;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive);
    });
  }

  /**
   * Announces page changes to screen readers
   * @param {string} pageId - ID of the page being shown
   */
  function announcePageChange(pageId) {
    const announcements = {
      login: 'Login page',
      dashboard: 'Accounts dashboard',
      transactions: 'Transaction history',
      transfer: 'Transfer money'
    };
    
    // Create temporary announcement element
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = `Navigated to ${announcements[pageId] || pageId}`;
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }


  /*
    ================================================================
    SESSION MANAGEMENT
    ================================================================
  */

  const sessionKey = "session_key";

  /**
   * Checks if user is authenticated
   * @returns {boolean}
   */
  function isAuthed() {
    return localStorage.getItem(sessionKey) === "1";
  }

  /**
   * Sets authentication state
   * @param {boolean} value - Authentication state
   */
  function setAuthed(value) {
    localStorage.setItem(sessionKey, value ? "1" : "0");
  }


  /*
    ================================================================
    LOGIN HANDLING
    ================================================================
  */

  const loginForm = $("#loginForm");
  const loginStatus = $("#loginForm .form-status");
  const logoutBtn = $("#logoutBtn");
  const custInput = $("#cust");
  const passInput = $("#pass");

  /**
   * Validates login form inputs
   * @returns {Object} - Validation result with isValid flag and errors
   */
  function validateLogin() {
    const errors = [];
    const cust = custInput.value.trim();
    const pass = passInput.value.trim();

    if (!cust) {
      errors.push('Customer ID is required');
      custInput.setAttribute('aria-invalid', 'true');
    } else {
      custInput.setAttribute('aria-invalid', 'false');
    }

    if (!pass) {
      errors.push('Password is required');
      passInput.setAttribute('aria-invalid', 'true');
    } else if (pass.length < 4) {
      errors.push('Password must be at least 4 characters');
      passInput.setAttribute('aria-invalid', 'true');
    } else {
      passInput.setAttribute('aria-invalid', 'false');
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      cust: sanitizeInput(cust),
      pass: pass // Don't sanitize password display, just validate
    };
  }

  /**
   * Handles login form submission
   */
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitBtn = loginForm.querySelector('.btn');
    const validation = validateLogin();

    if (!validation.isValid) {
      loginStatus.textContent = validation.errors.join('. ') + '.';
      loginStatus.style.color = "var(--error)";
      showToast(validation.errors[0], 'error');
      return;
    }

    // Show loading state
    showLoading(submitBtn);
    loginStatus.textContent = 'Authenticating...';
    loginStatus.style.color = "var(--info)";

    // Simulate authentication delay
    await simulateAsync(1000);

    // Store mock "authenticated" state
    setAuthed(true);
    logoutBtn.hidden = false;

    loginStatus.textContent = "";
    hideLoading(submitBtn);
    
    showToast('Successfully logged in!', 'success');
    show("dashboard");
  });

  // Real-time validation feedback
  [custInput, passInput].forEach(input => {
    input.addEventListener('blur', () => {
      if (input.value.trim()) {
        validateLogin();
      }
    });
  });


  /*
    ================================================================
    PASSWORD VISIBILITY TOGGLE
    ================================================================
  */

  const togglePasswordBtn = $("#togglePassword");
  
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
      const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passInput.setAttribute('type', type);
      
      // Update button label
      const label = type === 'password' ? 'Show password' : 'Hide password';
      togglePasswordBtn.setAttribute('aria-label', label);
      
      // Update icon (optional visual feedback)
      togglePasswordBtn.style.color = type === 'text' ? 'var(--yellow)' : 'var(--muted)';
    });
  }


  /*
    ================================================================
    LOGOUT HANDLING
    ================================================================
  */

  logoutBtn.addEventListener("click", () => {
    setAuthed(false);
    logoutBtn.hidden = true;
    show("login");
    loginForm.reset();
    loginStatus.textContent = "";
    
    // Reset validation states
    custInput.setAttribute('aria-invalid', 'false');
    passInput.setAttribute('aria-invalid', 'false');
    
    custInput.focus();
    showToast('Successfully logged out', 'info');
  });


  /*
    ================================================================
    TAB NAVIGATION
    ================================================================
  */

  $$("#appTabs .tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabId = btn.dataset.tab;
      show(tabId);
    });
  });

  // Keyboard navigation for tabs
  const tabButtons = $$("#appTabs .tab");
  tabButtons.forEach((tab, index) => {
    tab.addEventListener('keydown', (e) => {
      let newIndex = index;
      
      if (e.key === 'ArrowRight') {
        newIndex = (index + 1) % tabButtons.length;
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        newIndex = (index - 1 + tabButtons.length) % tabButtons.length;
        e.preventDefault();
      }
      
      if (newIndex !== index) {
        tabButtons[newIndex].focus();
        tabButtons[newIndex].click();
      }
    });
  });


  /*
    ================================================================
    TRANSACTION RENDERING
    ================================================================
  */

  const transactions = [
    { date: "2025-11-15", desc: "Tap N Pay – Cafe", amt: -7.50, bal: 2442.85 },
    { date: "2025-11-14", desc: "Salary – ACME Pty Ltd", amt: 2200.00, bal: 2450.35 },
    { date: "2025-11-13", desc: "Groceries – Woolworths", amt: -120.40, bal: 250.35 },
    { date: "2025-11-12", desc: "Online Transfer", amt: -50.00, bal: 370.75 },
    { date: "2025-11-11", desc: "ATM Withdrawal", amt: -100.00, bal: 420.75 }
  ];

  const txBody = $("#txBody");

  /**
   * Renders the transaction table
   */
  function renderTx() {
    txBody.innerHTML = transactions
      .map((t) => {
        const isNegative = t.amt < 0;
        const formattedAmount = isNegative
          ? `-$${Math.abs(t.amt).toFixed(2)}`
          : `$${t.amt.toFixed(2)}`;
        
        const amountClass = isNegative ? 'amount-negative' : 'amount-positive';
        const amountLabel = isNegative ? 'Debit' : 'Credit';

        return `
          <tr>
            <td>${sanitizeInput(t.date)}</td>
            <td>${sanitizeInput(t.desc)}</td>
            <td class="text-right ${amountClass}" aria-label="${amountLabel} ${Math.abs(t.amt)}">${formattedAmount}</td>
            <td class="text-right">$${t.bal.toFixed(2)}</td>
          </tr>
        `;
      })
      .join("");
  }

  // Render transactions on load
  renderTx();


  /*
    ================================================================
    TRANSFER FORM VALIDATION
    ================================================================
  */

  const transferForm = $("#transferForm");
  const transferStatus = $("#transferForm .form-status");
  const toInput = $("#to");
  const amountInput = $("#amount");
  const descInput = $("#desc");

  /**
   * Validates BSB-Account number format
   * @param {string} value - Input value
   * @returns {boolean}
   */
  function validateBSBAccount(value) {
    // Expected format: 062-000 12345678 or 062000 12345678
    // BSB: 6 digits (with optional hyphen after 3rd)
    // Account: 6-9 digits
    const pattern = /^\d{3}-?\d{3}\s*\d{6,9}$/;
    return pattern.test(value.trim());
  }

  /**
   * Validates transfer amount
   * @param {number} amount - Amount to validate
   * @param {number} balance - Available balance
   * @returns {Object} - Validation result
   */
  function validateAmount(amount, balance) {
    if (amount === null || isNaN(amount)) {
      return { valid: false, error: 'Please enter a valid amount' };
    }
    if (amount <= 0) {
      return { valid: false, error: 'Amount must be greater than $0.00' };
    }
    if (amount > balance) {
      return { valid: false, error: `Insufficient funds. Available: $${balance.toFixed(2)}` };
    }
    if (amount > 10000) {
      return { valid: false, error: 'Transfer limit is $10,000.00 per transaction' };
    }
    return { valid: true };
  }

  /**
   * Validates the entire transfer form
   * @returns {Object} - Validation result
   */
  function validateTransfer() {
    const errors = [];
    const to = toInput.value.trim();
    const amount = sanitizeNumber(amountInput.value);
    const desc = descInput.value.trim();
    const fromAccount = $("#from").value;

    // Get balance for selected account
    const balances = { '001': 2450.35, '002': 8120.00 };
    const balance = balances[fromAccount] || 0;

    // Validate BSB-Account
    if (!to) {
      errors.push('Destination account is required');
      toInput.setAttribute('aria-invalid', 'true');
    } else if (!validateBSBAccount(to)) {
      errors.push('Invalid BSB-Account format. Use: 062-000 12345678');
      toInput.setAttribute('aria-invalid', 'true');
    } else {
      toInput.setAttribute('aria-invalid', 'false');
    }

    // Validate amount
    const amountValidation = validateAmount(amount, balance);
    if (!amountValidation.valid) {
      errors.push(amountValidation.error);
      amountInput.setAttribute('aria-invalid', 'true');
    } else {
      amountInput.setAttribute('aria-invalid', 'false');
    }

    // Validate description length
    if (desc.length > 40) {
      errors.push('Description must be 40 characters or less');
      descInput.setAttribute('aria-invalid', 'true');
    } else {
      descInput.setAttribute('aria-invalid', 'false');
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      data: {
        to: sanitizeInput(to),
        amount: amount,
        desc: sanitizeInput(desc),
        from: fromAccount
      }
    };
  }

  /**
   * Handles transfer form submission
   */
  transferForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitBtn = transferForm.querySelector('.btn');
    const validation = validateTransfer();

    if (!validation.isValid) {
      transferStatus.textContent = validation.errors[0];
      transferStatus.style.color = "var(--error)";
      showToast(validation.errors[0], 'error');
      return;
    }

    // Show loading state
    showLoading(submitBtn);
    transferStatus.textContent = 'Processing transfer...';
    transferStatus.style.color = "var(--info)";

    // Simulate transfer processing
    await simulateAsync(1500);

    // Success
    transferStatus.textContent = "";
    hideLoading(submitBtn);
    
    const { to, amount } = validation.data;
    showToast(`Successfully transferred $${amount.toFixed(2)} to ${to}`, 'success', 5000);
    
    transferForm.reset();
    
    // Reset validation states
    [toInput, amountInput, descInput].forEach(input => {
      input.setAttribute('aria-invalid', 'false');
    });
  });

  // Real-time validation on blur
  [toInput, amountInput, descInput].forEach(input => {
    input.addEventListener('blur', () => {
      if (input.value.trim() || input === amountInput) {
        validateTransfer();
      }
    });
  });

  // Real-time BSB-Account formatting
  toInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/[^\d\s-]/g, '');
    // Auto-format BSB with hyphen
    if (value.length >= 3 && value[3] !== '-' && !value.includes('-')) {
      value = value.slice(0, 3) + '-' + value.slice(3);
    }
    e.target.value = value;
  });

  // Prevent negative amounts
  amountInput.addEventListener('input', (e) => {
    if (parseFloat(e.target.value) < 0) {
      e.target.value = '';
    }
  });


  /*
    ================================================================
    INITIAL ROUTING
    ================================================================
  */

  if (isAuthed()) {
    logoutBtn.hidden = false;
    show("dashboard");
    showToast('Welcome back!', 'info', 2000);
  } else {
    show("login");
  }

  // Focus first input on login page
  if (!isAuthed()) {
    custInput.focus();
  }

})();
