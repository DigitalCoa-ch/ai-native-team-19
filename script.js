const CATEGORIES = [
  { id: "rent",      name: "Rent",      color: "#5b8def", defaultBudget: 800  },
  { id: "groceries", name: "Groceries", color: "#3ecf8e", defaultBudget: 300  },
  { id: "shopping",  name: "Shopping",  color: "#f06292", defaultBudget: 150  },
  { id: "insurance", name: "Insurance", color: "#9575cd", defaultBudget: 100  },
  { id: "utilities", name: "Utilities", color: "#ffb74d", defaultBudget: 100  },
  { id: "transport", name: "Transport", color: "#4dd0e1", defaultBudget: 80   },
  { id: "healthcare",name: "Healthcare",color: "#e57373", defaultBudget: 60   },
  { id: "other",     name: "Other",     color: "#90a4ae", defaultBudget: 60   },
];
const STORAGE_KEY = "budgetAdvisor_v1";
let state = { allowance: 0, budgets: {}, expenses: [], currentMonth: "" };

function getDefaultState() {
  const budgets = {};
  CATEGORIES.forEach(c => { budgets[c.id] = c.defaultBudget; });
  return { allowance: 0, budgets, expenses: [], currentMonth: currentMonthStr() };
}

function currentMonthStr() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== "object") return getDefaultState();
    const defaults = getDefaultState();
    return {
      allowance: saved.allowance || 0,
      budgets: Object.assign({}, defaults.budgets, saved.budgets || {}),
      expenses: Array.isArray(saved.expenses) ? saved.expenses : [],
      currentMonth: saved.currentMonth || currentMonthStr(),
    };
  } catch (e) {
    return getDefaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getMonthExpenses(month) {
  return state.expenses.filter(e => e.date && e.date.startsWith(month));
}

function getCategorySpent(categoryId, month) {
  return getMonthExpenses(month).reduce((sum, e) => e.category === categoryId ? sum + e.amount : sum, 0);
}

function getDaysInMonth(monthStr) {
  const [y, m] = monthStr.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

function getDayOfMonth() {
  return new Date().getDate();
}

function fmt(n) {
  return n.toFixed(2);
}

function daysLeftInMonth(monthStr) {
  const total = getDaysInMonth(monthStr);
  const today = getDayOfMonth();
  return Math.max(total - today + 1, 1);
}

function renderMonthSelect() {
  const sel = document.getElementById("monthSelect");
  sel.innerHTML = "";
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    const label = d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    const opt = document.createElement("option");
    opt.value = val;
    opt.textContent = label;
    if (val === state.currentMonth) opt.selected = true;
    sel.appendChild(opt);
  }
  sel.removeEventListener("change", onMonthChange);
  sel.addEventListener("change", onMonthChange);
}

function renderCategoryList() {
  const container = document.getElementById("categoryList");
  container.innerHTML = "";
  CATEGORIES.forEach(cat => {
    const spent = getCategorySpent(cat.id, state.currentMonth);
    const budget = state.budgets[cat.id] || cat.defaultBudget;
    const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
    const over = spent > budget;
    const near = !over && spent >= budget * 0.8;
    const barClass = over ? "over" : near ? "near" : "ok";

    const row = document.createElement("div");
    row.className = "category-row";
    row.innerHTML =
      '<div class="category-meta">' +
        '<div class="category-name"><span class="dot" style="background:' + cat.color + '"></span>' + cat.name + '</div>' +
        '<div class="category-amounts">' +
          '<span class="' + (over ? "over" : near ? "near" : "") + '">' + fmt(spent) + '</span> / ' + fmt(budget) +
        '</div>' +
      '</div>' +
      '<div class="progress-track">' +
        '<div class="progress-fill ' + barClass + '" style="width:' + fmt(pct) + '%"></div>' +
      '</div>' +
      '<input class="category-budget-input" type="number" min="0" step="0.01" ' +
        'value="' + fmt(budget) + '" data-cat="' + cat.id + '" placeholder="Budget" />';
    container.appendChild(row);
  });

  container.querySelectorAll(".category-budget-input").forEach(inp => {
    inp.addEventListener("change", e => {
      state.budgets[e.target.dataset.cat] = parseFloat(e.target.value) || 0;
      saveState();
      renderAll();
    });
  });
}

function renderExpenseList() {
  const container = document.getElementById("expenseList");
  const monthExpenses = getMonthExpenses(state.currentMonth)
    .sort((a, b) => b.date.localeCompare(a.date));

  container.innerHTML = "";
  if (monthExpenses.length === 0) {
    container.innerHTML = '<div class="empty-state">No expenses added yet</div>';
    return;
  }

  monthExpenses.forEach((exp, idx) => {
    const cat = CATEGORIES.find(c => c.id === exp.category) || { name: exp.category, color: "#90a4ae" };
    const item = document.createElement("div");
    item.className = "expense-item";
    item.innerHTML =
      '<div class="info">' +
        '<div class="cat"><span class="dot" style="background:' + cat.color + '"></span>' + cat.name + '</div>' +
        (exp.note ? '<div class="note">' + exp.note + '</div>' : "") +
        '<div class="date">' + exp.date + '</div>' +
      '</div>' +
      '<div class="amount">-' + fmt(exp.amount) + '</div>' +
      '<button class="delete-btn" data-idx="' + idx + '">Delete</button>';
    container.appendChild(item);
  });

  container.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      const idx = parseInt(e.target.dataset.idx);
      state.expenses.splice(idx, 1);
      saveState();
      renderAll();
    });
  });
}

function renderSummary() {
  const monthExpenses = getMonthExpenses(state.currentMonth);
  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const left = state.allowance - totalSpent;
  const days = daysLeftInMonth(state.currentMonth);
  const daily = left > 0 && days > 0 ? left / days : 0;
  const dailySub = days + " days left this month";
  const projected = state.allowance - totalSpent;

  document.getElementById("totalSpent").textContent = fmt(totalSpent);
  document.getElementById("spentSub").textContent = "Across all categories";

  const leftCard = document.getElementById("cardLeft");
  document.getElementById("moneyLeft").textContent = fmt(left);
  document.getElementById("leftSub").textContent = "Based on your allowance";
  leftCard.className = "summary-card" + (left < 0 ? " danger" : "");

  document.getElementById("dailySpend").textContent = fmt(daily);
  document.getElementById("dailySub").textContent = dailySub;
  const dailyCard = document.getElementById("cardDaily");
  dailyCard.className = "summary-card" + (daily < 0 ? " danger" : daily < 5 ? " warning" : " success");

  document.getElementById("projected").textContent = fmt(projected);
  document.getElementById("projectedSub").textContent = "Based on today's pace";
  const projCard = document.getElementById("cardProjected");
  projCard.className = "summary-card" + (projected < 0 ? " danger" : "");
}

function renderAdvice() {
  const container = document.getElementById("adviceContainer");
  container.innerHTML = "";
  const monthExpenses = getMonthExpenses(state.currentMonth);
  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const left = state.allowance - totalSpent;
  const days = daysLeftInMonth(state.currentMonth);
  const totalBudget = Object.values(state.budgets).reduce((s, v) => s + v, 0);
  const messages = [];

  if (state.allowance === 0) {
    messages.push({ type: "info", icon: "ℹ️", text: "Set your monthly allowance above to start tracking your spending." });
  } else {
    if (totalSpent > state.allowance) {
      messages.push({ type: "danger", icon: "🚨", text: "You've gone over your monthly allowance by " + fmt(totalSpent - state.allowance) + ". Try to hold off on non-essential spending." });
    }
    if (left > 0 && days > 0 && left / days < 5) {
      messages.push({ type: "warning", icon: "⚠️", text: "Only " + fmt(left) + " left with " + days + " days remaining. That's about " + fmt(left / days) + " per day — consider holding back a little." });
    }
    if (totalBudget > state.allowance) {
      messages.push({ type: "danger", icon: "📊", text: "Your planned budgets total " + fmt(totalBudget) + " which is more than your allowance of " + fmt(state.allowance) + ". You'll need to adjust some categories." });
    }
    CATEGORIES.forEach(cat => {
      const spent = getCategorySpent(cat.id, state.currentMonth);
      const budget = state.budgets[cat.id] || cat.defaultBudget;
      if (spent > budget) {
        messages.push({ type: "danger", icon: "🔴", text: cat.name + " is over budget: you've spent " + fmt(spent) + " out of " + fmt(budget) + "." });
      } else if (spent >= budget * 0.8) {
        messages.push({ type: "warning", icon: "🟡", text: cat.name + " is getting close to its limit: " + fmt(spent) + " of " + fmt(budget) + " used." });
      }
    });
    if (messages.length === 0 && totalSpent > 0) {
      messages.push({ type: "success", icon: "✅", text: "Looking good! You're on track with your spending this month." });
    }
  }

  messages.forEach(msg => {
    const card = document.createElement("div");
    card.className = "advice-card " + msg.type;
    card.innerHTML = '<span class="icon">' + msg.icon + '</span><span>' + msg.text + '</span>';
    container.appendChild(card);
  });
}

function renderAll() {
  renderMonthSelect();
  renderCategoryList();
  renderExpenseList();
  renderSummary();
  renderAdvice();
  document.getElementById("allowanceInput").value = state.allowance > 0 ? state.allowance : "";
}

function onMonthChange() {
  state.currentMonth = document.getElementById("monthSelect").value;
  saveState();
  renderAll();
}

function init() {
  state = loadState();
  document.getElementById("expenseDate").value = new Date().toISOString().split("T")[0];

  const catSel = document.getElementById("expenseCategory");
  CATEGORIES.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = cat.name;
    catSel.appendChild(opt);
  });

  document.getElementById("setAllowanceBtn").addEventListener("click", () => {
    const val = parseFloat(document.getElementById("allowanceInput").value);
    if (!isNaN(val) && val >= 0) {
      state.allowance = val;
      saveState();
      renderAll();
    }
  });

  document.getElementById("expenseForm").addEventListener("submit", e => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById("expenseAmount").value);
    const cat = document.getElementById("expenseCategory").value;
    const date = document.getElementById("expenseDate").value;
    const note = document.getElementById("expenseNote").value.trim();
    if (!amount || !cat || !date) return;
    state.expenses.push({ category: cat, amount, date, note });
    saveState();
    document.getElementById("expenseAmount").value = "";
    document.getElementById("expenseNote").value = "";
    document.getElementById("expenseDate").value = new Date().toISOString().split("T")[0];
    renderAll();
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    if (confirm("Clear all your data? This cannot be undone.")) {
      state = getDefaultState();
      saveState();
      renderAll();
    }
  });

  document.getElementById("exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "budget-data.json";
    a.click();
  });

  document.getElementById("importBtn").addEventListener("click", () => {
    document.getElementById("importFile").click();
  });

  document.getElementById("importFile").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const imported = JSON.parse(ev.target.result);
        state = { ...getDefaultState(), ...imported };
        saveState();
        renderAll();
        alert("Data imported successfully!");
      } catch (err) {
        alert("Could not read that file. Make sure it is a valid JSON backup.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  renderAll();
}

document.addEventListener("DOMContentLoaded", init);
</script>
</body>
</html>