// Select DOM elements
const loadBtn = document.querySelector('#load-users');
const filterInput = document.querySelector('#filter-input');
const statusP = document.querySelector('#status');
const usersList = document.querySelector('#users-list');

// Array to store loaded users
let allUsers = [];

// Async function to fetch users with error handling and loading states
async function loadUsers() {
  // Disable button and update status while loading
  loadBtn.disabled = true;
  statusP.textContent = 'Loading users...';
  usersList.innerHTML = '';

  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/users');
    
    // Check response.ok to catch HTTP error statuses like 404 or 500
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    allUsers = await response.json();
    statusP.textContent = `Successfully loaded ${allUsers.length} users.`;
    renderUsers(allUsers);
  } catch (error) {
    statusP.textContent = `Failed to load users: ${error.message}`;
  } finally {
    // Re-enable button when request completes
    loadBtn.disabled = false;
  }
}

// Render function using createElement and textContent (safe from XSS)
function renderUsers(usersToRender) {
  usersList.innerHTML = '';

  // Show fallback message if filter matches nothing
  if (usersToRender.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No users match your filter.';
    li.style.textAlign = 'center';
    li.style.color = '#4b5563';
    li.style.padding = '1rem';
    usersList.appendChild(li);
    return;
  }

  usersToRender.forEach(user => {
    const li = document.createElement('li');
    li.className = 'user-card';

    // User Name
    const nameH3 = document.createElement('h3');
    nameH3.textContent = user.name;

    // Email
    const emailP = document.createElement('p');
    emailP.textContent = `Email: ${user.email}`;

    // City
    const cityP = document.createElement('p');
    cityP.textContent = `City: ${user.address.city}`;

    // Company Name
    const companyP = document.createElement('p');
    companyP.textContent = `Company: ${user.company.name}`;

    li.appendChild(nameH3);
    li.appendChild(emailP);
    li.appendChild(cityP);
    li.appendChild(companyP);

    usersList.appendChild(li);
  });
}

// Event listener for loading users from API
loadBtn.addEventListener('click', loadUsers);

// Event listener for real-time local filtering (case-insensitive)
filterInput.addEventListener('input', () => {
  const searchTerm = filterInput.value.toLowerCase().trim();
  const filtered = allUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm)
  );
  renderUsers(filtered);
});