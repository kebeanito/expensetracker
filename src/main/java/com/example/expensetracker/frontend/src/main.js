const API_URL = "http://localhost:8080/api/expenses";
const USERS_URL = "http://localhost:8080/api/users";

// Elements
const authScreen = document.getElementById("auth-screen");
const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const authBtn = document.getElementById("authBtn");
const switchBtn = document.getElementById("switchBtn");
const switchText = document.getElementById("switch-text");
const authError = document.getElementById("auth-error");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const appScreen = document.getElementById("app");
const usernameDisplay = document.getElementById("username-display");
const expenseForm = document.getElementById("expense-form");
const expenseList = document.getElementById("expense-list");
const logoutBtn = document.getElementById("logoutBtn");
const totalExpensesEl = document.getElementById("total-expenses");
const totalRecordsEl = document.getElementById("total-records");

let loggedInUser = null;
let editExpenseId = null;
let isLoginMode = true;

// --- Toggle Login / Signup ---
switchBtn.addEventListener("click", () => {
  isLoginMode = !isLoginMode;
  authTitle.textContent = isLoginMode ? "Login" : "Sign Up";
  authBtn.textContent = isLoginMode ? "Login" : "Sign Up";
  switchText.textContent = isLoginMode
    ? "Don't have an account?"
    : "Already have an account?";
  authError.textContent = "";
  emailInput.value = "";
  passwordInput.value = "";
  authBtn.className = isLoginMode
    ? "w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 transition"
    : "w-full bg-green-500 text-white p-3 rounded hover:bg-green-600 transition";
});

// --- Login / Signup Handler ---
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    authError.textContent = "Email and password are required.";
    return;
  }

  try {
    if (isLoginMode) {
      // Login
      const res = await fetch(`${USERS_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        authError.textContent = "Invalid email or password.";
        return;
      }
      loggedInUser = await res.json();
    } else {
      // Signup
      const username = prompt("Enter a username:")?.trim();
      if (!username) {
        authError.textContent = "Username is required.";
        return;
      }
      const res = await fetch(`${USERS_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
      });
      if (!res.ok) throw new Error("Email might already exist");
      loggedInUser = await res.json();
    }
    startApp();
  } catch (err) {
    console.error(err);
    authError.textContent = err.message || "Error during authentication.";
  }
});

// --- Start App ---
function startApp() {
  authScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");
  usernameDisplay.textContent = loggedInUser.username;
  expenseForm.querySelector("button").textContent = "Add Expense";
  totalExpensesEl.textContent = "₱0.00";
  totalRecordsEl.textContent = "0";
  updateExpenseButtonState();
  loadExpenses();
}

// --- Logout ---
logoutBtn.addEventListener("click", () => {
  loggedInUser = null;
  authScreen.classList.remove("hidden");
  appScreen.classList.add("hidden");
  expenseForm.reset();
  expenseList.innerHTML = "";
  totalExpensesEl.textContent = "₱0.00";
  totalRecordsEl.textContent = "0";
  updateExpenseButtonState();
});

// --- Validate Expense Form ---
function updateExpenseButtonState() {
  const category = document.getElementById("category").value.trim();
  const amount = document.getElementById("amount").value.trim();
  const description = document.getElementById("description").value.trim();
  const expenseDate = document.getElementById("expenseDate").value.trim();

  const btn = expenseForm.querySelector("button");
  const allFilled = category && amount && description && expenseDate;

  btn.disabled = !allFilled;
  btn.classList.toggle("bg-gray-400", !allFilled);
  btn.classList.toggle("cursor-not-allowed", !allFilled);
}

// Listen to input changes
["category", "amount", "description", "expenseDate"].forEach(id => {
  document.getElementById(id).addEventListener("input", updateExpenseButtonState);
});

// --- Load Expenses ---
async function loadExpenses() {
  if (!loggedInUser) return;
  try {
    const res = await fetch(`${API_URL}/user/${loggedInUser.id}`);
    const expenses = await res.json();
    expenseList.innerHTML = "";

    let totalAmount = 0;

    expenses.forEach(expense => {
      totalAmount += parseFloat(expense.amount);

      const div = document.createElement("div");
      div.className =
        "p-4 bg-white rounded-xl shadow hover:shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 transition";

      div.innerHTML = `
        <div class="mb-2 sm:mb-0">
          <p><strong>Category:</strong> ${expense.category}</p>
          <p><strong>Amount:</strong> ₱${expense.amount}</p>
          <p><strong>Description:</strong> ${expense.description}</p>
          <p><strong>Date:</strong> ${expense.expenseDate}</p>
        </div>
        <div class="flex space-x-2">
          <button class="edit-btn bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition">Edit</button>
          <button class="delete-btn bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition">Delete</button>
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
        expenseForm.querySelector("button").textContent = "Update Expense";
        updateExpenseButtonState();
      });
    });

    totalExpensesEl.textContent = `₱${totalAmount.toFixed(2)}`;
    totalRecordsEl.textContent = expenses.length;
  } catch (err) {
    console.error("Error loading expenses:", err);
  }
}

// --- Add / Update Expense ---
expenseForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!loggedInUser) return alert("Please login first");

  const expenseData = {
    category: document.getElementById("category").value.trim(),
    amount: parseFloat(document.getElementById("amount").value),
    description: document.getElementById("description").value.trim(),
    expenseDate: document.getElementById("expenseDate").value,
    user: { id: loggedInUser.id }
  };

  if (editExpenseId) {
    // Update
    await fetch(`${API_URL}/${editExpenseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expenseData)
    });
    editExpenseId = null;
    expenseForm.querySelector("button").textContent = "Add Expense";
  } else {
    // Add new
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expenseData)
    });
  }

  expenseForm.reset();
  updateExpenseButtonState();
  loadExpenses();
});

// --- Initialize button state ---
updateExpenseButtonState();
