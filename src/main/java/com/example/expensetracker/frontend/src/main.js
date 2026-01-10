const API_URL = "http://localhost:8080/api/expenses";
const USERS_URL = "http://localhost:8080/api/users";

// Elements
const authScreen = document.getElementById("auth-screen");
const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const authBtn = document.getElementById("authBtn");
const switchBtn = document.getElementById("switchBtn");
const switchText = document.getElementById("switch-text");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const appScreen = document.getElementById("app");
const usernameDisplay = document.getElementById("username-display");
const expenseForm = document.getElementById("expense-form");
const expenseList = document.getElementById("expense-list");
const logoutBtn = document.getElementById("logoutBtn");
const totalExpensesEl = document.getElementById("total-expenses");
const totalRecordsEl = document.getElementById("total-records");
const exportCSVBtn = document.getElementById("exportCSV");
const exportPDFBtn = document.getElementById("exportPDF");

const categoryChartCtx = document.getElementById("categoryChart").getContext("2d");
const monthlyChartCtx = document.getElementById("monthlyChart").getContext("2d");

let loggedInUser = null;
let editExpenseId = null;
let isLoginMode = true;
let expensesData = [];
let categoryChart, monthlyChart;

// --- Toggle Login / Signup ---
switchBtn.addEventListener("click", () => {
  isLoginMode = !isLoginMode;
  authTitle.textContent = isLoginMode ? "Login" : "Sign Up";
  authBtn.textContent = isLoginMode ? "Login" : "Sign Up";
  switchText.textContent = isLoginMode ? "Don't have an account?" : "Already have an account?";
  emailInput.value = "";
  passwordInput.value = "";
});

// --- Login / Signup ---
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    Swal.fire('Error', 'Email and password are required.', 'error');
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
      if (!res.ok) throw new Error('Invalid email or password');
      loggedInUser = await res.json();
      Swal.fire('Welcome!', `Hello, ${loggedInUser.username}`, 'success');
      startApp();
    } else {
      // SweetAlert modal for username input
      const { value: username } = await Swal.fire({
        title: 'Enter your username',
        input: 'text',
        inputLabel: 'Username',
        inputPlaceholder: 'Enter username',
        showCancelButton: true,
        confirmButtonText: 'Submit',
        cancelButtonText: 'Cancel',
        inputValidator: (value) => {
          if (!value) return 'Username is required!';
        }
      });

      if (!username) return; // user cancelled

      // Signup request
      const res = await fetch(`${USERS_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
      });

      if (!res.ok) throw new Error("Email might already exist");
      loggedInUser = await res.json();

      await Swal.fire({
        icon: 'success',
        title: `Welcome, ${username}!`,
        text: 'Your account has been created.'
      });

      startApp();
    }
  } catch (err) {
    Swal.fire('Error', err.message, 'error');
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

// --- Expense Button Validation ---
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
["category","amount","description","expenseDate"].forEach(id =>
  document.getElementById(id).addEventListener("input", updateExpenseButtonState)
);

// --- Load Expenses ---
async function loadExpenses() {
  if (!loggedInUser) return;
  try {
    const res = await fetch(`${API_URL}/user/${loggedInUser.id}`);
    expensesData = await res.json();
    renderExpenses(expensesData);
    updateCharts(expensesData);
  } catch(err) { console.error(err); }
}

// --- Render Expenses ---
function renderExpenses(expenses){
  expenseList.innerHTML = "";
  let total = 0;
  expenses.forEach(exp=>{
    total += parseFloat(exp.amount);
    const div = document.createElement("div");
    div.className = "p-4 bg-white text-gray-900 rounded-xl shadow flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 transition";

    div.innerHTML = `
      <div class="mb-2 sm:mb-0">
        <p><strong>Category:</strong> ${exp.category}</p>
        <p><strong>Amount:</strong> ₱${exp.amount}</p>
        <p><strong>Description:</strong> ${exp.description}</p>
        <p><strong>Date:</strong> ${exp.expenseDate}</p>
      </div>
      <div class="flex space-x-2">
        <button class="edit-btn bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition">Edit</button>
        <button class="delete-btn bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition">Delete</button>
      </div>
    `;
    expenseList.appendChild(div);

    div.querySelector(".delete-btn").addEventListener("click", async ()=>{
      await fetch(`${API_URL}/${exp.id}`,{method:"DELETE"});
      loadExpenses();
    });

    div.querySelector(".edit-btn").addEventListener("click", ()=>{
      document.getElementById("category").value = exp.category;
      document.getElementById("amount").value = exp.amount;
      document.getElementById("description").value = exp.description;
      document.getElementById("expenseDate").value = exp.expenseDate;
      editExpenseId = exp.id;
      expenseForm.querySelector("button").textContent = "Update Expense";
      updateExpenseButtonState();
    });
  });

  totalExpensesEl.textContent = `₱${total.toFixed(2)}`;
  totalRecordsEl.textContent = expenses.length;
}

// --- Add / Update Expense ---
expenseForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  if(!loggedInUser){ Swal.fire('Error','Please login first','error'); return; }

  const data = {
    category: document.getElementById("category").value.trim(),
    amount: parseFloat(document.getElementById("amount").value),
    description: document.getElementById("description").value.trim(),
    expenseDate: document.getElementById("expenseDate").value,
    user: {id: loggedInUser.id}
  };

  if(editExpenseId){
    await fetch(`${API_URL}/${editExpenseId}`,{
      method:"PUT",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify(data)
    });
    editExpenseId=null;
    expenseForm.querySelector("button").textContent="Add Expense";
  } else {
    await fetch(API_URL,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(data)
    });
  }

  expenseForm.reset();
  updateExpenseButtonState();
  loadExpenses();
});

// --- Charts ---
function updateCharts(expenses) {
  const categoryTotals = {};
  const monthlyTotals = {};

  expenses.forEach(exp => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + parseFloat(exp.amount);
    const month = exp.expenseDate.slice(0, 7);
    monthlyTotals[month] = (monthlyTotals[month] || 0) + parseFloat(exp.amount);
  });

  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(categoryChartCtx, {
    type: "doughnut",
    data: {
      labels: Object.keys(categoryTotals),
      datasets: [{
        data: Object.values(categoryTotals),
        backgroundColor: ["#3b82f6","#f97316","#ef4444","#10b981","#8b5cf6","#facc15"],
        borderWidth: 1,
        borderColor: "#ffffff"
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } },
      cutout: "40%"
    }
  });

  if (monthlyChart) monthlyChart.destroy();
  monthlyChart = new Chart(monthlyChartCtx, {
    type: "line",
    data: {
      labels: Object.keys(monthlyTotals),
      datasets: [{
        label: "Total Expenses",
        data: Object.values(monthlyTotals),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.2)",
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: "#3b82f6"
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 500 } },
        x: { ticks: { autoSkip: false } }
      }
    }
  });
}

// --- Export CSV ---
exportCSVBtn.addEventListener("click", ()=>{
  if(!expensesData.length){ Swal.fire('Error','No data to export','error'); return; }
  const csv = ["Category,Amount,Description,Date"];
  expensesData.forEach(exp=>csv.push([exp.category,exp.amount,exp.description,exp.expenseDate].join(",")));
  const blob = new Blob([csv.join("\n")],{type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url; a.download="expenses.csv"; a.click();
});

// --- Export PDF ---
exportPDFBtn.addEventListener("click", ()=>{
  if(!expensesData.length){ Swal.fire('Error','No data to export','error'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("Expense Tracker Report",14,20);
  let y=30;
  expensesData.forEach(exp=>{
    doc.text(`${exp.expenseDate} | ${exp.category} | ₱${exp.amount} | ${exp.description}`,14,y);
    y+=10;
  });
  doc.save("expenses.pdf");
});

// --- Init ---
updateExpenseButtonState();
