// Starting notes array
let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

// 1. searchNotes: returns an array of notes matching word (ignoring case)
function searchNotes(word) {
  return notes.filter(note => 
    note.text.toLowerCase().includes(word.toLowerCase())
  );
}

// 2. longestNote: returns the note object with the most characters, or null if empty
function longestNote() {
  if (notes.length === 0) return null;
  let longest = notes[0];
  for (let i = 1; i < notes.length; i++) {
    if (notes[i].text.length > longest.text.length) {
      longest = notes[i];
    }
  }
  return longest;
}

// 3. countByCategory: returns an object counting notes per category
function countByCategory() {
  let counts = {};
  for (let note of notes) {
    counts[note.category] = (counts[note.category] || 0) + 1;
  }
  return counts;
}

// 4. getSummary: returns a sentence summary using countByCategory and dynamic pluralization
function getSummary() {
  let counts = countByCategory();
  let totalNotes = notes.length;
  let noteWord = totalNotes === 1 ? "note" : "notes";
  
  let categoryParts = [];
  for (let category in counts) {
    categoryParts.push(`${counts[category]} ${category}`);
  }
  
  return `${totalNotes} ${noteWord}: ${categoryParts.join(", ")}.`;
}

// 5. isDuplicate: returns true if a note with the same text already exists (ignoring case and extra spaces)
function isDuplicate(text) {
  let cleanText = text.trim().toLowerCase();
  return notes.some(note => note.text.trim().toLowerCase() === cleanText);
}

// 6. addNote: adds a note if valid (1-200 chars, unique category, not duplicate)
function addNote(text, category) {
  if (text.length < 1 || text.length > 200) {
    console.log("Error: Note length must be between 1 and 200 characters.");
    return false;
  }
  
  const validCategories = ["personal", "work", "study"];
  if (!validCategories.includes(category)) {
    console.log("Error: Invalid category. Must be personal, work, or study.");
    return false;
  }
  
  if (isDuplicate(text)) {
    console.log("Error: Duplicate note already exists.");
    return false;
  }
  
  let newId = notes.length > 0 ? notes[notes.length - 1].id + 1 : 1;
  notes.push({ id: newId, text, category });
  return true;
}

// --- Test Cases with Expected Outputs in Comments ---

// Test searchNotes
console.log(searchNotes("study")); 
// Expected: [{ id: 2, text: "Finish the Day 3 assignment", category: "study" }, { id: 4, text: "Revise JavaScript arrays", category: "study" }]

console.log(searchNotes("xyz")); 
// Expected: []

// Test longestNote
console.log(longestNote()); 
// Expected: { id: 3, text: "Email the project report to Grace", category: "work" }

// Test countByCategory
console.log(countByCategory()); 
// Expected: { personal: 2, study: 2, work: 1 }

// Test getSummary
console.log(getSummary()); 
// Expected: "5 notes: 2 personal, 2 study, 1 work."

// Test isDuplicate
console.log(isDuplicate("call mum")); 
// Expected: true

console.log(isDuplicate("Learn React")); 
// Expected: false

// Test addNote
console.log(addNote("Buy milk and bread", "personal")); 
// Expected: false (and logs duplicate error message)

console.log(addNote("Practice coding challenges", "study")); 
// Expected: true