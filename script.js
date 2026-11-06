/**
 * TomeKeeper - Book List Application
 * Pure Vanilla JavaScript (No frameworks, no backend)
 */

(function () {
  'use strict';

  // Constants & Storage Keys
  const STORAGE_KEY = 'tomekeeper_book_list_data';
  const THEME_STORAGE_KEY = 'tomekeeper_theme_mode';

  // State
  let books = [];
  let editingBookId = null;
  let bookToDeleteId = null;
  let activeFilter = 'all'; // 'all' | 'finished' | 'wishlist' | 'reading' | 'bookmarked'

  // DOM Elements - Header & Theme
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const totalBookCountEl = document.getElementById('totalBookCount');

  // DOM Elements - Book Form
  const bookForm = document.getElementById('bookForm');
  const editBookIdInput = document.getElementById('editBookId');
  const bookNameInput = document.getElementById('bookName');
  const bookAuthorInput = document.getElementById('bookAuthor');
  const bookYearInput = document.getElementById('bookYear');
  const bookStatusSelect = document.getElementById('bookStatus');
  const bookRatingInput = document.getElementById('bookRating');
  const starPicker = document.getElementById('starPicker');
  const bookBookmarkInput = document.getElementById('bookBookmark');

  const submitBtn = document.getElementById('submitBtn');
  const submitBtnText = document.getElementById('submitBtnText');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const formTitle = document.getElementById('formTitle');
  const formBadge = document.getElementById('formBadge');

  const nameError = document.getElementById('nameError');
  const authorError = document.getElementById('authorError');
  const yearError = document.getElementById('yearError');

  // DOM Elements - Filters & Search
  const filterTabsContainer = document.querySelector('.filter-tabs');
  const countAllEl = document.getElementById('countAll');
  const countFinishedEl = document.getElementById('countFinished');
  const countWishlistEl = document.getElementById('countWishlist');
  const countReadingEl = document.getElementById('countReading');
  const countBookmarkedEl = document.getElementById('countBookmarked');

  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const searchFeedback = document.getElementById('searchFeedback');

  // DOM Elements - Book List & Empty State
  const bookListEl = document.getElementById('bookList');
  const emptyStateEl = document.getElementById('emptyState');

  // DOM Elements - Delete Confirmation Dialog
  const deleteDialog = document.getElementById('deleteConfirmDialog');
  const dialogMessage = document.getElementById('dialogMessage');
  const dialogConfirmBtn = document.getElementById('dialogConfirmBtn');
  const dialogCancelBtn = document.getElementById('dialogCancelBtn');

  // DOM Elements - Surprise Me Dialog
  const surpriseMeBtn = document.getElementById('surpriseMeBtn');
  const surpriseDialog = document.getElementById('surpriseDialog');
  const surpriseBookDetails = document.getElementById('surpriseBookDetails');
  const surpriseRerollBtn = document.getElementById('surpriseRerollBtn');
  const surpriseCloseBtn = document.getElementById('surpriseCloseBtn');

  // DOM Elements - Backup / Restore
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFileInput = document.getElementById('importFileInput');

  // Nerdy Quotes for empty state
  const nerdyQuotes = [
    '"A reader lives a thousand lives before he dies." — George R.R. Martin',
    '"There is no friend as loyal as a book." — Ernest Hemingway',
    '"I find television very educating. Every time somebody turns on the set, I go into the other room and read a book." — Groucho Marx',
    '"Fairy tales are more than true: not because they tell us dragons exist, but because they tell us dragons can be beaten." — Neil Gaiman',
    '"Words are, in my not-so-humble opinion, our most inexhaustible source of magic." — Albus Dumbledore',
    '"So many books, so little time." — Frank Zappa'
  ];

  /* --------------------------------------------------------------------------
     Theme Management (Dark / Light)
     -------------------------------------------------------------------------- */
  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'light';
    applyTheme(savedTheme);
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeIcon.textContent = '☀️';
      themeToggleBtn.title = 'Switch to Light Mode';
    } else {
      document.documentElement.removeAttribute('data-theme');
      themeIcon.textContent = '🌙';
      themeToggleBtn.title = 'Switch to Dark Mode';
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  themeToggleBtn.addEventListener('click', function () {
    const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
  });

  /* --------------------------------------------------------------------------
     Data Persistence (localStorage)
     -------------------------------------------------------------------------- */
  function loadBooks() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          // Normalize existing books to include new fields gracefully
          books = parsed.map(b => ({
            id: b.id || 'book_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: b.name || '',
            author: b.author || '',
            year: Number(b.year) || 0,
            status: b.status || '', // '' | 'want-to-read' | 'reading' | 'finished'
            rating: Number(b.rating) || 0, // 0 - 5
            bookmarked: Boolean(b.bookmarked)
          }));
        }
      }
    } catch (e) {
      console.error('Failed to load books from localStorage:', e);
      books = [];
    }
  }

  function saveBooks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    } catch (e) {
      console.error('Failed to save books to localStorage:', e);
      alert('Local storage quota exceeded or unavailable. Changes could not be saved.');
    }
  }

  /* --------------------------------------------------------------------------
     Alphabetical Sorting
     -------------------------------------------------------------------------- */
  function getSortedBooks(list) {
    return [...list].sort((a, b) => {
      return a.name.localeCompare(b.name, undefined, {
        sensitivity: 'base',
        numeric: true
      });
    });
  }

  /* --------------------------------------------------------------------------
     Filter Counts & Stats
     -------------------------------------------------------------------------- */
  function updateCounts() {
    totalBookCountEl.textContent = books.length;
    countAllEl.textContent = books.length;
    countFinishedEl.textContent = books.filter(b => b.status === 'finished').length;
    countWishlistEl.textContent = books.filter(b => b.status === 'want-to-read').length;
    countReadingEl.textContent = books.filter(b => b.status === 'reading').length;
    countBookmarkedEl.textContent = books.filter(b => b.bookmarked).length;
  }

  /* --------------------------------------------------------------------------
     Star Rating Picker (Form)
     -------------------------------------------------------------------------- */
  function setStarPickerRating(rating) {
    bookRatingInput.value = rating;
    const starButtons = starPicker.querySelectorAll('.star-btn');
    starButtons.forEach(btn => {
      const val = parseInt(btn.dataset.value, 10);
      if (val <= rating) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  starPicker.addEventListener('click', function (e) {
    const starBtn = e.target.closest('.star-btn');
    if (!starBtn) return;
    const clickedValue = parseInt(starBtn.dataset.value, 10);
    const currentValue = parseInt(bookRatingInput.value, 10) || 0;

    // Toggle off if clicking the active star
    const newValue = clickedValue === currentValue ? 0 : clickedValue;
    setStarPickerRating(newValue);
  });

  starPicker.addEventListener('mouseover', function (e) {
    const starBtn = e.target.closest('.star-btn');
    if (!starBtn) return;
    const hoverValue = parseInt(starBtn.dataset.value, 10);
    starPicker.querySelectorAll('.star-btn').forEach(btn => {
      const val = parseInt(btn.dataset.value, 10);
      if (val <= hoverValue) {
        btn.classList.add('hover');
      } else {
        btn.classList.remove('hover');
      }
    });
  });

  starPicker.addEventListener('mouseleave', function () {
    starPicker.querySelectorAll('.star-btn').forEach(btn => {
      btn.classList.remove('hover');
    });
  });

  /* --------------------------------------------------------------------------
     Render UI
     -------------------------------------------------------------------------- */
  function render() {
    updateCounts();

    const searchTerm = (searchInput.value || '').trim().toLowerCase();
    
    // Toggle search clear button
    if (searchTerm) {
      clearSearchBtn.classList.remove('hidden');
    } else {
      clearSearchBtn.classList.add('hidden');
    }

    // Sort all books alphabetically
    const sorted = getSortedBooks(books);

    // Apply Active Filter & Search Filter
    const filtered = sorted.filter(book => {
      // Status filter
      if (activeFilter === 'finished' && book.status !== 'finished') return false;
      if (activeFilter === 'wishlist' && book.status !== 'want-to-read') return false;
      if (activeFilter === 'reading' && book.status !== 'reading') return false;
      if (activeFilter === 'bookmarked' && !book.bookmarked) return false;

      // Search query
      if (!searchTerm) return true;
      const nameMatch = book.name.toLowerCase().includes(searchTerm);
      const authorMatch = book.author.toLowerCase().includes(searchTerm);
      const yearMatch = book.year.toString().includes(searchTerm);
      return nameMatch || authorMatch || yearMatch;
    });

    // Search / Filter feedback
    if (searchTerm || activeFilter !== 'all') {
      searchFeedback.textContent = `Showing ${filtered.length} of ${books.length}`;
    } else {
      searchFeedback.textContent = '';
    }

    // Handle Empty States
    if (books.length === 0) {
      bookListEl.innerHTML = '';
      emptyStateEl.classList.remove('hidden');

      const randomQuote = nerdyQuotes[Math.floor(Math.random() * nerdyQuotes.length)];

      emptyStateEl.innerHTML = `
        <div class="empty-state-art" aria-hidden="true">🧙‍♂️✨</div>
        <h3 class="empty-state-title">Your Bookshelf is Completely Empty!</h3>
        <p class="empty-state-message">
          It is currently emptier than the Library of Alexandria after 48 BC! 
          Cast your summoning charm, use the form above, or load sample tomes to test.
        </p>
        <div class="empty-state-actions">
          <button type="button" id="loadSampleBooksBtn" class="btn btn-secondary">
            ✨ Load Sample Tomes
          </button>
        </div>
        <div class="empty-state-quote">${escapeHTML(randomQuote)}</div>
      `;
      return;
    }

    if (filtered.length === 0) {
      bookListEl.innerHTML = '';
      emptyStateEl.classList.remove('hidden');

      let emptyFilterTitle = 'No Tomes Found';
      let emptyFilterMsg = 'No books match your current search or filter criteria.';

      if (activeFilter === 'finished') {
        emptyFilterTitle = 'No Finished Books Yet!';
        emptyFilterMsg = 'You haven\'t marked any books as "Finished" yet. Time to dive into reading!';
      } else if (activeFilter === 'wishlist') {
        emptyFilterTitle = 'Wishlist is Empty!';
        emptyFilterMsg = 'No books are currently tagged as "Want to Read". Add some titles to your queue!';
      } else if (activeFilter === 'reading') {
        emptyFilterTitle = 'Not Currently Reading Anything!';
        emptyFilterMsg = 'Pick a book and set its status to "Currently Reading" to track your progress.';
      } else if (activeFilter === 'bookmarked') {
        emptyFilterTitle = 'No Bookmarked Books!';
        emptyFilterMsg = 'Click the 🔖 icon on any book card to bookmark your favorite tomes.';
      }

      emptyStateEl.innerHTML = `
        <div class="empty-state-art" aria-hidden="true">📜🔍</div>
        <h3 class="empty-state-title">${escapeHTML(emptyFilterTitle)}</h3>
        <p class="empty-state-message">${escapeHTML(emptyFilterMsg)}</p>
      `;
      return;
    }

    // Render List Items
    emptyStateEl.classList.add('hidden');
    bookListEl.innerHTML = '';

    const fragment = document.createDocumentFragment();

    filtered.forEach(book => {
      const li = document.createElement('li');
      li.className = 'book-card';
      if (editingBookId === book.id) {
        li.classList.add('is-editing');
      }
      if (book.bookmarked) {
        li.classList.add('is-bookmarked');
      }

      // Build Status Badge
      let statusBadgeHTML = '';
      if (book.status === 'want-to-read') {
        statusBadgeHTML = `<span class="status-badge want-to-read">📖 Wishlist</span>`;
      } else if (book.status === 'reading') {
        statusBadgeHTML = `<span class="status-badge reading">⏳ Reading</span>`;
      } else if (book.status === 'finished') {
        statusBadgeHTML = `<span class="status-badge finished">✅ Finished</span>`;
      }

      // Build Stars HTML
      let starsHTML = '';
      if (book.rating && book.rating > 0) {
        const starCount = Math.min(Math.max(book.rating, 1), 5);
        starsHTML = `<span class="book-stars" title="${starCount} out of 5 stars" aria-label="${starCount} stars">${'★'.repeat(starCount)}</span>`;
      }

      // Build Bookmark Badge
      let bookmarkBadgeHTML = '';
      if (book.bookmarked) {
        bookmarkBadgeHTML = `<span class="bookmark-tag-badge" title="Bookmarked">🔖 Saved</span>`;
      }

      li.innerHTML = `
        <div class="book-info">
          <div class="book-title-row">
            <span class="book-title">${escapeHTML(book.name)}</span>
            ${starsHTML}
          </div>
          <div class="book-meta">
            <span class="book-author">by ${escapeHTML(book.author)}</span>
            <span class="book-year-badge">${escapeHTML(String(book.year))}</span>
            ${statusBadgeHTML}
            ${bookmarkBadgeHTML}
          </div>
        </div>
        <div class="book-actions">
          <button 
            type="button" 
            class="action-btn bookmark-btn ${book.bookmarked ? 'active' : ''}" 
            data-id="${escapeHTML(book.id)}" 
            title="${book.bookmarked ? 'Remove Bookmark' : 'Add Bookmark'}" 
            aria-label="${book.bookmarked ? 'Remove Bookmark' : 'Add Bookmark'}"
          >
            ${book.bookmarked ? '🔖' : '📑'}
          </button>
          <button 
            type="button" 
            class="action-btn edit-btn" 
            data-id="${escapeHTML(book.id)}" 
            title="Edit &quot;${escapeHTML(book.name)}&quot;" 
            aria-label="Edit ${escapeHTML(book.name)}"
          >
            ✏️
          </button>
          <button 
            type="button" 
            class="action-btn delete-btn" 
            data-id="${escapeHTML(book.id)}" 
            title="Delete &quot;${escapeHTML(book.name)}&quot;" 
            aria-label="Delete ${escapeHTML(book.name)}"
          >
            🗑️
          </button>
        </div>
      `;

      fragment.appendChild(li);
    });

    bookListEl.appendChild(fragment);
  }

  /* --------------------------------------------------------------------------
     Security Helper
     -------------------------------------------------------------------------- */
  function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* --------------------------------------------------------------------------
     Form Handling (Validation, Add, Edit)
     -------------------------------------------------------------------------- */
  function clearErrors() {
    nameError.textContent = '';
    authorError.textContent = '';
    yearError.textContent = '';
    bookNameInput.classList.remove('input-error');
    bookAuthorInput.classList.remove('input-error');
    bookYearInput.classList.remove('input-error');
  }

  function validateForm(name, author, year) {
    clearErrors();
    let isValid = true;

    if (!name.trim()) {
      nameError.textContent = 'Please enter the book title.';
      bookNameInput.classList.add('input-error');
      isValid = false;
    }

    if (!author.trim()) {
      authorError.textContent = 'Please enter the author\'s name.';
      bookAuthorInput.classList.add('input-error');
      isValid = false;
    }

    if (!year.trim()) {
      yearError.textContent = 'Please enter the publication year.';
      bookYearInput.classList.add('input-error');
      isValid = false;
    } else {
      const yearNum = Number(year);
      if (!Number.isInteger(yearNum) || yearNum < -2500 || yearNum > 2100) {
        yearError.textContent = 'Enter a valid year (-2500 to 2100).';
        bookYearInput.classList.add('input-error');
        isValid = false;
      }
    }

    return isValid;
  }

  function resetFormToAddMode() {
    editingBookId = null;
    editBookIdInput.value = '';
    bookForm.reset();
    setStarPickerRating(0);
    clearErrors();

    formTitle.textContent = 'Add a New Book';
    submitBtnText.textContent = 'Add Book';
    formBadge.classList.add('hidden');
    cancelEditBtn.classList.add('hidden');
  }

  function setFormToEditMode(book) {
    editingBookId = book.id;
    editBookIdInput.value = book.id;
    bookNameInput.value = book.name;
    bookAuthorInput.value = book.author;
    bookYearInput.value = book.year;
    bookStatusSelect.value = book.status || '';
    setStarPickerRating(book.rating || 0);
    bookBookmarkInput.checked = Boolean(book.bookmarked);
    clearErrors();

    formTitle.textContent = 'Edit Book';
    submitBtnText.textContent = 'Update Book';
    formBadge.classList.remove('hidden');
    cancelEditBtn.classList.remove('hidden');

    bookForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    bookNameInput.focus();
    render();
  }

  bookForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = bookNameInput.value.trim();
    const author = bookAuthorInput.value.trim();
    const year = bookYearInput.value.trim();
    const status = bookStatusSelect.value;
    const rating = parseInt(bookRatingInput.value, 10) || 0;
    const bookmarked = bookBookmarkInput.checked;

    if (!validateForm(name, author, year)) {
      return;
    }

    const yearNumber = parseInt(year, 10);

    if (editingBookId) {
      // Update existing book
      const bookIndex = books.findIndex(b => b.id === editingBookId);
      if (bookIndex !== -1) {
        books[bookIndex] = {
          ...books[bookIndex],
          name: name,
          author: author,
          year: yearNumber,
          status: status,
          rating: rating,
          bookmarked: bookmarked
        };
        saveBooks();
      }
      resetFormToAddMode();
    } else {
      // Add new book
      const newBook = {
        id: 'book_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        name: name,
        author: author,
        year: yearNumber,
        status: status,
        rating: rating,
        bookmarked: bookmarked
      };
      books.push(newBook);
      saveBooks();
      bookForm.reset();
      setStarPickerRating(0);
      bookNameInput.focus();
    }

    render();
  });

  cancelEditBtn.addEventListener('click', function () {
    resetFormToAddMode();
    render();
  });

  /* --------------------------------------------------------------------------
     Book List Actions (Bookmark Toggle, Edit, Delete)
     -------------------------------------------------------------------------- */
  bookListEl.addEventListener('click', function (e) {
    const bookmarkBtn = e.target.closest('.bookmark-btn');
    const editBtn = e.target.closest('.edit-btn');
    const deleteBtn = e.target.closest('.delete-btn');

    if (bookmarkBtn) {
      const bookId = bookmarkBtn.dataset.id;
      const book = books.find(b => b.id === bookId);
      if (book) {
        book.bookmarked = !book.bookmarked;
        saveBooks();
        render();
      }
      return;
    }

    if (editBtn) {
      const bookId = editBtn.dataset.id;
      const book = books.find(b => b.id === bookId);
      if (book) {
        setFormToEditMode(book);
      }
      return;
    }

    if (deleteBtn) {
      const bookId = deleteBtn.dataset.id;
      const book = books.find(b => b.id === bookId);
      if (book) {
        promptDeleteConfirmation(book);
      }
      return;
    }
  });

  /* --------------------------------------------------------------------------
     Delete Confirmation Flow
     -------------------------------------------------------------------------- */
  function promptDeleteConfirmation(book) {
    bookToDeleteId = book.id;

    if (typeof deleteDialog.showModal === 'function') {
      dialogMessage.innerHTML = `Are you sure you want to permanently delete <strong>"${escapeHTML(book.name)}"</strong> by ${escapeHTML(book.author)}?`;
      deleteDialog.showModal();
    } else {
      const confirmed = window.confirm(`Are you sure you want to delete "${book.name}" by ${book.author}?`);
      if (confirmed) {
        executeDelete(book.id);
      }
    }
  }

  function executeDelete(bookId) {
    books = books.filter(b => b.id !== bookId);
    saveBooks();

    if (editingBookId === bookId) {
      resetFormToAddMode();
    }

    render();
  }

  dialogConfirmBtn.addEventListener('click', function () {
    if (bookToDeleteId) {
      executeDelete(bookToDeleteId);
      bookToDeleteId = null;
    }
    deleteDialog.close();
  });

  dialogCancelBtn.addEventListener('click', function () {
    bookToDeleteId = null;
    deleteDialog.close();
  });

  deleteDialog.addEventListener('click', function (e) {
    if (e.target === deleteDialog) {
      bookToDeleteId = null;
      deleteDialog.close();
    }
  });

  /* --------------------------------------------------------------------------
     Surprise Me / Random Picker
     -------------------------------------------------------------------------- */
  function pickRandomBook() {
    if (books.length === 0) {
      alert('Your bookshelf is currently empty! Add some books first.');
      return;
    }

    const randomIndex = Math.floor(Math.random() * books.length);
    const chosen = books[randomIndex];

    let statusText = 'No Status Tag';
    if (chosen.status === 'want-to-read') statusText = '📖 Wishlist';
    if (chosen.status === 'reading') statusText = '⏳ Currently Reading';
    if (chosen.status === 'finished') statusText = '✅ Finished';

    let starsText = chosen.rating > 0 ? '★'.repeat(chosen.rating) : 'No rating yet';

    surpriseBookDetails.innerHTML = `
      <div class="surprise-book-title">${escapeHTML(chosen.name)}</div>
      <div class="surprise-book-author">by ${escapeHTML(chosen.author)} (${escapeHTML(String(chosen.year))})</div>
      <div class="surprise-book-badges">
        <span class="book-year-badge">${escapeHTML(statusText)}</span>
        <span class="book-stars">${escapeHTML(starsText)}</span>
        ${chosen.bookmarked ? '<span class="bookmark-tag-badge">🔖 Bookmarked</span>' : ''}
      </div>
    `;

    if (typeof surpriseDialog.showModal === 'function') {
      surpriseDialog.showModal();
    } else {
      alert(`The Archive has chosen: "${chosen.name}" by ${chosen.author}!`);
    }
  }

  surpriseMeBtn.addEventListener('click', pickRandomBook);
  surpriseRerollBtn.addEventListener('click', pickRandomBook);
  surpriseCloseBtn.addEventListener('click', () => surpriseDialog.close());

  surpriseDialog.addEventListener('click', function (e) {
    if (e.target === surpriseDialog) {
      surpriseDialog.close();
    }
  });

  /* --------------------------------------------------------------------------
     Simple Filter Tabs (All, Finished, Wishlist, Currently Reading, Bookmarked)
     -------------------------------------------------------------------------- */
  filterTabsContainer.addEventListener('click', function (e) {
    const tabBtn = e.target.closest('.filter-tab');
    if (!tabBtn) return;

    filterTabsContainer.querySelectorAll('.filter-tab').forEach(tab => {
      tab.classList.remove('active');
      tab.setAttribute('aria-selected', 'false');
    });

    tabBtn.classList.add('active');
    tabBtn.setAttribute('aria-selected', 'true');
    activeFilter = tabBtn.dataset.filter;

    render();
  });

  /* --------------------------------------------------------------------------
     Search & Input Helpers
     -------------------------------------------------------------------------- */
  searchInput.addEventListener('input', function () {
    render();
  });

  clearSearchBtn.addEventListener('click', function () {
    searchInput.value = '';
    searchInput.focus();
    render();
  });

  bookNameInput.addEventListener('input', () => {
    if (nameError.textContent) {
      nameError.textContent = '';
      bookNameInput.classList.remove('input-error');
    }
  });

  bookAuthorInput.addEventListener('input', () => {
    if (authorError.textContent) {
      authorError.textContent = '';
      bookAuthorInput.classList.remove('input-error');
    }
  });

  bookYearInput.addEventListener('input', () => {
    if (yearError.textContent) {
      yearError.textContent = '';
      bookYearInput.classList.remove('input-error');
    }
  });

  /* --------------------------------------------------------------------------
     Sample Books Loader (Empty State)
     -------------------------------------------------------------------------- */
  emptyStateEl.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'loadSampleBooksBtn') {
      books = [
        { 
          id: 'sample_' + Date.now() + '_1', 
          name: 'The Hobbit', 
          author: 'J.R.R. Tolkien', 
          year: 1937, 
          status: 'finished', 
          rating: 5, 
          bookmarked: true 
        },
        { 
          id: 'sample_' + Date.now() + '_2', 
          name: 'Dune', 
          author: 'Frank Herbert', 
          year: 1965, 
          status: 'reading', 
          rating: 5, 
          bookmarked: true 
        },
        { 
          id: 'sample_' + Date.now() + '_3', 
          name: 'Neuromancer', 
          author: 'William Gibson', 
          year: 1984, 
          status: 'want-to-read', 
          rating: 4, 
          bookmarked: false 
        },
        { 
          id: 'sample_' + Date.now() + '_4', 
          name: "The Hitchhiker's Guide to the Galaxy", 
          author: 'Douglas Adams', 
          year: 1979, 
          status: 'finished', 
          rating: 5, 
          bookmarked: false 
        }
      ];
      saveBooks();
      render();
    }
  });

  /* --------------------------------------------------------------------------
     Backup / Restore (JSON Export & Import)
     -------------------------------------------------------------------------- */
  exportBtn.addEventListener('click', function () {
    if (books.length === 0) {
      alert('Your library is empty. Add some books before exporting!');
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(books, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'tomekeeper-library-backup.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  });

  importBtn.addEventListener('click', function () {
    importFileInput.value = '';
    importFileInput.click();
  });

  importFileInput.addEventListener('change', function (e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          // Normalize imported books
          const normalized = imported.map(b => ({
            id: b.id || 'book_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: b.name || 'Untitled',
            author: b.author || 'Unknown',
            year: Number(b.year) || 2000,
            status: b.status || '',
            rating: Number(b.rating) || 0,
            bookmarked: Boolean(b.bookmarked)
          }));
          books = normalized;
          saveBooks();
          render();
          alert(`Successfully imported ${normalized.length} books!`);
        } else {
          alert('Invalid format: file does not contain a list of books.');
        }
      } catch (err) {
        alert('Failed to parse the JSON file. Please ensure it is a valid backup.');
      }
    };
    reader.readAsText(file);
  });

  /* --------------------------------------------------------------------------
     Global Keyboard Shortcuts
     -------------------------------------------------------------------------- */
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (deleteDialog && deleteDialog.open) {
        bookToDeleteId = null;
        deleteDialog.close();
      } else if (surpriseDialog && surpriseDialog.open) {
        surpriseDialog.close();
      } else if (editingBookId) {
        resetFormToAddMode();
        render();
      }
    } else if (e.key === '/') {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag !== 'input' && activeTag !== 'select' && activeTag !== 'textarea') {
        e.preventDefault();
        searchInput.focus();
      }
    }
  });

  /* --------------------------------------------------------------------------
     App Initialization
     -------------------------------------------------------------------------- */
  function init() {
    initTheme();
    loadBooks();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
