/**
 * TomeKeeper - Book List Application
 * Pure Vanilla JavaScript (No frameworks, no backend)
 */

(function () {
  'use strict';

  // Constants & Storage Key
  const STORAGE_KEY = 'tomekeeper_book_list_data';

  // State
  let books = [];
  let editingBookId = null;
  let bookToDeleteId = null;

  // DOM Elements
  const bookForm = document.getElementById('bookForm');
  const editBookIdInput = document.getElementById('editBookId');
  const bookNameInput = document.getElementById('bookName');
  const bookAuthorInput = document.getElementById('bookAuthor');
  const bookYearInput = document.getElementById('bookYear');
  const submitBtn = document.getElementById('submitBtn');
  const submitBtnText = document.getElementById('submitBtnText');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const formTitle = document.getElementById('formTitle');
  const formBadge = document.getElementById('formBadge');

  const nameError = document.getElementById('nameError');
  const authorError = document.getElementById('authorError');
  const yearError = document.getElementById('yearError');

  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const searchFeedback = document.getElementById('searchFeedback');

  const totalBookCountEl = document.getElementById('totalBookCount');
  const bookListEl = document.getElementById('bookList');
  const emptyStateEl = document.getElementById('emptyState');

  // Confirmation Modal Elements
  const deleteDialog = document.getElementById('deleteConfirmDialog');
  const dialogMessage = document.getElementById('dialogMessage');
  const dialogConfirmBtn = document.getElementById('dialogConfirmBtn');
  const dialogCancelBtn = document.getElementById('dialogCancelBtn');

  // Nerdy Quotes for empty state
  const nerdyQuotes = [
    '"A reader lives a thousand lives before he dies." — George R.R. Martin',
    '"There is no friend as loyal as a book." — Ernest Hemingway',
    '"I find television very educating. Every time somebody turns on the set, I go into the other room and read a book." — Groucho Marx',
    '"Fairy tales are more than true: not because they tell us dragons exist, but because they tell us dragons can be beaten." — Neil Gaiman',
    '"Words are, in my not-so-humble opinion, our most inexhaustible source of magic." — Albus Dumbledore',
    '"So many books, so little time." — Frank Zappa'
  ];

  /**
   * Load books from localStorage
   */
  function loadBooks() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          books = parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load books from localStorage:', e);
      books = [];
    }
  }

  /**
   * Save books to localStorage
   */
  function saveBooks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    } catch (e) {
      console.error('Failed to save books to localStorage:', e);
      alert('Local storage quota exceeded or unavailable. Changes could not be saved.');
    }
  }

  /**
   * Return a list sorted strictly alphabetically by Book Name
   */
  function getSortedBooks(list) {
    return [...list].sort((a, b) => {
      return a.name.localeCompare(b.name, undefined, {
        sensitivity: 'base',
        numeric: true
      });
    });
  }

  /**
   * Update the total books counter at the top
   */
  function updateTotalCount() {
    totalBookCountEl.textContent = books.length;
  }

  /**
   * Render the book list and empty states
   */
  function render() {
    updateTotalCount();

    const searchTerm = (searchInput.value || '').trim().toLowerCase();
    
    // Toggle clear search button
    if (searchTerm) {
      clearSearchBtn.classList.remove('hidden');
    } else {
      clearSearchBtn.classList.add('hidden');
    }

    // Always sort all books alphabetically
    const sorted = getSortedBooks(books);

    // Filter if search is present
    const filtered = sorted.filter(book => {
      if (!searchTerm) return true;
      const nameMatch = book.name.toLowerCase().includes(searchTerm);
      const authorMatch = book.author.toLowerCase().includes(searchTerm);
      const yearMatch = book.year.toString().includes(searchTerm);
      return nameMatch || authorMatch || yearMatch;
    });

    // Update search feedback text
    if (searchTerm) {
      searchFeedback.textContent = `Showing ${filtered.length} of ${books.length}`;
    } else {
      searchFeedback.textContent = '';
    }

    // Handle Empty States
    if (books.length === 0) {
      // Entire library is empty -> Friendly, nerdy message
      bookListEl.innerHTML = '';
      emptyStateEl.classList.remove('hidden');

      const randomQuote = nerdyQuotes[Math.floor(Math.random() * nerdyQuotes.length)];

      emptyStateEl.innerHTML = `
        <div class="empty-state-art" aria-hidden="true">🧙‍♂️✨</div>
        <h3 class="empty-state-title">Your Bookshelf is Completely Empty!</h3>
        <p class="empty-state-message">
          It is currently emptier than the Library of Alexandria after 48 BC! 
          Don't let your literary quest end here—cast your summoning charm, 
          use the form above, or load sample tomes below.
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

    if (filtered.length === 0 && searchTerm) {
      // Search resulted in no matches -> Nerdy search empty state
      bookListEl.innerHTML = '';
      emptyStateEl.classList.remove('hidden');
      emptyStateEl.innerHTML = `
        <div class="empty-state-art" aria-hidden="true">📜🔍</div>
        <h3 class="empty-state-title">No Tomes Found in the Archives</h3>
        <p class="empty-state-message">
          Our scholars searched the stacks for "<strong>${escapeHTML(searchTerm)}</strong>", 
          but found no matching manuscripts. Try checking for typos or clear your search query.
        </p>
      `;
      return;
    }

    // List has items to show
    emptyStateEl.classList.add('hidden');
    bookListEl.innerHTML = '';

    const fragment = document.createDocumentFragment();

    filtered.forEach(book => {
      const li = document.createElement('li');
      li.className = 'book-card';
      if (editingBookId === book.id) {
        li.classList.add('is-editing');
      }

      li.innerHTML = `
        <div class="book-info">
          <span class="book-title">${escapeHTML(book.name)}</span>
          <div class="book-meta">
            <span class="book-author">by ${escapeHTML(book.author)}</span>
            <span class="book-year-badge">${escapeHTML(String(book.year))}</span>
          </div>
        </div>
        <div class="book-actions">
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

  /**
   * Escape HTML to prevent XSS injection
   */
  function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Reset form validation errors
   */
  function clearErrors() {
    nameError.textContent = '';
    authorError.textContent = '';
    yearError.textContent = '';
    bookNameInput.classList.remove('input-error');
    bookAuthorInput.classList.remove('input-error');
    bookYearInput.classList.remove('input-error');
  }

  /**
   * Validate form inputs
   */
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

  /**
   * Set form into Add Mode
   */
  function resetFormToAddMode() {
    editingBookId = null;
    editBookIdInput.value = '';
    bookForm.reset();
    clearErrors();

    formTitle.textContent = 'Add a New Book';
    submitBtnText.textContent = 'Add Book';
    formBadge.classList.add('hidden');
    cancelEditBtn.classList.add('hidden');
  }

  /**
   * Set form into Edit Mode with the given book's details
   */
  function setFormToEditMode(book) {
    editingBookId = book.id;
    editBookIdInput.value = book.id;
    bookNameInput.value = book.name;
    bookAuthorInput.value = book.author;
    bookYearInput.value = book.year;
    clearErrors();

    formTitle.textContent = 'Edit Book';
    submitBtnText.textContent = 'Update Book';
    formBadge.classList.remove('hidden');
    cancelEditBtn.classList.remove('hidden');

    // Scroll nicely to form on mobile devices
    bookForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    bookNameInput.focus();
    render();
  }

  /**
   * Form submission handler (Handles both Add & Edit)
   */
  bookForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = bookNameInput.value.trim();
    const author = bookAuthorInput.value.trim();
    const year = bookYearInput.value.trim();

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
          year: yearNumber
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
        year: yearNumber
      };
      books.push(newBook);
      saveBooks();
      bookForm.reset();
      bookNameInput.focus();
    }

    render();
  });

  /**
   * Cancel Edit button handler
   */
  cancelEditBtn.addEventListener('click', function () {
    resetFormToAddMode();
    render();
  });

  /**
   * Handle Edit & Delete clicks inside the Book List
   */
  bookListEl.addEventListener('click', function (e) {
    const editBtn = e.target.closest('.edit-btn');
    const deleteBtn = e.target.closest('.delete-btn');

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

  /**
   * Delete confirmation flow (Uses HTML5 dialog with window.confirm fallback)
   */
  function promptDeleteConfirmation(book) {
    bookToDeleteId = book.id;

    if (typeof deleteDialog.showModal === 'function') {
      dialogMessage.innerHTML = `Are you sure you want to permanently delete <strong>"${escapeHTML(book.name)}"</strong> by ${escapeHTML(book.author)}?`;
      deleteDialog.showModal();
    } else {
      // Fallback to native window.confirm if dialog is not supported
      const confirmed = window.confirm(`Are you sure you want to delete "${book.name}" by ${book.author}?`);
      if (confirmed) {
        executeDelete(book.id);
      }
    }
  }

  function executeDelete(bookId) {
    books = books.filter(b => b.id !== bookId);
    saveBooks();

    // If currently editing the deleted book, reset form
    if (editingBookId === bookId) {
      resetFormToAddMode();
    }

    render();
  }

  // Dialog actions
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

  // Close dialog if backdrop is clicked
  deleteDialog.addEventListener('click', function (e) {
    if (e.target === deleteDialog) {
      bookToDeleteId = null;
      deleteDialog.close();
    }
  });

  /**
   * Real-time search handler
   */
  searchInput.addEventListener('input', function () {
    render();
  });

  clearSearchBtn.addEventListener('click', function () {
    searchInput.value = '';
    searchInput.focus();
    render();
  });

  // Clear inputs validation on type
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

  // Empty state actions (e.g. Load Sample Tomes)
  emptyStateEl.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'loadSampleBooksBtn') {
      books = [
        { id: 'sample_' + Date.now() + '_1', name: 'The Hobbit', author: 'J.R.R. Tolkien', year: 1937 },
        { id: 'sample_' + Date.now() + '_2', name: 'Dune', author: 'Frank Herbert', year: 1965 },
        { id: 'sample_' + Date.now() + '_3', name: 'Neuromancer', author: 'William Gibson', year: 1984 },
        { id: 'sample_' + Date.now() + '_4', name: "The Hitchhiker's Guide to the Galaxy", author: 'Douglas Adams', year: 1979 }
      ];
      saveBooks();
      render();
    }
  });

  // Global Keyboard Shortcuts (Esc to cancel edit/dialog, / to focus search)
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (deleteDialog && deleteDialog.open) {
        bookToDeleteId = null;
        deleteDialog.close();
      } else if (editingBookId) {
        resetFormToAddMode();
        render();
      }
    } else if (e.key === '/') {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag !== 'input') {
        e.preventDefault();
        searchInput.focus();
      }
    }
  });

  /**
   * Initialize App
   */
  function init() {
    loadBooks();
    render();
  }

  // Start app on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

