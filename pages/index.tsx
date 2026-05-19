import type { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';

type Category = {
  id: string;
  name: string;
  icon: string;
  budget: number;
  spent: number;
};

type Expense = {
  id: string;
  category: string;
  amount: number;
  note: string;
  date: string;
};

const defaultCategories: Category[] = [
  { id: 'rent', name: 'Monthly Rent', icon: '🏠', budget: 0, spent: 0 },
  { id: 'groceries', name: 'Groceries & Shopping', icon: '🛒', budget: 0, spent: 0 },
  { id: 'insurance', name: 'Insurance', icon: '🛡️', budget: 0, spent: 0 },
  { id: 'utilities', name: 'Utilities', icon: '💡', budget: 0, spent: 0 },
  { id: 'transport', name: 'Transport', icon: '🚌', budget: 0, spent: 0 },
  { id: 'health', name: 'Health & Medical', icon: '🏥', budget: 0, spent: 0 },
  { id: 'subscriptions', name: 'Subscriptions', icon: '📱', budget: 0, spent: 0 },
  { id: 'other', name: 'Other', icon: '📦', budget: 0, spent: 0 },
];

const Home: NextPage = () => {
  const [allowance, setAllowance] = useState<number>(0);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ category: 'groceries', amount: '', note: '', date: '' });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [savedKey] = useState('wealth-health-agent-data');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(savedKey);
      if (raw) {
        const data = JSON.parse(raw);
        setAllowance(data.allowance || 0);
        setCategories(data.categories || defaultCategories);
        setExpenses(data.expenses || []);
      }
    } catch {}
  }, [savedKey]);

  useEffect(() => {
    try {
      localStorage.setItem(savedKey, JSON.stringify({ allowance, categories, expenses }));
    } catch {}
  }, [allowance, categories, expenses, savedKey]);

  const monthExpenses = expenses.filter(e => e.date?.startsWith(selectedMonth));
  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const moneyLeft = allowance - totalSpent;
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const daysLeft = daysInMonth - dayOfMonth;
  const safeDaily = daysLeft > 0 ? moneyLeft / daysLeft : 0;
  const projected = daysLeft > 0 ? (totalSpent / dayOfMonth) * daysInMonth : totalSpent;

  const updateCategoryBudget = (id: string, budget: number) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, budget } : c));
  };

  const setCategorySpent = (id: string) => {
    const spent = monthExpenses.filter(e => e.category === id).reduce((s, e) => s + e.amount, 0);
    setCategories(prev => prev.map(c => c.id === id ? { ...c, spent } : c));
  };

  useEffect(() => {
    categories.forEach(c => setCategorySpent(c.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthExpenses]);

  const addExpense = () => {
    if (!formData.amount || !formData.date) return;
    const exp: Expense = {
      id: Date.now().toString(),
      category: formData.category,
      amount: parseFloat(formData.amount),
      note: formData.note,
      date: formData.date,
    };
    setExpenses(prev => [...prev, exp]);
    setFormData({ category: 'groceries', amount: '', note: '', date: '' });
    setShowForm(false);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const clearAll = () => {
    if (!confirm('Clear all data? This cannot be undone.')) return;
    setAllowance(0);
    setCategories(defaultCategories);
    setExpenses([]);
    localStorage.removeItem(savedKey);
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ allowance, categories, expenses }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'budget-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.allowance !== undefined) setAllowance(data.allowance);
        if (data.categories) setCategories(data.categories);
        if (data.expenses) setExpenses(data.expenses);
      } catch {}
    };
    reader.readAsText(file);
  };

  const getAdvice = () => {
    const msgs = [];
    if (moneyLeft < 0) {
      msgs.push({ type: 'danger', icon: '🚨', text: `You are over budget by ${fmt(moneyLeft)}! Review your recent expenses and cut back on non-essential spending.` });
    } else if (moneyLeft < allowance * 0.15) {
      msgs.push({ type: 'warning', icon: '⚠️', text: `Only ${fmt(moneyLeft)} left this month. Tighten your spending to avoid going into deficit.` });
    } else {
      msgs.push({ type: 'success', icon: '✅', text: `You have ${fmt(moneyLeft)} left. On track — keep monitoring your categories.` });
    }
    if (safeDaily > 0) {
      msgs.push({ type: 'info', icon: '💰', text: `Safe to spend ${fmt(safeDaily)} per day for the next ${daysLeft} days.` });
    }
    const overCat = categories.filter(c => c.budget > 0 && c.spent > c.budget);
    if (overCat.length) {
      msgs.push({ type: 'danger', icon: '📊', text: `${overCat.map(c => `${c.name} (${fmt(c.spent)}/${fmt(c.budget)})`).join(', ')} exceeded their budget.` });
    }
    return msgs;
  };

  const fmt = (n: number) => `$${Math.abs(n).toFixed(2)}`;

  const getProgressColor = (spent: number, budget: number) => {
    if (!budget) return 'ok';
    const ratio = spent / budget;
    if (ratio >= 1) return 'over';
    if (ratio >= 0.8) return 'near';
    return 'ok';
  };

  const monthLabel = () => {
    const [y, m] = selectedMonth.split('-');
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const recentExpenses = [...monthExpenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);

  return (
    <>
      <Head>
        <title>Budget Allowance Advisor</title>
        <meta name="description" content="Track your monthly budget, expenses, and get AI-powered spending advice for rent, groceries, insurance, and more." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main style={styles.page}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.logo}>💼</div>
            <div>
              <h1 style={styles.title}>Budget Allowance Advisor</h1>
              <p style={styles.subtitle}>Track, plan, and optimize your monthly spending</p>
            </div>
          </div>
          <div style={styles.headerControls}>
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={styles.monthSelect}>
              {Array.from({ length: 12 }, (_, i) => {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                return <option key={v} value={v}>{d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</option>;
              })}
            </select>
            <button style={styles.iconBtn} onClick={exportData} title="Export data">📤</button>
            <label style={styles.iconBtn} title="Import data">📥
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && importData(e.target.files[0])} />
            </label>
          </div>
        </header>

        {/* Allowance Banner */}
        <div style={styles.allowanceBanner}>
          <label style={styles.allowanceLabel}>Monthly Allowance</label>
          <div style={styles.allowanceInputWrap}>
            <span style={styles.dollarSign}>$</span>
            <input
              type="number"
              value={allowance || ''}
              onChange={e => setAllowance(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              style={styles.allowanceInput}
              min="0"
              step="0.01"
            />
          </div>
          <span style={styles.allowanceHint}>Set your total monthly budget</span>
        </div>

        {/* Summary Cards */}
        <div style={styles.summaryGrid}>
          <div style={{...styles.summaryCard, ...(totalSpent > allowance ? styles.dangerCard : {})}}>
            <div style={styles.cardLabel}>Total Spent</div>
            <div style={{...styles.cardValue, color: totalSpent > allowance ? '#d94040' : '#1e2a38'}}>{fmt(totalSpent)}</div>
            <div style={styles.cardSub}>Across {categories.filter(c => c.spent > 0).length} categories</div>
          </div>
          <div style={{...styles.summaryCard, ...(moneyLeft < 0 ? styles.dangerCard : moneyLeft < allowance * 0.2 ? styles.warnCard : styles.successCard)}}>
            <div style={styles.cardLabel}>Left This Month</div>
            <div style={{...styles.cardValue, color: moneyLeft < 0 ? '#d94040' : moneyLeft < allowance * 0.2 ? '#e07b2a' : '#2e9e6b'}}>{fmt(moneyLeft)}</div>
            <div style={styles.cardSub}>of {fmt(allowance)} total</div>
          </div>
          <div style={{...styles.summaryCard, ...(safeDaily < 0 ? styles.dangerCard : {})}}>
            <div style={styles.cardLabel}>Safe to Spend Daily</div>
            <div style={{...styles.cardValue, color: safeDaily < 0 ? '#d94040' : '#3b6ea5'}}>{fmt(Math.abs(safeDaily))}</div>
            <div style={styles.cardSub}>{daysLeft} days left in {monthLabel()}</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.cardLabel}>Projected Month-End</div>
            <div style={{...styles.cardValue, color: projected > allowance ? '#d94040' : '#6b7d93'}}>{fmt(projected)}</div>
            <div style={styles.cardSub}>Based on current daily pace</div>
          </div>
        </div>

        {/* Advice */}
        <div style={styles.adviceContainer}>
          {getAdvice().map((advice, i) => (
            <div key={i} style={{...styles.adviceCard, ...styles[`advice_${advice.type}`]}}>
              <span style={styles.adviceIcon}>{advice.icon}</span>
              <span>{advice.text}</span>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div style={styles.mainGrid}>
          {/* Left Column */}
          <div>
            {/* Category Budgets */}
            <div style={styles.sectionCard}>
              <h2 style={styles.sectionTitle}>Category Budgets</h2>
              <div style={styles.categoryList}>
                {categories.map(cat => {
                  const ratio = cat.budget > 0 ? cat.spent / cat.budget : 0;
                  const color = getProgressColor(cat.spent, cat.budget);
                  return (
                    <div key={cat.id} style={styles.categoryRow}>
                      <div style={styles.categoryMeta}>
                        <span style={styles.catIcon}>{cat.icon}</span>
                        <span style={styles.catName}>{cat.name}</span>
                        <span style={styles.catBudgetWrap}>
                          <input
                            type="number"
                            value={cat.budget || ''}
                            onChange={e => updateCategoryBudget(cat.id, parseFloat(e.target.value) || 0)}
                            placeholder="Budget"
                            style={styles.budgetInput}
                            min="0"
                            step="0.01"
                          />
                        </span>
                      </div>
                      <div style={styles.progressTrack}>
                        <div style={{...styles.progressFill, ...styles[`fill_${color}`], width: `${Math.min(ratio * 100, 100)}%`}} />
                      </div>
                      <div style={styles.catAmounts}>
                        <span style={color === 'over' ? styles.overAmt : color === 'near' ? styles.nearAmt : styles.okAmt}>
                          {fmt(cat.spent)} / {fmt(cat.budget || 0)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add Expense */}
            <div style={styles.sectionCard}>
              <div style={styles.formHeader}>
                <h2 style={styles.sectionTitle}>Add Expense</h2>
                <button style={styles.addToggleBtn} onClick={() => setShowForm(v => !v)}>
                  {showForm ? 'Cancel' : '+ Add'}
                </button>
              </div>
              {showForm && (
                <div style={styles.expenseForm}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Category</label>
                    <select value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} style={styles.formSelect}>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Amount</label>
                    <input type="number" value={formData.amount} onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" style={styles.formInput} min="0" step="0.01" required />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Date</label>
                    <input type="date" value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} style={styles.formInput} required />
                  </div>
                  <div style={{...styles.formGroup, gridColumn: '1 / -1'}}>
                    <label style={styles.formLabel}>Note (optional)</label>
                    <input type="text" value={formData.note} onChange={e => setFormData(p => ({ ...p, note: e.target.value }))} placeholder="What was this for?" style={styles.formInput} />
                  </div>
                  <button type="button" style={styles.addBtn} onClick={addExpense}>Add Expense</button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div>
            <div style={styles.sectionCard}>
              <h2 style={styles.sectionTitle}>Recent Expenses — {monthLabel()}</h2>
              {recentExpenses.length === 0 ? (
                <div style={styles.emptyState}>No expenses recorded yet this month.</div>
              ) : (
                <div style={styles.expenseList}>
                  {recentExpenses.map(exp => {
                    const cat = categories.find(c => c.id === exp.category);
                    return (
                      <div key={exp.id} style={styles.expenseItem}>
                        <div style={styles.expInfo}>
                          <span style={styles.expCat}>{cat?.icon} {cat?.name}</span>
                          <span style={styles.expNote}>{exp.note || '—'}</span>
                          <span style={styles.expDate}>{new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div style={styles.expRight}>
                          <span style={styles.expAmount}>-{fmt(exp.amount)}</span>
                          <button style={styles.deleteBtn} onClick={() => deleteExpense(exp.id)} title="Delete">✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={styles.resetSection}>
                <button style={styles.resetBtn} onClick={clearAll}>Clear All Data</button>
              </div>
            </div>

            {/* Stock Tracker Widget */}
            <div style={styles.sectionCard}>
              <h2 style={styles.sectionTitle}>📈 Market Tracker</h2>
              <p style={styles.stocksSubtitle}>Live market data from Yahoo Finance</p>
              <iframe
                src="https://finance.yahoo.com/quote/%5EGSPC?p=%5EGSPC"
                style={{ border: 'none', width: '100%', height: '420px', borderRadius: '10px', background: '#f8fafc' }}
                scrolling="yes"
                title="Yahoo Finance Market Tracker"
              />
              <div style={styles.stocksDisclaimer}>Market data provided by Yahoo Finance. Investing involves risk.</div>
              <div style={styles.quickLinks}>
                <a href="https://finance.yahoo.com" target="_blank" rel="noopener noreferrer" style={styles.stockLink}>Yahoo Finance ↗</a>
                <a href="https://finance.yahoo.com/portfolios" target="_blank" rel="noopener noreferrer" style={styles.stockLink}>My Portfolio ↗</a>
                <a href="https://finance.yahoo.com/markets" target="_blank" rel="noopener noreferrer" style={styles.stockLink}>Markets ↗</a>
              </div>
            </div>
          </div>
        </div>

        <footer style={styles.footer}>
          <p>Budget Allowance Advisor — Team 19 — International Finance Track</p>
          <p>OpenClaw Workbench: <a href="https://ai-native-19.digitalcoa.ch" style={styles.footerLink}>ai-native-19.digitalcoa.ch</a></p>
        </footer>
      </main>
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', backgroundColor: '#f0f4f8', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#1e2a38', padding: '24px 16px 48px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '14px' },
  logo: { fontSize: '2.2rem' },
  title: { fontSize: '1.5rem', fontWeight: '800', color: '#1e2a38' },
  subtitle: { fontSize: '0.85rem', color: '#6b7d93', marginTop: '2px' },
  headerControls: { display: 'flex', gap: '8px', alignItems: 'center' },
  monthSelect: { padding: '8px 12px', border: '1.5px solid #d8e2ec', borderRadius: '10px', fontSize: '0.9rem', background: '#fff', color: '#1e2a38', cursor: 'pointer' },
  iconBtn: { padding: '8px 12px', background: '#fff', border: '1.5px solid #d8e2ec', borderRadius: '10px', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.15s' },
  allowanceBanner: { background: '#fff', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', boxShadow: '0 2px 8px rgba(30,42,56,0.08)', border: '1px solid #d8e2ec' },
  allowanceLabel: { fontWeight: '600', whiteSpace: 'nowrap', color: '#6b7d93', fontSize: '0.9rem' },
  allowanceInputWrap: { display: 'flex', alignItems: 'center', background: '#f0f4f8', borderRadius: '10px', border: '1.5px solid #d8e2ec', paddingLeft: '12px' },
  dollarSign: { fontSize: '1.1rem', fontWeight: '700', color: '#3b6ea5' },
  allowanceInput: { padding: '9px 12px', border: 'none', background: 'transparent', fontSize: '1.1rem', fontWeight: '700', color: '#1e2a38', width: '140px', outline: 'none' },
  allowanceHint: { fontSize: '0.8rem', color: '#6b7d93', marginLeft: 'auto' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' },
  summaryCard: { background: '#fff', borderRadius: '14px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(30,42,56,0.08)', border: '1px solid #d8e2ec' },
  dangerCard: { borderLeft: '4px solid #d94040' },
  warnCard: { borderLeft: '4px solid #e07b2a' },
  successCard: { borderLeft: '4px solid #2e9e6b' },
  cardLabel: { fontSize: '0.75rem', color: '#6b7d93', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', marginBottom: '6px' },
  cardValue: { fontSize: '1.6rem', fontWeight: '800' },
  cardSub: { fontSize: '0.78rem', color: '#6b7d93', marginTop: '4px' },
  adviceContainer: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' },
  adviceCard: { borderRadius: '12px', padding: '14px 18px', fontSize: '0.92rem', fontWeight: '500', display: 'flex', alignItems: 'flex-start', gap: '10px', borderLeft: '4px solid' },
  advice_danger: { background: '#fde8e8', borderColor: '#d94040', color: '#8b1a1a' },
  advice_warning: { background: '#fef3e2', borderColor: '#e07b2a', color: '#7a4a10' },
  advice_success: { background: '#e2f5ed', borderColor: '#2e9e6b', color: '#1a6040' },
  advice_info: { background: '#e8f0fb', borderColor: '#3b6ea5', color: '#1e3a6b' },
  adviceIcon: { fontSize: '1.2rem', flexShrink: '0' },
  mainGrid: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' },
  sectionCard: { background: '#fff', borderRadius: '14px', padding: '22px 24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(30,42,56,0.08)', border: '1px solid #d8e2ec' },
  sectionTitle: { fontSize: '1.05rem', fontWeight: '700', color: '#1e2a38', marginBottom: '16px', paddingBottom: '10px', borderBottom: '2px solid #f0f4f8' },
  categoryList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  categoryRow: { display: 'flex', flexDirection: 'column', gap: '6px' },
  categoryMeta: { display: 'flex', alignItems: 'center', gap: '10px' },
  catIcon: { fontSize: '1.1rem', flexShrink: '0', width: '28px', textAlign: 'center' },
  catName: { fontWeight: '600', fontSize: '0.9rem', flex: '1' },
  catBudgetWrap: { width: '110px', flexShrink: '0' },
  budgetInput: { width: '100%', padding: '6px 10px', border: '1.5px solid #d8e2ec', borderRadius: '8px', fontSize: '0.88rem', textAlign: 'right', background: '#f0f4f8', color: '#1e2a38', outline: 'none' },
  budgetInputFocus: { borderColor: '#3b6ea5' },
  progressTrack: { height: '7px', background: '#f0f4f8', borderRadius: '99px', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '99px', transition: 'width 0.4s ease', minWidth: '0' },
  fill_ok: { background: '#2e9e6b' },
  fill_near: { background: '#e07b2a' },
  fill_over: { background: '#d94040' },
  catAmounts: { display: 'flex', justifyContent: 'flex-end' },
  overAmt: { color: '#d94040', fontWeight: '700', fontSize: '0.82rem' },
  nearAmt: { color: '#e07b2a', fontWeight: '700', fontSize: '0.82rem' },
  okAmt: { color: '#6b7d93', fontWeight: '700', fontSize: '0.82rem' },
  formHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '10px', borderBottom: '2px solid #f0f4f8' },
  addToggleBtn: { padding: '7px 16px', background: '#3b6ea5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.88rem', fontWeight: '600', cursor: 'pointer', transition: 'opacity 0.15s' },
  expenseForm: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  formLabel: { fontSize: '0.78rem', fontWeight: '600', color: '#6b7d93', textTransform: 'uppercase', letterSpacing: '0.05em' },
  formSelect: { padding: '9px 12px', border: '1.5px solid #d8e2ec', borderRadius: '10px', fontSize: '0.9rem', background: '#f0f4f8', color: '#1e2a38', cursor: 'pointer' },
  formInput: { padding: '9px 12px', border: '1.5px solid #d8e2ec', borderRadius: '10px', fontSize: '0.9rem', background: '#f0f4f8', color: '#1e2a38', fontFamily: 'inherit' },
  addBtn: { gridColumn: '1 / -1', padding: '12px', background: '#3b6ea5', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer', transition: 'opacity 0.15s', marginTop: '4px' },
  expenseList: { display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '460px', overflowY: 'auto' },
  expenseItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: '#f8fafc', borderRadius: '10px', gap: '10px', border: '1px solid #d8e2ec' },
  expInfo: { display: 'flex', flexDirection: 'column', gap: '2px', flex: '1', minWidth: '0' },
  expCat: { fontWeight: '600', fontSize: '0.88rem' },
  expNote: { fontSize: '0.78rem', color: '#6b7d93', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' },
  expDate: { fontSize: '0.75rem', color: '#6b7d93' },
  expRight: { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: '0' },
  expAmount: { fontWeight: '700', fontSize: '0.95rem', color: '#d94040' },
  deleteBtn: { padding: '4px 8px', background: 'transparent', border: '1.5px solid #d8e2ec', borderRadius: '6px', color: '#6b7d93', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', transition: 'all 0.15s', flexShrink: '0' },
  emptyState: { textAlign: 'center', color: '#6b7d93', padding: '24px', fontSize: '0.9rem' },
  resetSection: { textAlign: 'center', marginTop: '14px' },
  resetBtn: { padding: '9px 20px', background: 'transparent', border: '1.5px solid #d8e2ec', borderRadius: '10px', color: '#6b7d93', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.15s' },
  footer: { textAlign: 'center', padding: '24px 16px', borderTop: '2px solid #d8e2ec', marginTop: '8px' },
  footerLink: { color: '#3b6ea5', textDecoration: 'none', fontWeight: '500' },
  stocksSubtitle: { fontSize: '0.8rem', color: '#6b7d93', marginBottom: '12px', marginTop: '-8px' },
  stocksDisclaimer: { fontSize: '0.72rem', color: '#6b7d93', textAlign: 'center', marginTop: '10px', fontStyle: 'italic' },
  quickLinks: { display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px', flexWrap: 'wrap' },
  stockLink: { padding: '7px 14px', background: '#e8f0fb', color: '#3b6ea5', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '600', textDecoration: 'none', transition: 'opacity 0.15s', border: '1px solid #d8e2ec' },
};

export default Home;
