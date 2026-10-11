// Select DOM elements
const textarea = document.getElementById('note-text');
const charCountDisplay = document.getElementById('char-count');
const wordCountDisplay = document.getElementById('word-count');
const clearBtn = document.getElementById('clear-btn');
const themeToggleBtn = document.getElementById('theme-toggle');

// Function to update character and word counts and apply threshold classes
function updateCounts() {
  const text = textarea.value;
  const charCount = text.length;
  
  // Calculate words: split by whitespace if text exists, otherwise 0
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

  // Update text content
  charCountDisplay.textContent = `${charCount} / 200 characters`;
  wordCountDisplay.textContent = `${words} words`;

  // Handle warning and over classes
  charCountDisplay.classList.remove('warning', 'over');
  if (charCount > 200) {
    charCountDisplay.classList.add('over');
  } else if (charCount > 180) {
    charCountDisplay.classList.add('warning');
  }
}

// Function to clear the note and storage draft
function clearNote() {
  textarea.value = '';
  localStorage.removeItem('noteDraft');
  updateCounts();
  textarea.focus();
}

// Event listener for real-time typing and draft saving
textarea.addEventListener('input', () => {
  updateCounts();
  localStorage.setItem('noteDraft', textarea.value);
});

// Event listener for the Clear button
clearBtn.addEventListener('click', clearNote);

// Event listener for the Escape key inside the textarea
textarea.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    clearNote();
  }
});

// Theme toggle functionality
function applyTheme(isDark) {
  if (isDark) {
    document.body.classList.add('dark');
    themeToggleBtn.textContent = 'Light mode';
  } else {
    document.body.classList.remove('dark');
    themeToggleBtn.textContent = 'Dark mode';
  }
}

themeToggleBtn.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark');
  applyTheme(isDark);
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// --- Page Load Initialization ---

// 1. Restore saved text draft if it exists
const savedDraft = localStorage.getItem('noteDraft');
if (savedDraft !== null) {
  textarea.value = savedDraft;
}

// 2. Restore saved theme choice if it exists
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  applyTheme(true);
} else {
  applyTheme(false);
}

// 3. Initial count update on load
updateCounts();