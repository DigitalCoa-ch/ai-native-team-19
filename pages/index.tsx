import type { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

type Category = { id: string; name: string; icon: string; color: string; budget: number; spent: number; };
type Expense = { id: string; category: string; amount: number; note: string; date: string; };
type SavingsGoal = { id: string; name: string; target: number; current: number; icon: string; };
type Notification = { id: string; text: string; type: 'info' | 'warning' | 'success'; read: boolean; };
type AllowanceRequest = { id: string; amount: number; reason: string; status: 'pending' | 'approved' | 'denied'; date: string; };

type RiskLevel = 'conservative' | 'moderate' | 'aggressive';
type Demographics = { age: number; income: number; dependents: number; goal: string; occupation: string; };
type InvestProfile = { risk: RiskLevel; demo: Demographics; answered: boolean; };
type Tab = 'dashboard' | 'expenses' | 'budget' | 'analytics' | 'requests' | 'profile' | 'invest' | 'find' | 'ai';
type ChatMessage = { id: string; role: 'user' | 'agent'; text: string; time: string; };
type AIRecommendation = { id: string; category: 'goal' | 'spending' | 'invest'; title: string; body: string; options?: AIRecommendationOption[]; savings?: number; risk?: string; approved: boolean; createdAt: string; };
type AIRecommendationOption = { name: string; cost: string; pros: string[]; cons: string[]; fit: 'great' | 'good' | 'tight'; note?: string; };
type StockResearch = { symbol: string; name: string; price: string; change: string; summary: string; reasons: string[]; opportunities: string[]; risks: string[]; uncertainty: string; verdict: string; demoData: boolean; };

const defaultCategories: Category[] = [
  { id: 'rent', name: 'Monthly Rent', icon: '🏠', color: '#6366f1', budget: 0, spent: 0 },
  { id: 'groceries', name: 'Groceries', icon: '🛒', color: '#22c55e', budget: 0, spent: 0 },
  { id: 'insurance', name: 'Insurance', icon: '🛡️', color: '#8b5cf6', budget: 0, spent: 0 },
  { id: 'utilities', name: 'Utilities', icon: '💡', color: '#f59e0b', budget: 0, spent: 0 },
  { id: 'transport', name: 'Transport', icon: '🚌', color: '#06b6d4', budget: 0, spent: 0 },
  { id: 'health', name: 'Health', icon: '🏥', color: '#ec4899', budget: 0, spent: 0 },
  { id: 'subscriptions', name: 'Subscriptions', icon: '📱', color: '#a855f7', budget: 0, spent: 0 },
  { id: 'other', name: 'Other', icon: '📦', color: '#64748b', budget: 0, spent: 0 },
];
const SK = 'whealth-v2';
const fmt = (n: number) => '$' + Math.abs(n).toFixed(2);
const now = new Date();
const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
const daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
const dayOfMonth = now.getDate();
const daysLeft = Math.max(0, daysInMonth - dayOfMonth);
const randId = () => Math.random().toString(36).slice(2);

function useStorage<T>(key: string, def: T): [T, (v: T | ((p: T) => T)) => void] {
  const [val, setVal] = useState<T>(def);
  useEffect(() => { try { const r = localStorage.getItem(key); if (r) setVal(JSON.parse(r)); } catch {} }, [key]);
  const setStorageVal = (v: T | ((p: T) => T)) => {
    if (typeof v === 'function') {
      const fn = v as (p: T) => T;
      setVal(prev => { const next = fn(prev); try { localStorage.setItem(key, JSON.stringify(next)); } catch {} return next; });
    } else {
      setVal(v); try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
    }
  };
  return [val, setStorageVal];
}

const GlassCard: React.FC<{children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void}> = ({children, style, onClick}) => (
  <motion.div whileHover={onClick ? { scale: 1.01 } : undefined} transition={{ duration: 0.2 }}
    onClick={onClick} style={{ background: 'rgba(30,38,54,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '22px 24px', ...style }}>
    {children}
  </motion.div>
);

const ProgressBar: React.FC<{value: number; max: number; color: string; h?: number}> = ({value, max, color, h=8}) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{height: h+'px', background:'rgba(255,255,255,0.05)', borderRadius:'99px', overflow:'hidden'}}>
      <motion.div initial={{ width: 0 }} animate={{ width: pct+'%' }} transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{height:'100%', background: color, borderRadius:'99px'}} />
    </div>
  );
};

const TS = { background: '#1e2636', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 14px', fontSize: '0.82rem', color: '#f1f5f9' };
const TAS = { fill: '#64748b', fontSize: 11 };
const COLORS = ['#6366f1','#22c55e','#8b5cf6','#f59e0b','#06b6d4','#ec4899','#a855f7','#64748b'];
function getRiskLabel(r: RiskLevel): string { return r.charAt(0).toUpperCase() + r.slice(1); }
function getRiskEmoji(r: RiskLevel): string { return r === 'conservative' ? '🛡️' : r === 'moderate' ? '⚖️' : '🚀'; }
function getInvestAdvice(risk: RiskLevel, demo: Demographics) {
  if (!demo.age) { return {title:'Complete Assessment',desc:'Answer the quiz to get your strategy.',strategy:'',allocations:[] as {name:string,pct:number,color:string,risk:string}[],warnings:[] as string[]}; }
  if (risk === 'conservative') {
    return {title:'Conservative Portfolio',desc:'Capital preservation first.',strategy:'Prioritise bonds and money market funds. Keep 6 months expenses in cash.',allocations:[{name:'Bonds / Fixed Income',pct:60,color:'#22c55e',risk:'Low'},{name:'Blue-Chip Stocks',pct:25,color:'#6366f1',risk:'Low-Med'},{name:'Cash Reserve',pct:15,color:'#06b6d4',risk:'Very Low'}],warnings:['Diversify across asset classes.','Consider TIPS for inflation.']};
  }
  if (risk === 'moderate') {
    return {title:'Moderate Growth Portfolio',desc:'Balanced growth with managed risk.',strategy:'50/50 equities and bonds. Dividend aristocrats for stable income.',allocations:[{name:'Index Funds / ETFs',pct:45,color:'#6366f1',risk:'Medium'},{name:'Bonds / Fixed Income',pct:30,color:'#22c55e',risk:'Low'},{name:'REITs / Real Estate',pct:15,color:'#f59e0b',risk:'Medium'},{name:'Cash Reserve',pct:10,color:'#06b6d4',risk:'Very Low'}],warnings:['Rebalance semi-annually.','Dollar-cost average during volatility.']};
  }
  return {title:'Aggressive Growth Portfolio',desc:'High-growth for long-term investors.',strategy:'Maximise equity exposure. Long horizon means volatility averages out.',allocations:[{name:'Growth Stocks / Tech',pct:50,color:'#ec4899',risk:'High'},{name:'Emerging Markets',pct:20,color:'#f59e0b',risk:'High'},{name:'S&P 500 Index',pct:20,color:'#6366f1',risk:'Medium'},{name:'Crypto (<=5%)',pct:5,color:'#a855f7',risk:'Very High'},{name:'Cash',pct:5,color:'#06b6d4',risk:'Very Low'}],warnings:['Volatility is normal.','Never invest >5% speculatively.']};
}
function calcRiskScore(answers: Array<number | undefined>): number {
  let sum = 0; let cnt = 0;
  for (let i = 0; i < answers.length; i++) { const v = answers[i]; if (v !== undefined) { sum = sum + v; cnt = cnt + 1; } }
  return cnt > 0 ? sum / cnt : 1.5;
}
function getAgeInsight(age: number): string {
  if (age < 35) { return 'At your age you have a long compounding window. Prioritise equity growth funds -- even small monthly contributions compound dramatically over 30+ years.'; }
  if (age < 50) { return 'Peak earning years. Maximise tax-advantaged accounts and build passive income streams for the future.'; }
  return 'Shift toward income-generating assets. Focus on capital preservation while maintaining purchasing power.';
}
const RISK_QS: Array<{q: string; opts: Array<{label: string; val: number}>}> = [
  {q:'How do you react when your portfolio drops 20% in a week?',opts:[{label:'Sell everything',val:0},{label:'Hold steady',val:1},{label:'Buy more',val:2}]},
  {q:'What best describes your investing experience?',opts:[{label:'None',val:0},{label:'1-3 years',val:1},{label:'3+ years',val:2}]},
  {q:'Which fits you best?',opts:[{label:'Preserve capital only',val:0},{label:'Balanced growth & safety',val:1},{label:'Maximize returns',val:2}]},
  {q:'When will you need this money?',opts:[{label:'< 2 years',val:0},{label:'2-5 years',val:1},{label:'5+ years',val:2}]},
];

const Home: NextPage = () => {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [month, setMonth] = useState(thisMonth);
  const [allowance, setAllowance] = useStorage<number>(SK+'a', 0);
  const [categories, setCategories] = useStorage<Category[]>(SK+'c', defaultCategories);
  const [expenses, setExpenses] = useStorage<Expense[]>(SK+'e', []);
  const [goals, setGoals] = useStorage<SavingsGoal[]>(SK+'g', [
    { id: 'em', name: 'Emergency Fund', target: 5000, current: 1200, icon: '🛡️' },
    { id: 'vac', name: 'Vacation Fund', target: 2000, current: 450, icon: '✈️' },
    { id: 'dev', name: 'New Device', target: 1500, current: 380, icon: '💻' },
  ]);
  const [reqs, setReqs] = useStorage<AllowanceRequest[]>(SK+'r', []);
  const [notifs, setNotifs] = useStorage<Notification[]>(SK+'n', []);
  const [settings, setSettings] = useStorage(SK+'s', { name: 'Alex', darkMode: true });
  const [expenseForm, setExpenseForm] = useState({ category: 'groceries', amount: '', note: '', date: new Date().toISOString().slice(0,10) });
  const [requestForm, setRequestForm] = useState({ amount: '', reason: '' });
  const [notifOpen, setNotifOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'agent', text: '👋 Hi there! I\'m your Wealth Health assistant. How can I help you today?', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [showStock, setShowStock] = useState(false);
  const [profileName, setProfileName] = useState(settings.name);
  
  const [allowanceInput, setAllowanceInput] = useState('');
  const [invProfile, setInvProfile] = useStorage<InvestProfile>(SK+'inv', {risk:'moderate',demo:{age:0,income:0,dependents:0,goal:'',occupation:''},answered:false});
  const [riskAns, setRiskAns] = useState<Array<number | undefined>>([]);
  const [demoFrm, setDemoFrm] = useState({age:'',income:'',dependents:'',goal:'',occupation:''});
  const [findCat, setFindCat] = useState('Groceries');
  const [findBudget, setFindBudget] = useState(50);
  const [findResults, setFindResults] = useState<Array<{name:string;price:string;was:string;store:string;storeIcon:string;location:string;distance:string;color:string}>>([]);
  const [aiRecs, setAiRecs] = useStorage<AIRecommendation[]>(SK+'air', []);
  const [aiLoading, setAiLoading] = useState(false);
  const [goalAskOpen, setGoalAskOpen] = useState(false);
  const [goalAskText, setGoalAskText] = useState('');
  const [spendingAskOpen, setSpendingAskOpen] = useState(false);
  const [stockSearch, setStockSearch] = useState('');
  const [stockResults, setStockResults] = useState<StockResearch[]>([]);
  const [stockLoading, setStockLoading] = useState(false);

  const monthExps = expenses.filter(e => e.date?.startsWith(month));
  const totalSpent = monthExps.reduce((s,e) => s+e.amount, 0);
  const moneyLeft = allowance - totalSpent;
  const safeDaily = daysLeft > 0 ? Math.max(0, moneyLeft / daysLeft) : 0;
  const unRead = notifs.filter(n => !n.read).length;

  const getChatResponse = (userMsg: string): string => {
    const msg = userMsg.toLowerCase();
    if (msg.includes('budget') || msg.includes('allowance')) return 'Your current monthly allowance is ' + fmt(allowance) + '. You can update it anytime from the Dashboard tab! 💰';
    if (msg.includes('spent') || msg.includes('expense')) return 'You\'ve spent ' + fmt(totalSpent) + ' this month. Your balance left is ' + fmt(moneyLeft) + '. 📊';
    if (msg.includes('save') || msg.includes('goal')) return 'You have ' + goals.length + ' savings goals active! Check your Dashboard or Savings Goals section for progress. 🎯';
    if (msg.includes('invest') || msg.includes('portfolio')) return 'Check out the Invest tab for your personalised investment strategy based on your risk profile! 📈';
    if (msg.includes('category')) return 'You can set category budgets in the Budget tab. This helps track spending limits per category. 🎯';
    if (msg.includes('help')) return 'I can help with: setting budgets 💰, tracking expenses 📊, savings goals 🎯, investment advice 📈, and more! What would you like to know?';
    if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) return 'Hello! 👋 How can I assist you today?';
    if (msg.includes('thank')) return 'You\'re welcome! 😊 Is there anything else I can help you with?';
    return 'I\'m not sure I understand. Try asking about: budgets, expenses, savings goals, or investments! I\'m here to help! 💬';
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { id: randId(), role: 'user', text: chatInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages(prev => [...prev, userMsg]);
    const response = getChatResponse(chatInput);
    setTimeout(() => {
      setChatMessages(prev => [...prev, { id: randId(), role: 'agent', text: response, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }, 600);
    setChatInput('');
  };

  useEffect(() => {
    const newCats = categories.map(c => ({
      ...c,
      spent: monthExps.filter(e => e.category === c.id).reduce((s,e) => s+e.amount, 0)
    }));
    setCategories(newCats);
  }, [monthExps]);

  const addNotif = (text: string, type: Notification['type'] = 'info') => {
    setNotifs(prev => [{ id: randId(), text, type, read: false }, ...prev].slice(0,20));
  };

  const addExpense = () => {
    if (!expenseForm.amount) return;
    const amt = parseFloat(expenseForm.amount);
    if (isNaN(amt) || amt <= 0) return;
    const exp: Expense = { id: randId(), category: expenseForm.category, amount: amt, note: expenseForm.note, date: expenseForm.date };
    setExpenses(prev => [...prev, exp]);
    setExpenseForm({ category: 'groceries', amount: '', note: '', date: new Date().toISOString().slice(0,10) });
    addNotif(`+${fmt(amt)} to ${categories.find(c=>c.id===expenseForm.category)?.name}`, 'success');
  };

  const deleteExp = (id: string) => setExpenses(prev => prev.filter(e => e.id !== id));

  const approveReq = (id: string) => {
    const r = reqs.find(r => r.id === id);
    if (r) { setReqs(prev => prev.map(q => q.id === id ? {...q, status: 'approved'} : q)); setAllowance(a => a + r.amount); addNotif(`+${fmt(r.amount)} approved`, 'success'); }
  };

  const updateBudget = (id: string, val: string) => {
    const n = parseFloat(val) || 0;
    setCategories(prev => prev.map(c => c.id === id ? {...c, budget: n} : c));
  };

  const updateGoal = (id: string, val: string) => {
    const n = parseFloat(val) || 0;
    setGoals(prev => prev.map(g => g.id === id ? {...g, current: n} : g));
  };

  const submitRequest = () => {
    const amt = parseFloat(requestForm.amount);
    if (!amt) return;
    const req: AllowanceRequest = { id: randId(), amount: amt, reason: requestForm.reason, status: 'pending', date: new Date().toISOString().slice(0,10) };
    setReqs(prev => [...prev, req]);
    setRequestForm({ amount: '', reason: '' });
    addNotif(`Request for ${fmt(amt)} submitted`, 'info');
  };

  const setAllowanceFromInput = () => {
    const v = parseFloat(allowanceInput);
    if (!isNaN(v) && v > 0) { setAllowance(v); addNotif(`Allowance set to ${fmt(v)}`, 'success'); }
    setAllowanceInput('');
  };

  const pieData = categories.filter(c => c.spent > 0).map((c) => ({ name: c.name, value: c.spent }));
  const last6 = Array.from({length:6},(_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    const m = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const spent = expenses.filter(e => e.date?.startsWith(m)).reduce((s,e) => s+e.amount, 0);
    return { month: d.toLocaleDateString('en-US',{month:'short'}), spent };
  }).reverse();
  const budgetData = categories.filter(c => c.budget > 0).map(c => ({ name: c.name.split(' ')[0], Budget: c.budget, Spent: c.spent }));
  const recentExps = [...monthExps].sort((a,b) => b.date.localeCompare(a.date)).slice(0,20);
  const saveProfile = () => { setSettings((s: any) => ({ ...s, name: profileName })); addNotif('Profile saved', 'success'); };
  const pendingReqs = reqs.filter(r => r.status === 'pending');

  const genevaStores = [
    { name: 'Migros', icon: 'M', location: 'Rive', distance: '0.8km' },
    { name: 'Coop', icon: 'C', location: 'Jonction', distance: '1.1km' },
    { name: 'Manor', icon: 'X', location: 'Centre', distance: '1.5km' },
  ];

  const generateDeals = () => {
    const deals: Array<{name:string;price:string;was:string;store:string;storeIcon:string;location:string;distance:string;color:string}> = [];
    if (findCat === 'Groceries') {
      deals.push(
        { name: 'Organic Bananas 1kg', price: 'CHF 1.95', was: 'CHF 2.50', store: 'Migros', storeIcon: 'M', location: 'Rive', distance: '0.8km', color: '#e53e3e' },
        { name: 'Whole Milk 1L', price: 'CHF 1.45', was: 'CHF 1.80', store: 'Coop', storeIcon: 'C', location: 'Jonction', distance: '1.1km', color: '#2b6cb0' },
        { name: 'Sourdough Bread', price: 'CHF 2.90', was: 'CHF 3.80', store: 'Manor', storeIcon: 'X', location: 'Centre', distance: '1.5km', color: '#d69e2e' },
      );
    } else if (findCat === 'Transport') {
      deals.push(
        { name: 'Monthly TPG Pass', price: 'CHF 85.00', was: 'CHF 95.00', store: 'TPG', storeIcon: 'T', location: 'Cornavin', distance: '0.5km', color: '#3182ce' },
        { name: 'SBB Day Pass', price: 'CHF 52.00', was: 'CHF 73.00', store: 'SBB', storeIcon: 'S', location: 'Gare', distance: '0.9km', color: '#e53e3e' },
      );
    } else if (findCat === 'Utilities') {
      deals.push(
        { name: 'Geneva Electricity', price: 'CHF 0.18/kWh', was: 'CHF 0.22/kWh', store: 'SIG', storeIcon: 'E', location: 'Grottes', distance: '1.2km', color: '#d69e2e' },
        { name: 'Internet 1Gbps', price: 'CHF 49.90/mo', was: 'CHF 69.90/mo', store: 'Swisscom', storeIcon: 'W', location: 'Online', distance: 'N/A', color: '#e53e3e' },
      );
    } else {
      deals.push(
        { name: 'Budget Gym', price: 'CHF 49.00/mo', was: 'CHF 89.00/mo', store: 'Peak Club', storeIcon: 'G', location: 'Acacias', distance: '2.1km', color: '#e53e3e' },
        { name: 'Cinema Pass 8 films', price: 'CHF 99.00', was: 'CHF 140.00', store: 'Pathe', storeIcon: 'F', location: 'Praille', distance: '2.8km', color: '#2b6cb0' },
      );
    }
    return deals;
  };

  const generateGoalRec = () => {
    setAiLoading(true);
    setGoalAskOpen(false);
    setTimeout(() => {
      const goal = goalAskText.toLowerCase();
      let title = 'Goal Analysis: ' + goalAskText;
      let body = '';
      let savings = 0;
      if (goal.includes('bali') || goal.includes('vacation') || goal.includes('trip')) {
        body = 'Based on your current savings rate of CHF 450/month, a Trip to Bali (~CHF 3,000) is achievable in 7 months. Consider the 50/30/20 rule: allocate 20% (CHF ~200) to savings. Alternative: visit Swiss Alps for ~CHF 1,200 instead.';
        savings = 200;
      } else if (goal.includes('car') || goal.includes('vehicle')) {
        body = 'A reliable used car in Geneva typically costs CHF 8,000-15,000. With your current rate, this would take 18-33 months. We recommend increasing monthly savings to CHF 500+ or exploring car-sharing options (Mobility Carsharing) for CHF 150/month.';
        savings = 500;
      } else if (goal.includes('laptop') || goal.includes('pc') || goal.includes('computer')) {
        body = 'A solid work laptop (Lenovo ThinkPad or MacBook Air) costs CHF 1,000-1,500. At CHF 450/month savings rate, you could afford this in 3 months. Recommended: Buy refurbished from digitec.ch for ~CHF 800, saving CHF 200.';
        savings = 150;
      } else if (goal.includes('emergency') || goal.includes('fund')) {
        body = 'An emergency fund should cover 3-6 months of expenses. Based on your average monthly spend, we recommend building to CHF 12,000. At CHF 450/month, this will take ~27 months. Consider automating CHF 200/month to a separate savings account.';
        savings = 450;
      } else {
        body = 'This goal is achievable with proper planning. Geneva cost-of-living is high, but strategic savings can get you there. We recommend starting with CHF 300/month and increasing as your income grows.';
        savings = 300;
      }
      const rec: AIRecommendation = {
        id: randId(),
        category: 'goal',
        title,
        body,
        savings,
        approved: false,
        createdAt: new Date().toISOString(),
      };
      setAiRecs(prev => [rec, ...prev]);
      setAiLoading(false);
    }, 1200);
  };

  const generateSpendingRec = () => {
    setAiLoading(true);
    setSpendingAskOpen(false);
    setTimeout(() => {
      const catTotals = categories.map(c => ({ name: c.name, spent: c.spent, budget: c.budget, pct: c.budget > 0 ? (c.spent / c.budget) : 0 }));
      const overBudget = catTotals.filter(c => c.pct > 0.9);
      const topSpender = [...catTotals].sort((a, b) => b.spent - a.spent)[0];
      let title = 'Spending Analysis';
      let body = '';
      if (overBudget.length > 0) {
        const cats = overBudget.map(c => c.name).join(', ');
        body = 'You are over budget in: ' + cats + '. ' + topSpender.name + ' is your highest spending category at CHF ' + topSpender.spent.toFixed(2) + ' (' + (topSpender.pct * 100).toFixed(0) + '% of budget). Consider the Geneva challenge: cancel one subscription (save ~CHF 30/month) and reduce dining out by CHF 50/month.';
      } else {
        body = 'Your spending is well-managed. ' + topSpender.name + ' is your top expense at CHF ' + topSpender.spent.toFixed(2) + ". You're on track for this month. Keep monitoring and consider the 50/30/20 rule: 50% needs, 30% wants, 20% savings.";
      }
      const rec: AIRecommendation = {
        id: randId(),
        category: 'spending',
        title,
        body,
        approved: false,
        createdAt: new Date().toISOString(),
      };
      setAiRecs(prev => [rec, ...prev]);
      setAiLoading(false);
    }, 1200);
  };

  const researchStock = (symbol: string) => {
    setStockLoading(true);
    setTimeout(() => {
      const stocks: Record<string, StockResearch> = {
        AAPL: { symbol: 'AAPL', name: 'Apple Inc.', price: 'CHF 178.50', change: '+1.2%', summary: 'Apple designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.', reasons: ['Strong brand loyalty in Europe', 'Robust Services revenue growth', 'iPhone upgrade cycle in 2025'], opportunities: ['AI-enhanced iPhone 17 expected', 'Services subscription growth', 'India manufacturing shift'], risks: ['China market slowdown', 'Regulatory scrutiny in EU', 'High valuation (29x earnings)'], uncertainty: 'Competition from Huawei in China and Android flagship phones.', verdict: 'Strong hold for long-term Geneva investors. Buy on dips toward CHF 165.', demoData: true },
        GOOGL: { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 'CHF 141.80', change: '+0.8%', summary: 'Alphabet provides online advertising services, cloud solutions, and hardware. Google Search dominates European market.', reasons: ['Dominant search market share', 'YouTube ad revenue growth', 'Google Cloud profitability improving'], opportunities: ['Gemini AI integration across products', 'Cloud market share gains'], risks: ['EU Digital Markets Act enforcement', 'AI search disruption risk'], uncertainty: 'Regulatory breakup threats in EU.', verdict: 'Accumulate for long-term. Target CHF 160 in 18 months.', demoData: true },
        MSFT: { symbol: 'MSFT', name: 'Microsoft Corp.', price: 'CHF 415.50', change: '+1.5%', summary: 'Microsoft develops and licenses consumer and enterprise software, with leading positions in cloud computing (Azure) and productivity.', reasons: ['Azure 2 cloud globally', 'Copilot AI integration across suite', 'GitHub enterprise growth'], opportunities: ['AI Copilot monetization', 'Gaming acquisitions value'], risks: ['Antitrust scrutiny in EU', 'OpenAI capex burden'], uncertainty: 'AI ROI timeline and open-source shift could pressure licensing.', verdict: 'Quality hold. Fair value CHF 430, wait for pullback to CHF 380.', demoData: true },
        TSLA: { symbol: 'TSLA', name: 'Tesla Inc.', price: 'CHF 175.20', change: '-2.3%', summary: 'Tesla designs, develops, manufactures, and sells electric vehicles, and energy generation and storage systems.', reasons: ['EV market leader in premium segment', 'FSD (Full Self-Driving) progress', 'Energy storage Megapack demand'], opportunities: ['Affordable Tesla Model 2 expected', 'Robotaxi announcement potential'], risks: ['Elon Musk political involvement risk', 'Chinese EV competition (BYD)', 'Margin compression from price cuts'], uncertainty: 'Execution on autonomy promises remains uncertain.', verdict: 'Speculative position only. Max 5% of portfolio.', demoData: true },
      };
      const result = stocks[symbol.toUpperCase()];
      if (result) {
        setStockResults([result]);
      } else {
        setStockResults([{
          symbol: symbol.toUpperCase(),
          name: symbol.toUpperCase() + ' Corp.',
          price: 'CHF --',
          change: '--',
          summary: 'Live data for ' + symbol + ' requires a real market data API subscription. This is simulated research for educational purposes.',
          reasons: ['Simulated data - not financial advice'],
          opportunities: [],
          risks: ['Demo data only - verify with real quotes'],
          uncertainty: 'Always consult a licensed financial advisor before investing.',
          verdict: 'DISCLAIMER: This is simulated/student demo data. Not financial advice.',
          demoData: true,
        }]);
      }
      setStockLoading(false);
    }, 1000);
  };

  return (
    <>
      <Head>
        <title>Wealth Health Agent</title>
        <meta name="description" content="Premium budget allowance advisor" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ fontFamily: "'Inter', sans-serif", background: '#0f1117', minHeight: '100vh', color: '#f1f5f9' }}>

        {/* HEADER */}
        <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(15,17,23,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 20px' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{fontSize:'1.7rem'}}>💼</span>
              <div>
                <div style={{fontSize:'1.05rem', fontWeight:'800', letterSpacing:'-0.02em', color:'#f1f5f9'}}>Wealth Health</div>
                <div style={{fontSize:'0.65rem', color:'#475569'}}>Premium Finance Tracker</div>
              </div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap'}}>
              <select value={month} onChange={e=>setMonth(e.target.value)} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:'10px',padding:'7px 12px',color:'#f1f5f9',fontSize:'0.82rem',cursor:'pointer'}}>
                {Array.from({length:12},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-i,1);const v=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;return <option key={v} value={v}>{d.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</option>;})}
              </select>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setNotifOpen(v => !v)}
                style={{position:'relative',padding:'8px 12px',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:'12px',cursor:'pointer',fontSize:'1.1rem',color:'#f1f5f9'}}>
                🔔
                {unRead > 0 && <span style={{position:'absolute',top:'-5px',right:'-5px',background:'#ef4444',color:'#fff',borderRadius:'50%',width:'17px',height:'17px',fontSize:'0.6rem',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'700'}}>{unRead}</span>}
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowStock(v => !v)}
                style={{padding:'7px 14px',background:'rgba(99,102,241,0.18)',border:'1px solid rgba(99,102,241,0.35)',borderRadius:'12px',cursor:'pointer',fontSize:'0.8rem',fontWeight:'600',color:'#818cf8'}}>
                📈 Market
              </motion.button>
            </div>
          </div>
        </header>

        {/* NOTIFICATIONS */}
        <AnimatePresence>
          {notifOpen && (
            <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
              style={{position:'fixed',top:'72px',right:'16px',width:'310px',background:'rgba(30,38,54,0.97)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'16px',padding:'16px',zIndex:200,boxShadow:'0 20px 60px rgba(0,0,0,0.6)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
                <span style={{fontWeight:'700',fontSize:'0.95rem'}}>Notifications</span>
                <button onClick={() => setNotifs([])} style={{background:'none',border:'none',color:'#64748b',cursor:'pointer',fontSize:'0.8rem',padding:'4px 8px',borderRadius:'8px'}}>Clear all</button>
              </div>
              {notifs.length === 0 ? <div style={{color:'#64748b',fontSize:'0.85rem',textAlign:'center',padding:'20px'}}>No notifications yet</div> :
                notifs.map(n => (
                  <div key={n.id} style={{display:'flex',gap:'10px',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                    <span style={{fontSize:'1rem'}}>{n.type==='success'?'✅':n.type==='warning'?'⚠️':'ℹ️'}</span>
                    <span style={{fontSize:'0.82rem',color:'#cbd5e1',lineHeight:'1.4'}}>{n.text}</span>
                  </div>
                ))
              }
            </motion.div>
          )}
        </AnimatePresence>

        {/* MARKET TRACKER MODAL */}
        <AnimatePresence>
          {showStock && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}
              onClick={() => setShowStock(false)}>
              <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }}
                style={{width:'100%',maxWidth:'820px',background:'rgba(20,25,40,0.98)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'20px',overflow:'hidden',maxHeight:'88vh'}}
                onClick={e => e.stopPropagation()}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'18px 24px',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
                  <div><span style={{fontSize:'1.1rem',fontWeight:'700'}}>📈 Market Tracker</span><span style={{fontSize:'0.8rem',color:'#64748b',marginLeft:'8px'}}>Live from Yahoo Finance</span></div>
                  <button onClick={() => setShowStock(false)} style={{background:'rgba(255,255,255,0.06)',border:'none',borderRadius:'10px',padding:'8px 14px',color:'#f1f5f9',cursor:'pointer',fontSize:'0.85rem'}}>✕ Close</button>
                </div>
                <div style={{padding:'16px',height:'520px'}}>
                  <iframe src="https://finance.yahoo.com/quote/%5EGSPC?p=%5EGSPC" width="100%" height="100%" frameBorder="0" style={{borderRadius:'12px'}} title="Market Tracker" />
                </div>
                <div style={{padding:'12px 24px',borderTop:'1px solid rgba(255,255,255,0.06)',display:'flex',gap:'12px',flexWrap:'wrap',alignItems:'center'}}>
                  <a href="https://finance.yahoo.com" target="_blank" rel="noopener" style={{color:'#818cf8',fontSize:'0.8rem',textDecoration:'none'}}>Yahoo Finance ↗</a>
                  <a href="https://finance.yahoo.com/portfolio" target="_blank" rel="noopener" style={{color:'#818cf8',fontSize:'0.8rem',textDecoration:'none'}}>My Portfolio ↗</a>
                  <a href="https://finance.yahoo.com/markets" target="_blank" rel="noopener" style={{color:'#818cf8',fontSize:'0.8rem',textDecoration:'none'}}>Markets ↗</a>
                  <span style={{marginLeft:'auto',fontSize:'0.72rem',color:'#475569'}}>Investing involves risk. Not financial advice.</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 16px 100px', display: 'grid', gridTemplateColumns: '1fr 270px', gap: '20px', alignItems: 'start' }}>
          <main>
            {/* TAB BAR */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', background: 'rgba(255,255,255,0.04)', borderRadius: '16px', padding: '6px', border: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {([['dashboard','📊','Dashboard'],['expenses','💳','Expenses'],['budget','🎯','Budget'],['analytics','📈','Analytics'],['requests','📬','Requests'],['profile','👤','Profile'],['invest','💹','Invest'],['find','🏷️','Find'],['ai','🤖','AI']] as [Tab,string,string][]).map(([t,icon,label]) => (
                <motion.button key={t} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setTab(t)}
                  style={{ flex: 1, minWidth: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 8px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', transition: 'all 0.2s', background: tab === t ? 'rgba(99,102,241,0.22)' : 'transparent', color: tab === t ? '#a5b4fc' : '#475569' }}>
                  <span style={{fontSize:'1rem'}}>{icon}</span><span>{label}</span>
                </motion.button>
              ))}
            </div>

            {tab === 'dashboard' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
                  <GlassCard style={{ borderLeft: '3px solid #6366f1' }}>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>Monthly Allowance</div>
                    <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#818cf8', marginTop: '6px' }}>{fmt(allowance)}</div>
                  </GlassCard>
                  <GlassCard style={{ borderLeft: '3px solid ' + (totalSpent > allowance ? '#ef4444' : '#22c55e') }}>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>Spent This Month</div>
                    <div style={{ fontSize: '1.65rem', fontWeight: '800', color: totalSpent > allowance ? '#ef4444' : '#f1f5f9', marginTop: '6px' }}>{fmt(totalSpent)}</div>
                  </GlassCard>
                  <GlassCard style={{ borderLeft: '3px solid ' + (moneyLeft < 0 ? '#ef4444' : '#06b6d4') }}>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>Balance Left</div>
                    <div style={{ fontSize: '1.65rem', fontWeight: '800', color: moneyLeft < 0 ? '#ef4444' : '#f1f5f9', marginTop: '6px' }}>{fmt(moneyLeft)}</div>
                  </GlassCard>
                  <GlassCard>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>Safe Daily</div>
                    <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#06b6d4', marginTop: '6px' }}>{fmt(safeDaily)}</div>
                    <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: '4px' }}>{daysLeft} days left</div>
                  </GlassCard>
                </div>

                <GlassCard>
                  <div style={{ fontSize: '0.88rem', fontWeight: '700', marginBottom: '12px' }}>Set Monthly Allowance</div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input value={allowanceInput} onChange={e => setAllowanceInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && setAllowanceFromInput()}
                      placeholder="$0.00" type="number" min="0" step="0.01"
                      style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '10px 14px', color: '#f1f5f9', fontSize: '0.9rem', outline: 'none' }} />
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={setAllowanceFromInput}
                      style={{ padding: '10px 20px', background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '12px', color: '#a5b4fc', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700', whiteSpace: 'nowrap' }}>
                      Update
                    </motion.button>
                  </div>
                </GlassCard>

                <GlassCard>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: '700' }}>Savings Goals</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{goals.length} active</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {goals.map(g => {
                      const pct = Math.min((g.current / g.target) * 100, 100);
                      return (
                        <div key={g.id}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>{g.icon}</span>
                              <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{g.name}</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{fmt(g.current)} <span style={{color:'#334155'}}>/</span> {fmt(g.target)}</div>
                          </div>
                          <ProgressBar value={g.current} max={g.target} color={pct >= 100 ? '#22c55e' : '#6366f1'} />
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>

                <GlassCard>
                  <div style={{ marginBottom: '14px', fontSize: '0.95rem', fontWeight: '700' }}>Recent Transactions</div>
                  {recentExps.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '28px', color: '#475569', fontSize: '0.85rem' }}>No transactions this month</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {recentExps.map(exp => {
                        const cat = categories.find(c => c.id === exp.category);
                        return (
                          <div key={exp.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                            <span style={{ fontSize: '1.3rem' }}>{cat?.icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.85rem', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat?.name}</div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.note || exp.date}</div>
                            </div>
                            <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#f1f5f9', whiteSpace: 'nowrap' }}>{fmt(exp.amount)}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            )}

            {tab === 'expenses' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <GlassCard>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '16px' }}>Add Expense</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>Category</label>
                      <select value={expenseForm.category} onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value }))}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '10px 12px', color: '#f1f5f9', fontSize: '0.85rem', cursor: 'pointer' }}>
                        {defaultCategories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>Amount ($)</label>
                      <input value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" type="number" min="0" step="0.01"
                        style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '10px 12px', color: '#f1f5f9', fontSize: '0.85rem', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>Date</label>
                      <input value={expenseForm.date} onChange={e => setExpenseForm(f => ({ ...f, date: e.target.value }))} type="date"
                        style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '10px 12px', color: '#f1f5f9', fontSize: '0.85rem', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>Note</label>
                      <input value={expenseForm.note} onChange={e => setExpenseForm(f => ({ ...f, note: e.target.value }))} placeholder="Coffee, Groceries..." style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '10px 12px', color: '#f1f5f9', fontSize: '0.85rem', outline: 'none' }} />
                    </div>
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={addExpense}
                    style={{ marginTop: '14px', width: '100%', padding: '12px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '12px', color: '#4ade80', cursor: 'pointer', fontSize: '0.88rem', fontWeight: '700' }}>
                    + Add Expense
                  </motion.button>
                </GlassCard>

                <GlassCard>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '14px' }}>All Transactions ({monthExps.length})</div>
                  {monthExps.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: '#475569', fontSize: '0.85rem' }}>No transactions recorded</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
                      {[...monthExps].sort((a,b) => b.date.localeCompare(a.date)).map(exp => {
                        const cat = categories.find(c => c.id === exp.category);
                        return (
                          <div key={exp.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 13px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                            <span style={{ fontSize: '1.3rem' }}>{cat?.icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{cat?.name}</div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{exp.note ? exp.note + ' · ' : ''}{exp.date}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#f1f5f9' }}>{fmt(exp.amount)}</div>
                              <button onClick={() => deleteExp(exp.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', padding: '4px 6px', borderRadius: '6px' }}>✕</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            )}

            {tab === 'budget' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <GlassCard>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '16px' }}>Category Budget Limits</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {categories.map(c => (
                      <div key={c.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{c.icon}</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{c.name}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{fmt(c.spent)}</span>
                            <span style={{ fontSize: '0.72rem', color: '#334155' }}>/</span>
                            <input value={c.budget || ''} onChange={e => updateBudget(c.id, e.target.value)} placeholder="Budget" type="number" min="0" step="1"
                              style={{ width: '80px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '6px 10px', color: '#f1f5f9', fontSize: '0.8rem', outline: 'none', textAlign: 'right' }} />
                          </div>
                        </div>
                        <ProgressBar value={c.spent} max={c.budget || 1} color={c.budget === 0 ? '#475569' : c.spent > c.budget ? '#ef4444' : c.spent > c.budget * 0.8 ? '#f59e0b' : c.color} />
                      </div>
                    ))}
                  </div>
                </GlassCard>
                {(totalSpent > allowance && allowance > 0) && (
                  <GlassCard style={{ borderLeft: '3px solid #ef4444', background: 'rgba(239,68,68,0.08)' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#f87171', marginBottom: '6px' }}>⚠️ Over Budget Alert</div>
                    <div style={{ fontSize: '0.82rem', color: '#fca5a5' }}>You have spent {fmt(Math.abs(moneyLeft))} more than your allowance. Consider cutting back on {categories.filter(c => c.spent > c.budget).map(c => c.name.toLowerCase()).join(', ') || 'some categories'}.</div>
                  </GlassCard>
                )}
              </motion.div>
            )}

            {tab === 'analytics' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <GlassCard>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '4px' }}>Spending by Category</div>
                  <div style={{ height: '260px', marginTop: '8px' }}>
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} innerRadius={55} paddingAngle={3} dataKey="value" label={({name, percent}) => `${name} ${((percent||0)*100).toFixed(0)}%`}>
                            {pieData.map((entry, index) => <Cell key={entry.name} fill={categories[index]?.color || COLORS[index % 8]} />)}
                          </Pie>
                          <Tooltip contentStyle={TS} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <div style={{textAlign:'center',padding:'60px',color:'#475569',fontSize:'0.85rem'}}>No spending data yet</div>}
                  </div>
                </GlassCard>

                <GlassCard>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '4px' }}>Monthly Trend</div>
                  <div style={{ height: '220px', marginTop: '8px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={last6}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="month" tick={TAS} />
                        <YAxis tick={TAS} />
                        <Tooltip contentStyle={TS} />
                        <Line type="monotone" dataKey="spent" stroke="#6366f1" strokeWidth={2.5} dot={{r:4,fill:'#6366f1'}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>

                <GlassCard>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '4px' }}>Budget vs Actual</div>
                  <div style={{ height: '220px', marginTop: '8px' }}>
                    {budgetData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={budgetData} barGap={4}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="name" tick={TAS} />
                          <YAxis tick={TAS} />
                          <Tooltip contentStyle={TS} />
                          <Legend wrapperStyle={{ fontSize: '0.78rem', color: '#64748b' }} />
                          <Bar dataKey="Budget" fill="rgba(99,102,241,0.4)" radius={[4,4,0,0]} />
                          <Bar dataKey="Spent" fill="#6366f1" radius={[4,4,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <div style={{textAlign:'center',padding:'60px',color:'#475569',fontSize:'0.85rem'}}>Set category budgets to see comparison</div>}
                  </div>
                </GlassCard>

                <GlassCard>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px' }}>Financial Tips</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {moneyLeft < 0 && <div style={{padding:'12px',background:'rgba(239,68,68,0.1)',borderRadius:'12px',fontSize:'0.82rem',color:'#fca5a5',borderLeft:'3px solid #ef4444'}}>You are over budget. Review your {categories.filter(c=>c.spent>c.budget&&c.budget>0).map(c=>c.name.toLowerCase()).join(', ')||'spending categories'} spending.</div>}
                    {moneyLeft > 0 && moneyLeft < allowance * 0.2 && <div style={{padding:'12px',background:'rgba(245,158,11,0.1)',borderRadius:'12px',fontSize:'0.82rem',color:'#fde68a',borderLeft:'3px solid #f59e0b'}}>Caution: Only {fmt(moneyLeft)} left ({((moneyLeft/allowance)*100).toFixed(0)}% of allowance). You can safely spend {fmt(safeDaily)}/day.</div>}
                    {safeDaily > 0 && safeDaily < 20 && <div style={{padding:'12px',background:'rgba(6,182,212,0.1)',borderRadius:'12px',fontSize:'0.82rem',color:'#a5f3fc',borderLeft:'3px solid #06b6d4'}}>Your daily safe spend is low ({fmt(safeDaily)}). Consider adjusting your budget or reducing non-essential costs.</div>}
                    {pieData.length >= 3 && <div style={{padding:'12px',background:'rgba(34,197,94,0.08)',borderRadius:'12px',fontSize:'0.82rem',color:'#86efac',borderLeft:'3px solid #22c55e'}}>Great progress! Your top 3 categories account for {(()=>{const sorted=[...pieData].sort((a,b)=>b.value-a.value);return((sorted[0].value+sorted[1].value+sorted[2].value)/totalSpent*100).toFixed(0)})()}% of spending.</div>}
                    {allowance === 0 && <div style={{padding:'12px',background:'rgba(99,102,241,0.1)',borderRadius:'12px',fontSize:'0.82rem',color:'#a5b4fc',borderLeft:'3px solid #6366f1'}}>Set your monthly allowance on the Dashboard to start tracking your finances.</div>}
                    {totalSpent > 0 && totalSpent < allowance * 0.5 && <div style={{padding:'12px',background:'rgba(34,197,94,0.08)',borderRadius:'12px',fontSize:'0.82rem',color:'#86efac',borderLeft:'3px solid #22c55e'}}>Excellent! You have spent only {((totalSpent/allowance)*100).toFixed(0)}% of your allowance. Keep it up!</div>}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {tab === 'requests' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <GlassCard>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '14px' }}>Request Additional Allowance</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input value={requestForm.amount} onChange={e => setRequestForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount ($)" type="number" min="0" step="0.01"
                      style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '10px 14px', color: '#f1f5f9', fontSize: '0.88rem', outline: 'none' }} />
                    <textarea value={requestForm.reason} onChange={e => setRequestForm(f => ({ ...f, reason: e.target.value }))} placeholder="Reason for request..." rows={3}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '10px 14px', color: '#f1f5f9', fontSize: '0.88rem', outline: 'none', resize: 'vertical' }} />
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={submitRequest}
                      style={{ padding: '12px', background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.35)', borderRadius: '12px', color: '#a5b4fc', cursor: 'pointer', fontSize: '0.88rem', fontWeight: '700' }}>
                      Submit Request
                    </motion.button>
                  </div>
                </GlassCard>

                {pendingReqs.length > 0 && (
                  <GlassCard>
                    <div style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px' }}>Pending Requests ({pendingReqs.length})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {pendingReqs.map(r => (
                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#f1f5f9' }}>{fmt(r.amount)}</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{r.reason || 'No reason provided'} · {r.date}</div>
                          </div>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => approveReq(r.id)}
                            style={{ padding: '7px 16px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '10px', color: '#4ade80', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700' }}>
                            Approve
                          </motion.button>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {reqs.filter(r => r.status !== 'pending').length > 0 && (
                  <GlassCard>
                    <div style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px' }}>Past Requests</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {reqs.filter(r => r.status !== 'pending').slice(-10).reverse().map(r => (
                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{fmt(r.amount)}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{r.reason || r.date}</div>
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', background: r.status === 'approved' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: r.status === 'approved' ? '#4ade80' : '#f87171' }}>
                            {r.status.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}
              </motion.div>
            )}

            {tab === 'profile' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <GlassCard>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '16px' }}>Profile Settings</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>Display Name</label>
                      <input value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Your name"
                        style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '10px 14px', color: '#f1f5f9', fontSize: '0.88rem', outline: 'none' }} />
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={saveProfile}
                      style={{ padding: '11px', background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.35)', borderRadius: '12px', color: '#a5b4fc', cursor: 'pointer', fontSize: '0.88rem', fontWeight: '700' }}>
                      Save Profile
                    </motion.button>
                  </div>
                </GlassCard>

                <GlassCard>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '14px' }}>Export / Import Data</div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => {
                      const data = JSON.stringify({ allowance, categories, expenses, goals, reqs, settings }, null, 2);
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a'); a.href = url; a.download = 'wealth-health-backup.json'; a.click();
                      URL.revokeObjectURL(url);
                      addNotif('Data exported successfully', 'success');
                    }}
                      style={{ padding: '9px 18px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '10px', color: '#a5b4fc', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}>
                      📥 Export JSON
                    </motion.button>
                    <input type="file" accept=".json" id="import-file" style={{ display: 'none' }} onChange={e => {
                      const file = e.target.files?.[0]; if (!file) return;
                      const reader = new FileReader(); reader.onload = ev => {
                        try { const d = JSON.parse(ev.target?.result as string); if (d.allowance !== undefined) setAllowance(d.allowance); if (d.categories) setCategories(d.categories); if (d.expenses) setExpenses(d.expenses); if (d.goals) setGoals(d.goals); if (d.reqs) setReqs(d.reqs); if (d.settings) setSettings(d.settings); addNotif('Data imported successfully', 'success'); } catch { addNotif('Invalid file format', 'warning'); }
                      }; reader.readAsText(file);
                    }} />
                    <motion.label whileHover={{ scale: 1.03 }} htmlFor="import-file"
                      style={{ padding: '9px 18px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '10px', color: '#4ade80', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}>
                      📤 Import JSON
                    </motion.label>
                  </div>
                </GlassCard>

                <GlassCard>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px' }}>Financial Summary</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ padding: '12px', background: 'rgba(99,102,241,0.08)', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#818cf8' }}>{fmt(allowance)}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>Monthly Budget</div>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(34,197,94,0.08)', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#4ade80' }}>{fmt(moneyLeft)}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>Balance</div>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(6,182,212,0.08)', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#06b6d4' }}>{fmt(safeDaily)}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>Safe Daily</div>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(139,92,246,0.08)', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#a78bfa' }}>{expenses.length}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>Total Expenses</div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}

          </main>

          {/* SIDEBAR */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '84px' }}>
            <GlassCard>
              <div style={{ fontSize: '0.88rem', fontWeight: '700', marginBottom: '10px' }}>Quick Stats</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: '#64748b' }}>Total Expenses</span>
                  <span style={{ fontWeight: '600' }}>{monthExps.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: '#64748b' }}>Budget Categories</span>
                  <span style={{ fontWeight: '600' }}>{categories.filter(c => c.budget > 0).length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: '#64748b' }}>Over Budget</span>
                  <span style={{ fontWeight: '600', color: totalSpent > allowance && allowance > 0 ? '#ef4444' : '#4ade80' }}>{categories.filter(c => c.spent > c.budget && c.budget > 0).length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: '#64748b' }}>Savings Goals</span>
                  <span style={{ fontWeight: '600' }}>{goals.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: '#64748b' }}>Pending Requests</span>
                  <span style={{ fontWeight: '600', color: pendingReqs.length > 0 ? '#f59e0b' : '#4ade80' }}>{pendingReqs.length}</span>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div style={{ fontSize: '0.88rem', fontWeight: '700', marginBottom: '10px' }}>Budget Health</div>
              {allowance === 0 ? (
                <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', padding: '12px' }}>Set an allowance to see health score</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '2rem', fontWeight: '900', color: moneyLeft < 0 ? '#ef4444' : moneyLeft < allowance * 0.2 ? '#f59e0b' : '#22c55e' }}>
                    {moneyLeft < 0 ? '🔴' : moneyLeft < allowance * 0.2 ? '🟡' : '🟢'}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: moneyLeft < 0 ? '#ef4444' : moneyLeft < allowance * 0.2 ? '#f59e0b' : '#22c55e' }}>
                    {moneyLeft < 0 ? 'Over Budget' : moneyLeft < allowance * 0.2 ? 'Low Balance' : 'On Track'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
                    {((totalSpent / allowance) * 100).toFixed(0)}% of allowance used
                  </div>
                </div>
              )}
            </GlassCard>

            <GlassCard>
              <div style={{ fontSize: '0.88rem', fontWeight: '700', marginBottom: '10px' }}>Top Spending</div>
              {pieData.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', padding: '12px' }}>No data yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[...pieData].sort((a,b) => b.value - a.value).slice(0,4).map((entry, i) => {
                    const cat = categories.find(c => c.name === entry.name);
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1rem' }}>{cat?.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</div>
                          <ProgressBar value={entry.value} max={totalSpent} color={cat?.color || '#6366f1'} h={4} />
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: '600', color: '#64748b' }}>{fmt(entry.value)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>

            <GlassCard>
              <div style={{ fontSize: '0.88rem', fontWeight: '700', marginBottom: '8px' }}>📈 Market</div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowStock(true)}
                style={{ width: '100%', padding: '10px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '10px', color: '#a5b4fc', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                Open Market Tracker
              </motion.button>
              <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '8px', textAlign: 'center' }}>Powered by Yahoo Finance</div>
            </GlassCard>
          </aside>

        {tab === 'invest' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Risk Assessment Quiz */}
            <GlassCard>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '14px' }}>Risk Assessment Quiz</div>
              {!invProfile.answered ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: '1.5' }}>Answer the questions to discover your investor profile and get a personalised strategy aligned to your demographics and risk tolerance.</div>
                  {RISK_QS.map((rq, qi) => (
                    <div key={qi}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>{qi+1}. {rq.q}</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {rq.opts.map((opt, oi) => (
                          <motion.button key={oi} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            onClick={() => { const na = [...riskAns]; na[qi] = opt.val; setRiskAns(na); }}
                            style={{ padding: '8px 14px', background: riskAns[qi] === opt.val ? 'rgba(99,102,241,0.28)' : 'rgba(255,255,255,0.05)', border: '1px solid ' + (riskAns[qi] === opt.val ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.1)'), borderRadius: '10px', color: riskAns[qi] === opt.val ? '#a5b4fc' : '#94a3b8', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                            {opt.label}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '8px', marginTop: '4px' }}>Your Profile</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>Age</label>
                      <input value={demoFrm.age} onChange={e => setDemoFrm(f => ({...f, age: e.target.value}))} placeholder="e.g. 28" type="number" min="18" max="100"
                        style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '9px 12px', color: '#f1f5f9', fontSize: '0.85rem', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>Annual Income ($)</label>
                      <input value={demoFrm.income} onChange={e => setDemoFrm(f => ({...f, income: e.target.value}))} placeholder="e.g. 65000" type="number" min="0"
                        style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '9px 12px', color: '#f1f5f9', fontSize: '0.85rem', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>Dependents</label>
                      <input value={demoFrm.dependents} onChange={e => setDemoFrm(f => ({...f, dependents: e.target.value}))} placeholder="e.g. 2" type="number" min="0"
                        style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '9px 12px', color: '#f1f5f9', fontSize: '0.85rem', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>Occupation</label>
                      <input value={demoFrm.occupation} onChange={e => setDemoFrm(f => ({...f, occupation: e.target.value}))} placeholder="e.g. Software Engineer"
                        style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '9px 12px', color: '#f1f5f9', fontSize: '0.85rem', outline: 'none' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>Primary Financial Goal</label>
                    <input value={demoFrm.goal} onChange={e => setDemoFrm(f => ({...f, goal: e.target.value}))} placeholder="e.g. Financial freedom, Retire at 55, Buy a home"
                      style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '9px 12px', color: '#f1f5f9', fontSize: '0.85rem', outline: 'none' }} />
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const answered = riskAns.filter(v => v !== undefined).length >= 3;
                      if (!answered) { addNotif('Please answer at least 3 questions', 'warning'); return; }
                      const score = calcRiskScore(riskAns);
                      const risk: RiskLevel = score < 0.8 ? 'conservative' : score < 1.5 ? 'moderate' : 'aggressive';
                      const demo: Demographics = {age: parseInt(demoFrm.age)||0, income: parseFloat(demoFrm.income)||0, dependents: parseInt(demoFrm.dependents)||0, goal: demoFrm.goal, occupation: demoFrm.occupation};
                      setInvProfile({risk, demo, answered: true});
                      addNotif('Investment profile saved!', 'success');
                    }}
                    disabled={riskAns.filter(v => v !== undefined).length < 3}
                    style={{ padding: '12px', background: riskAns.filter(v => v !== undefined).length >= 3 ? 'rgba(99,102,241,0.22)' : 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.35)', borderRadius: '12px', color: riskAns.filter(v => v !== undefined).length >= 3 ? '#a5b4fc' : '#475569', cursor: riskAns.filter(v => v !== undefined).length >= 3 ? 'pointer' : 'not-allowed', fontSize: '0.88rem', fontWeight: '700' }}>
                    Generate My Strategy
                  </motion.button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '2rem' }}>{getRiskEmoji(invProfile.risk)}</span>
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: '700' }}>{getRiskLabel(invProfile.risk)} Investor</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{invProfile.demo.age ? 'Age ' + invProfile.demo.age + ' · ' + (invProfile.demo.occupation || 'Professional') : 'Profile complete'}</div>
                      </div>
                    </div>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setInvProfile(p => ({...p, answered: false}))}
                      style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#94a3b8', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600' }}>
                      Retake
                    </motion.button>
                  </div>
                  {(() => {
                    const adv = getInvestAdvice(invProfile.risk, invProfile.demo);
                    return (
                      <>
                        <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#818cf8' }}>{adv.title}</div>
                        <div style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.5' }}>{adv.desc}</div>
                        {adv.strategy && <div style={{ padding: '12px', background: 'rgba(99,102,241,0.1)', borderRadius: '12px', fontSize: '0.82rem', color: '#c7d2fe', lineHeight: '1.5', borderLeft: '3px solid #6366f1' }}>{adv.strategy}</div>}
                      </>
                    );
                  })()}
                </div>
              )}
            </GlassCard>

            {/* Portfolio Allocation */}
            {invProfile.answered && (() => {
              const adv = getInvestAdvice(invProfile.risk, invProfile.demo);
              return (
                <GlassCard>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '14px' }}>Suggested Portfolio Allocation</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {adv.allocations.map((a, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: a.color }} />
                            <span style={{ fontSize: '0.82rem', fontWeight: '600' }}>{a.name}</span>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px' }}>{a.risk}</span>
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f1f5f9' }}>{a.pct}%</span>
                        </div>
                        <ProgressBar value={a.pct} max={100} color={a.color} h={6} />
                      </div>
                    ))}
                  </div>
                </GlassCard>
              );
            })()}

            {/* Age Insight */}
            {invProfile.answered && invProfile.demo.age > 0 && (
              <GlassCard>
                <div style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '10px' }}>Age-Based Insight</div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.6' }}>{getAgeInsight(invProfile.demo.age)}</div>
                {invProfile.demo.income > 0 && (
                  <div style={{ marginTop: '10px', padding: '10px 12px', background: 'rgba(34,197,94,0.08)', borderRadius: '10px', fontSize: '0.82rem', color: '#86efac', lineHeight: '1.5' }}>
                    At {fmt(invProfile.demo.income)}/year income, a 15-20% savings rate = {fmt(invProfile.demo.income * 0.17)}/year toward investments.
                  </div>
                )}
              </GlassCard>
            )}

            {/* Universal Rules */}
            <GlassCard>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px' }}>Universal Financial Rules</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['Build a 3-6 month emergency fund before investing.', 'Pay off high-interest debt before investing.', 'Always maintain adequate insurance.', 'Never invest money you cannot leave untouched for 3+ years.', 'Diversify across asset classes.', 'Review portfolio allocation at least once per year.', 'Tax-advantaged accounts (401k, IRA) should be your first priority.'].map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.4' }}>
                    <span style={{ color: '#6366f1', fontWeight: '700', flexShrink: 0 }}>*</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Market Tracker */}
            <GlassCard>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '10px' }}>Market Tracker</div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowStock(true)}
                style={{ width: '100%', padding: '11px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px', color: '#a5b4fc', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                Open Live Market Tracker
              </motion.button>
              <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '8px', textAlign: 'center' }}>Powered by Yahoo Finance</div>
            </GlassCard>

          </motion.div>
        )}
        </div>
        {/* CHATBOT WIDGET */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                width: '380px',
                height: '520px',
                background: 'rgba(20,25,40,0.98)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '20px',
                zIndex: 500,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 80px rgba(0,0,0,0.7)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '16px 20px', background: 'rgba(99,102,241,0.15)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>💬</div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#f1f5f9' }}>Wealth Assistant</div>
                    <div style={{ fontSize: '0.72rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />Online</div>
                  </div>
                </div>
                <button onClick={() => setChatOpen(false)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '10px', padding: '8px 12px', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}>✕</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {chatMessages.map((msg) => (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: msg.role === 'user' ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)', border: msg.role === 'user' ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.08)', fontSize: '0.82rem', lineHeight: '1.5', color: '#f1f5f9' }}>
                      <div>{msg.text}</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '4px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>{msg.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '8px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {['Budget Help', 'Track Expense', 'Savings Goals', 'Investment'].map((action) => (
                  <button key={action} onClick={() => setChatInput(action)} style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', color: '#94a3b8', fontSize: '0.72rem', cursor: 'pointer' }}>{action}</button>
                ))}
              </div>
              <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '10px' }}>
                <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()} placeholder="Type a message..." style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '10px 14px', color: '#f1f5f9', fontSize: '0.85rem', outline: 'none' }} />
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={sendChatMessage} style={{ padding: '10px 16px', background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '12px', color: '#a5b4fc', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700' }}>Send</motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Floating Button */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setChatOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: chatOpen ? '424px' : '24px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
            cursor: 'pointer',
            zIndex: 499,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
            transition: 'right 0.3s ease',
          }}
        >
          💬
        </motion.button>
      </div>
    </>
  );
};

export default Home;
