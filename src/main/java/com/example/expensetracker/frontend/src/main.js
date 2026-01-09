const API_URL = "http://localhost:8080/api/expenses";
const USERS_URL = "http://localhost:8080/api/users";

const loginScreen = document.getElementById("login-screen");
const appScreen = document.getElementById("app");
const loginUserSelect = document.getElementById("loginUser");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const expenseForm = document.getElementById("expense-form");
const expenseList = document.getElementById("expense-list");

let loggedInUser = null;
let editExpenseId = null;

// Load users into login dropdown
async function loadUsers() {
  try {
    const res = await fetch(USERS_URL);
    const users = await res.json();
    loginUserSelect.innerHTML = "";
    users.forEach(user => {
      const option = document.createElement("option");
      option.value = user.id;
      option.textContent = user.username;
      loginUserSelect.appendChild(option);
    });
  } catch (err) {
    console.error("Error loading users:", err);
  }
}

// Handle login
loginBtn.addEventListener("click", () => {
  const userId = parseInt(loginUserSelect.value);
  const username = loginUserSelect.selectedOptions[0].text;
  loggedInUser = { id: userId, username: username };
  loginScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");
  loadExpenses();
});

// Handle logout
logoutBtn.addEventListener("click", () => {
  loggedInUser = null;
  loginScreen.classList.remove("hidden");
  appScreen.classList.add("hidden");
  expenseForm.reset();
  expenseList.innerHTML = "";
});

// Load expenses for logged-in user
async function loadExpenses() {
  if (!loggedInUser) return;

  try {
    const res = await fetch(`${API_URL}/user/${loggedInUser.id}`);
    const expenses = await res.json();

    expenseList.innerHTML = "";
    expenses.forEach(expense => {
      const div = document.createElement("div");
      div.className = "p-4 bg-white rounded shadow flex justify-between items-center";
      div.innerHTML = `
        <div>
          <p><strong>Category:</strong> ${expense.category}</p>
          <p><strong>Amount:</strong> $${expense.amount}</p>
          <p><strong>Description:</strong> ${expense.description}</p>
          <p><strong>Date:</strong> ${expense.expenseDate}</p>
        </div>
        <div>
          <button class="edit-btn bg-yellow-400 text-white px-2 py-1 rounded mr-2">Edit</button>
          <button class="delete-btn bg-red-500 text-white px-2 py-1 rounded">Delete</button>
        </div>
      `;
      expenseList.appendChild(div);

      // Delete
      div.querySelector(".delete-btn").addEventListener("click", async () => {
        await fetch(`${API_URL}/${expense.id}`, { method: "DELETE" });
        loadExpenses();
      });

      // Edit
      div.querySelector(".edit-btn").addEventListener("click", () => {
        document.getElementById("category").value = expense.category;
        document.getElementById("amount").value = expense.amount;
        document.getElementById("description").value = expense.description;
        document.getElementById("expenseDate").value = expense.expenseDate;
        editExpenseId = expense.id;
        expenseForm.querySelector("button").textContent = "Update";
      });
    });
  } catch (err) {
    console.error("Error loading expenses:", err);
  }
}

// Add or update expense
expenseForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!loggedInUser) return alert("Please login first");

  const expenseData = {
    category: document.getElementById("category").value,
    amount: parseFloat(document.getElementById("amount").value),
    description: document.getElementById("description").value,
    expenseDate: document.getElementById("expenseDate").value,
    user: { id: loggedInUser.id }
  };

  if (editExpenseId) {
    await fetch(`${API_URL}/${editExpenseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expenseData)
    });
    editExpenseId = null;
    expenseForm.querySelector("button").textContent = "Add";
  } else {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expenseData)
    });
  }

  expenseForm.reset();
  loadExpenses();
});

// Initial load
loadUsers();
