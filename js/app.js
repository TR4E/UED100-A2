/*
  app.js
  -------
  Provides all interactive behaviour for the Assessment 2 prototype.

  Key Features Implemented:
  • Mock login (client-only; no backend)
  • Local session persistence using localStorage
  • Tab-based navigation controlling visible screens
  • Rendering of static mock transactions
  • Transfer form input validation (BSB + Account + Amount)

  Security Notice:
  This is intentionally NOT real banking logic.
  No passwords are stored; this is demonstration only.
  Real environments require server-side authentication, secure cookies, CSRF protection, etc.
*/

(function () {

  /*
    Utility: Shorthand DOM selection helpers

    $()       → returns first matching element
    $$()      → returns array of all matching elements

    Helps simplify code and keep selectors easy to use.
  */
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));


  /*
    Displays the current year in the footer.
    This reduces future maintenance and makes the UI feel current.
  */
  $("#year").textContent = new Date().getFullYear();


  /*
    Sections represent separate application screens.
    Only one section is visible at a time.
    Names must match section IDs inside index.html.
  */
  const sections = ["login", "dashboard", "transactions", "transfer"];

  // Reference to the bottom tab navigation
  const tabNav = $("#appTabs");


  /*
    show(id)
    --------
    Controls which section of the interface is visible.

    Hides all <section> panels, then unhides the one requested by ID.
    Also toggles the bottom tab navigation depending on whether
    the user is on a logged-in page.
  */
  function show(id) {
    sections.forEach((sec) => {
      const el = $("#" + sec);
      if (el) el.hidden = sec !== id;
    });

    // If on an authenticated screen, show tab navigation
    const isAppScreen = (id === "dashboard" || id === "transactions" || id === "transfer");
    tabNav.hidden = !isAppScreen;
  }


  /*
    Local storage session key
    Only used to simulate an authenticated state.
    A real system would use secure session cookies.
  */
  const sessionKey = "session_key";

  // Test if session is recognised
  function isAuthed() {
    return localStorage.getItem(sessionKey) === "1";
  }

  // Set/unset authentication state
  function setAuthed(value) {
    localStorage.setItem(sessionKey, value ? "1" : "0");
  }


  /*
    LOGIN HANDLING
    --------------------------------------------------------------------
    This does not perform real security checks.
    It simply validates non-empty fields and toggles UI state.
  */
  const loginForm = $("#loginForm");
  const loginStatus = $("#loginForm .form-status");
  const logoutBtn = $("#logoutBtn");

  /*
    Handles login attempts:
    1. Prevents page reload (default form behaviour)
    2. Validates Customer ID and Password are non-empty
    3. Sets localStorage as "authenticated"
    4. Shows dashboard
  */
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const cust = $("#cust").value.trim();
    const pass = $("#pass").value.trim();

    // Simple validation
    if (!cust || !pass) {
      loginStatus.textContent = "Customer ID and Password are required.";
      loginStatus.style.color = "#ffb4b4"; // Error styling
      return;
    }

    // Store mock "authenticated" state
    setAuthed(true);
    logoutBtn.hidden = false; // Show logout button

    loginStatus.textContent = "Logged in (demo only).";
    loginStatus.style.color = "#c6f6d5"; // Success styling

    show("dashboard");
  });


  /*
    LOGOUT HANDLING
    ----------------
    Removes authenticated state, hides tabs, returns to login screen.
  */
  logoutBtn.addEventListener("click", () => {
    setAuthed(false);
    logoutBtn.hidden = true;
    show("login");
    loginForm.reset();      // Clear previous input
    $("#cust").focus();     // Improve usability by focusing at first control
  });


  /*
    TAB NAVIGATION
    ----------------------------------------------------------------------
    Updates visual state of bottom navigation tabs and shows matching page.
    Each tab button uses data-tab="sectionName".
  */
  $$("#appTabs .tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      // Remove active class from all tabs
      $$("#appTabs .tab").forEach((b) => b.classList.remove("active"));

      // Highlight clicked tab
      btn.classList.add("active");

      // Show section corresponding to this tab
      show(btn.dataset.tab);
    });
  });


  /*
    STATIC MOCK TRANSACTIONS
    In a real system these would be retrieved from an API.
    Here they are embedded for demonstration only.
  */
  const transactions = [
    { date: "2025-10-30", desc: "Tap N Pay — Cafe", amt: -7.50,  bal: 2442.85 },
    { date: "2025-10-29", desc: "Salary — ACME Pty Ltd", amt: 2200.00, bal: 2450.35 },
    { date: "2025-10-28", desc: "Groceries", amt: -120.40, bal: 250.35 }
  ];

  const txBody = $("#txBody");


  /*
    renderTx()
    ----------
    Renders the static "transactions" array into <table> rows.
    Ensures formatting (e.g. minus sign for negative amounts).
  */
  function renderTx() {
    txBody.innerHTML = transactions
      .map((t) => {
        const formattedAmount =
          t.amt < 0
            ? `-$${Math.abs(t.amt).toFixed(2)}`
            : `$${t.amt.toFixed(2)}`;

        return `
          <tr>
            <td>${t.date}</td>
            <td>${t.desc}</td>
            <td>${formattedAmount}</td>
            <td>$${t.bal.toFixed(2)}</td>
          </tr>
        `;
      })
      .join("");
  }

  // Render transaction list immediately on script load
  renderTx();


  /*
    TRANSFER FORM
    ----------------------------------------------------------------------
    Validates:
    • BSB–Account number via regex
    • Positive transfer amount

    Does not actually send money; updates only onscreen status.
  */
  const transferForm = $("#transferForm");
  const transferStatus = $("#transferForm .form-status");

  transferForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const to = $("#to").value.trim();
    const amount = parseFloat($("#amount").value);

    /*
      BSB-Account number validation
      Expected format:
      062-000 12345678   (space optional)
      Regex checks 3 digits, 3 digits (with or without hyphen),
      then 6-9 account digits.
    */
    const pattern = /^\d{3}-?\d{3}\s*\d{6,9}$/;
    if (!pattern.test(to)) {
      transferStatus.textContent = "Enter a valid BSB–Account (e.g., 062-000 12345678).";
      transferStatus.style.color = "#ffb4b4";
      return;
    }

    // Ensure amount is positive
    if (!(amount > 0)) {
      transferStatus.textContent = "Amount must be greater than 0.";
      transferStatus.style.color = "#ffb4b4";
      return;
    }

    // Success indicator only; no backend instruction
    transferStatus.textContent = "Transfer submitted (demo only).";
    transferStatus.style.color = "#c6f6d5";
    transferForm.reset();
  });


  /*
    INITIAL ROUTING
    ----------------------------------------------------------------------
    If a session exists, user goes straight to dashboard.
    Otherwise, user is shown login screen.
  */
  if (isAuthed()) {
    logoutBtn.hidden = false;
    show("dashboard");
  } else {
    show("login");
  }

})();
