import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  X, 
  Calendar as CalendarIcon, 
  ArrowRight,
  Sparkles,
  TrendingUp, 
  Wallet,
  ArrowDownLeft,
  DollarSign, 
  PiggyBank,
  CheckCircle,
  HelpCircle,
  FolderOpen,
  Filter,
  RefreshCw,
  Clock,
  ExternalLink,
  Info
} from 'lucide-react';

// Type definitions
interface Expense {
  id: string;
  title: string;
  amount: number;
  category: 'food' | 'transport' | 'shopping bills' | 'entertainment' | 'others';
  date: string; // YYYY-MM-DD
  note?: string;
}

interface Income {
  id: string;
  title: string;
  amount: number;
  date: string;
  source: string; // e.g. "Salary", "Freelance"
}

interface BudgetSettings {
  totalBudget: number;
  savingsGoal: number;
}

// Constant lists
const CATEGORIES: Expense['category'][] = [
  'food',
  'transport',
  'shopping bills',
  'entertainment',
  'others'
];

const CATEGORY_META: Record<Expense['category'], {
  bg: string;
  text: string;
  darkText: string;
  colorHex: string;
  emoji: string;
}> = {
  food: {
    bg: 'bg-[#F5F2E9]',
    text: 'text-[#5A5A40]',
    darkText: 'text-[#4A4A33]',
    colorHex: '#A3A380',
    emoji: '🍲'
  },
  transport: {
    bg: 'bg-[#F2ECE4]',
    text: 'text-[#8A7E5E]',
    darkText: 'text-[#6E644A]',
    colorHex: '#D4C391',
    emoji: '🚗'
  },
  'shopping bills': {
    bg: 'bg-[#FAF6EC]',
    text: 'text-[#968656]',
    darkText: 'text-[#7B6D44]',
    colorHex: '#C2B280',
    emoji: '🧾'
  },
  entertainment: {
    bg: 'bg-[#EFEFEA]',
    text: 'text-[#5E5D53]',
    darkText: 'text-[#42413A]',
    colorHex: '#8E8E85',
    emoji: '🍿'
  },
  others: {
    bg: 'bg-[#EEEEEE]',
    text: 'text-[#777777]',
    darkText: 'text-[#555555]',
    colorHex: '#AAAAAA',
    emoji: '📦'
  }
};

export default function App() {
  // Navigation: "landing" | "dashboard"
  const [currentScreen, setCurrentScreen] = useState<'landing' | 'dashboard'>('landing');

  // Backend States
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [budgetSettings, setBudgetSettings] = useState<BudgetSettings>({
    totalBudget: 60000,
    savingsGoal: 15000
  });

  // Client Status UI
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  // Form Fields State
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);

  // Editing items
  const [activeExpenseEdit, setActiveExpenseEdit] = useState<Expense | null>(null);
  const [activeIncomeEditId, setActiveIncomeEditId] = useState<string | null>(null);

  // Expense form variables
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState<Expense['category']>('food');
  const [expDate, setExpDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expNote, setExpNote] = useState('');

  // Income form variables
  const [incTitle, setIncTitle] = useState('');
  const [incAmount, setIncAmount] = useState('');
  const [incSource, setIncSource] = useState('Salary');
  const [incDate, setIncDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Budget settings form variables
  const [budTotal, setBudTotal] = useState('');
  const [budSavingsGoal, setBudSavingsGoal] = useState('');

  // Search & Filter State
  const [filterSearch, setFilterSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Show Toast
  const triggerToast = (message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Raw API sync method
  const fetchFullState = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || []);
        setIncomes(data.incomes || []);
        if (data.budgetSettings) {
          setBudgetSettings(data.budgetSettings);
        }
      }
    } catch (e) {
      console.error('Error fetching backend balance database:', e);
      triggerToast('Could not fetch latest tracker data. Using local cache fallback.', true);
    } finally {
      setIsLoading(false);
    }
  };

  // Mount logic
  useEffect(() => {
    fetchFullState();
  }, []);

  // Save Expense (Add or Edit)
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim()) {
      triggerToast('Please provide an expense title', true);
      return;
    }
    const val = parseFloat(expAmount);
    if (isNaN(val) || val <= 0) {
      triggerToast('Amount must be a positive number', true);
      return;
    }

    try {
      const payload = {
        title: expTitle.trim(),
        amount: val,
        category: expCategory,
        date: expDate || new Date().toISOString().split('T')[0],
        note: expNote.trim() || undefined
      };

      if (activeExpenseEdit) {
        // Edit flow
        const res = await fetch(`/api/expenses/${activeExpenseEdit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          triggerToast('Expense updated successfully');
          fetchFullState();
        } else {
          throw new Error('Edit request failed');
        }
      } else {
        // Create flow
        const res = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          triggerToast('Expense recorded successfully');
          fetchFullState();
        } else {
          throw new Error('Create request failed');
        }
      }
      setExpenseModalOpen(false);
    } catch (err) {
      console.error(err);
      triggerToast('Failed to save expense.', true);
    }
  };

  // Open Edit Expense Modal
  const startEditExpense = (item: Expense) => {
    setActiveExpenseEdit(item);
    setExpTitle(item.title);
    setExpAmount(item.amount.toString());
    setExpCategory(item.category);
    setExpDate(item.date);
    setExpNote(item.note || '');
    setExpenseModalOpen(true);
  };

  // Open New Expense Modal
  const startNewExpense = () => {
    setActiveExpenseEdit(null);
    setExpTitle('');
    setExpAmount('');
    setExpCategory('food');
    setExpDate(new Date().toISOString().split('T')[0]);
    setExpNote('');
    setExpenseModalOpen(true);
  };

  // Delete Expense
  const handleDeleteExpense = async (id: string, name: string) => {
    if (!confirm(`Are you absolutely sure you want to delete the expense: "${name}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        triggerToast('Expense removed successfully');
        fetchFullState();
      } else {
        throw new Error('Delete call returned non-200');
      }
    } catch (e) {
      console.error(e);
      triggerToast('Error removing entry', true);
    }
  };

  // Save Income (Add Only in UI)
  const handleSaveIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incTitle.trim()) {
      triggerToast('Please provide an income source name', true);
      return;
    }
    const val = parseFloat(incAmount);
    if (isNaN(val) || val <= 0) {
      triggerToast('Income must be a positive number', true);
      return;
    }

    try {
      const payload = {
        title: incTitle.trim(),
        amount: val,
        source: incSource,
        date: incDate || new Date().toISOString().split('T')[0]
      };

      const res = await fetch('/api/incomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        triggerToast('Income source saved successfully');
        fetchFullState();
        setIncomeModalOpen(false);
      } else {
        throw new Error('Save income failed');
      }
    } catch (error) {
      console.error(error);
      triggerToast('Could not save income', true);
    }
  };

  // Open New Income Modal
  const startNewIncome = () => {
    setIncTitle('');
    setIncAmount('');
    setIncSource('Salary');
    setIncDate(new Date().toISOString().split('T')[0]);
    setIncomeModalOpen(true);
  };

  // Delete Income
  const handleDeleteIncome = async (id: string) => {
    if (!confirm('Remove this income entry?')) return;
    try {
      const res = await fetch(`/api/incomes/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        triggerToast('Income source removed successfully');
        fetchFullState();
      }
    } catch (e) {
      triggerToast('Could not delete income', true);
    }
  };

  // Save Budget Configuration Settings
  const handleSaveBudgetSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(budTotal);
    const parsedSavingsGoal = parseFloat(budSavingsGoal);

    if (isNaN(parsedAmt) || parsedAmt < 0 || isNaN(parsedSavingsGoal) || parsedSavingsGoal < 0) {
      triggerToast('Please ensure budget values are valid positive integers', true);
      return;
    }

    try {
      const res = await fetch('/api/budgetSettings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalBudget: parsedAmt,
          savingsGoal: parsedSavingsGoal
        })
      });
      if (res.ok) {
        triggerToast('Budget settings updated successfully');
        fetchFullState();
        setBudgetModalOpen(false);
      }
    } catch (err) {
      triggerToast('Failed to write settings', true);
    }
  };

  // Open Budget Settings Modal
  const startEditBudgetSettings = () => {
    setBudTotal(budgetSettings.totalBudget.toString());
    setBudSavingsGoal(budgetSettings.savingsGoal.toString());
    setBudgetModalOpen(true);
  };

  // Reset demo datasets
  const handleRequestRestoreDefaults = async () => {
    if (confirm('This resets your tracker with sample transactions. Proceed?')) {
      try {
        const testRes = await fetch('/api/budgetSettings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ totalBudget: 60000, savingsGoal: 15000 })
        });
        if (testRes.ok) {
          triggerToast('Tracker reset with sample entries');
          fetchFullState();
        }
      } catch (e) {
        triggerToast('Reset failed', true);
      }
    }
  };

  // INR Currency utility formatter
  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Filters search query parsing
  const filteredExpensesList = useMemo(() => {
    return expenses
      .filter((exp) => {
        // category filter
        if (filterCategory !== 'all' && exp.category !== filterCategory) {
          return false;
        }
        // from date
        if (filterDateFrom && exp.date < filterDateFrom) {
          return false;
        }
        // to date
        if (filterDateTo && exp.date > filterDateTo) {
          return false;
        }
        // partial title matching
        if (filterSearch.trim()) {
          const matchPhrase = filterSearch.toLowerCase().trim();
          const titleMatch = exp.title.toLowerCase().includes(matchPhrase);
          const noteMatch = exp.note?.toLowerCase().includes(matchPhrase) || false;
          if (!titleMatch && !noteMatch) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date)); // sorted by date (most recent first)
  }, [expenses, filterCategory, filterDateFrom, filterDateTo, filterSearch]);

  // Derived budget & savings calculations
  const totalIncomesSum = useMemo(() => {
    return incomes.reduce((acc, entry) => acc + entry.amount, 0);
  }, [incomes]);

  const totalSpentSum = useMemo(() => {
    return expenses.reduce((acc, entry) => acc + entry.amount, 0);
  }, [expenses]);

  const totalSavingsSum = useMemo(() => {
    return totalIncomesSum - totalSpentSum;
  }, [totalIncomesSum, totalSpentSum]);

  // Current calendar month details (based on May 2026 for alignment / current actual time representation)
  const currentMonthName = 'May';
  const currentYear = 2026;

  // Real-time breakdown calculations by category
  const categoryStats = useMemo(() => {
    const defaultStats = {
      food: 0,
      transport: 0,
      'shopping bills': 0,
      entertainment: 0,
      others: 0
    };

    expenses.forEach((exp) => {
      if (defaultStats.hasOwnProperty(exp.category)) {
        defaultStats[exp.category] += exp.amount;
      } else {
        defaultStats.others += exp.amount;
      }
    });

    const sum = Object.values(defaultStats).reduce((a, b) => a + b, 0);

    const mapped = CATEGORIES.map((cat) => {
      const amount = defaultStats[cat];
      const percent = sum > 0 ? (amount / sum) * 100 : 0;
      return {
        category: cat,
        amount,
        percentage: percent
      };
    });

    return {
      totals: defaultStats,
      list: mapped,
      totalSumCategory: sum
    };
  }, [expenses]);

  // Budget difference list for Left Layout widget matching screen upload
  const budgetBreakdowns = useMemo(() => {
    // Expected budgeted shares representing the uploaded screen (mocking standard allocation ratios)
    const mockBudgetAllocations: Record<Expense['category'], number> = {
      food: 8000,
      transport: 5000,
      'shopping bills': 18000,
      entertainment: 6000,
      others: 5000
    };

    return CATEGORIES.map((cat) => {
      const budgeted = mockBudgetAllocations[cat];
      const actual = categoryStats.totals[cat] || 0;
      const difference = budgeted - actual;
      return {
        category: cat,
        budgeted,
        actual,
        difference
      };
    });
  }, [categoryStats]);

  // Calendar dates representation: generate dates representing May 2026 matching the "Calendar graphic"
  const calendarDays = useMemo(() => {
    const daysInMonth = 31;
    // May 1 2026 starts on Friday (index 5)
    const list: (number | null)[] = Array(5).fill(null); 
    for (let i = 1; i <= daysInMonth; i++) {
      list.push(i);
    }
    return list;
  }, []);

  // Map of date-keyed amounts to display active day spending dots on the calendar graphic!
  const dateWiseSpending = useMemo(() => {
    const record: Record<string, number> = {};
    expenses.forEach(exp => {
      const parts = exp.date.split('-');
      // Check if it belongs to May 2026
      if (parts[0] === '2026' && parts[1] === '05') {
        const day = parseInt(parts[2], 10);
        if (!isNaN(day)) {
          record[day] = (record[day] || 0) + exp.amount;
        }
      }
    });
    return record;
  }, [expenses]);

  // Core center element graphics: total segment circle path calculation for donut layout
  const donutPercentages = useMemo(() => {
    let accumulated = 0;
    return categoryStats.list.map((item) => {
      const startAngle = (accumulated / 100) * 360;
      accumulated += item.percentage;
      const endAngle = (accumulated / 100) * 360;
      return {
        ...item,
        startAngle,
        endAngle
      };
    });
  }, [categoryStats]);

  return (
    <div className="min-h-screen bg-[#FDFCF7] text-[#3D3D36] font-sans antialiased relative">
      
      {/* Decorative Vintage Rose Flower Accent SVGs to bring extreme high-fidelity aesthetics matching user screen upload */}
      <div className="absolute top-0 right-0 w-44 h-44 opacity-25 pointer-events-none select-none overflow-hidden z-0 hidden lg:block">
        <svg viewBox="0 0 100 100" fill="currentColor" className="text-[#D3B09E] scale-125 transform rotate-45">
          <path d="M50 20 C60 10, 80 10, 80 30 C80 50, 50 80, 50 80 C50 80, 20 50, 20 30 C20 10, 40 10, 50 20 Z" />
          <path d="M45 40 C35 30, 15 35, 20 55 C25 70, 50 85, 50 85 C50 85, 75 70, 80 55 C85 35, 65 30, 55 40 Z" opacity="0.75"/>
          <circle cx="50" cy="45" r="7" className="text-[#A3A380]" />
        </svg>
      </div>
      
      <div className="absolute bottom-0 left-0 w-44 h-44 opacity-20 pointer-events-none select-none overflow-hidden z-0 hidden lg:block">
        <svg viewBox="0 0 100 100" fill="currentColor" className="text-[#C5B495] scale-125">
          <path d="M50 30 C55 15, 75 15, 75 35 C75 55, 50 75, 50 75 C50 75, 25 55, 25 35 C25 15, 45 15, 50 30 Z" />
          <circle cx="50" cy="45" r="6" className="text-[#E5DCC5]" />
        </svg>
      </div>

      {/* Dynamic Native Elegant Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-6 py-3.5 rounded-full shadow-xl border text-sm max-w-sm ${
              toast.isError 
                ? 'bg-[#8B5A42] text-[#FCFBFA] border-[#814C34]' 
                : 'bg-[#5A5A40] text-[#FDFCF7] border-[#4A4A33]'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="font-medium">{toast.message}</span>
            <button 
              onClick={() => setToast(null)}
              className="ml-auto text-white/70 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SCREEN 1: LANDING PAGE */}
      {currentScreen === 'landing' ? (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 relative z-10">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-3xl text-center space-y-8"
          >
            {/* Visual Header Flower Circle Decoration */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-[#F2EDE4] rounded-full flex items-center justify-center border-2 border-[#E6E2D3] shadow-inner relative">
                <span className="text-3xl">🌸</span>
                <span className="absolute -top-1 -right-1 text-xs animate-bounce">✨</span>
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-xs uppercase tracking-[0.3em] text-[#8E8E85] font-bold block">
                Personal Expense Tracker
              </span>
              <h1 className="text-4xl sm:text-6xl font-serif italic text-[#2D2D2A] tracking-tight leading-tight">
                Align Your Spending, <br />
                <span className="text-[#8E8E85] font-light">Simplify Your Life</span>
              </h1>
              <p className="text-sm sm:text-lg text-[#6E6E64] max-w-lg mx-auto leading-relaxed">
                Step into a serene personal expense tracker custom crafted with organic pastel tones. Easily log expenses, view monthly category breakdowns, and filter your history seamlessly.
              </p>
            </div>

            {/* Simulated Live Preview Dashboard Frame */}
            <div className="bg-white/70 backdrop-blur-md rounded-3xl border border-[#E6E2D3] p-4 sm:p-6 shadow-xl max-w-md mx-auto space-y-4 relative">
              <div className="flex justify-between items-center pb-3 border-b border-[#F2ECE4]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#E3B09E]" />
                  <span className="text-xs font-serif italic text-[#5A5A40]">Expense Tracker</span>
                </div>
                <span className="text-[10px] uppercase font-mono bg-[#5A5A40]/10 text-[#5A5A40] px-2 py-0.5 rounded">
                  Budget Tool
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#F2ECE4]">
                  <p className="text-[9px] uppercase tracking-wider text-[#8E8E85] font-bold">Total Budget</p>
                  <p className="text-lg font-serif font-bold text-[#2D2D2A]">{formatINR(budgetSettings.totalBudget)}</p>
                </div>
                <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#F2ECE4]">
                  <p className="text-[9px] uppercase tracking-wider text-[#8E8E85] font-bold">Stored Records</p>
                  <p className="text-lg font-serif font-bold text-[#2D2D2A]">{expenses.length} Entries</p>
                </div>
              </div>

              {/* Mini categories visual bar indicator */}
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between text-[10px] text-[#6E6E64] font-medium">
                  <span>🍲 Food Allocation</span>
                  <span className="font-serif italic font-bold">Perfect Balance</span>
                </div>
                <div className="w-full h-1.5 bg-[#FAF6EC] rounded-full overflow-hidden">
                  <div className="h-full bg-[#A3A380] rounded-full w-[45%]" />
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3.5">
              <button 
                id="btn-enter"
                onClick={() => setCurrentScreen('dashboard')}
                className="bg-[#5A5A40] text-[#F9F8F3] hover:bg-[#4A4A35] transition-all duration-300 px-8 py-4 rounded-full font-medium text-sm flex items-center justify-center gap-2.5 shadow-md transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Enter Personal Ledger</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <button 
                onClick={handleRequestRestoreDefaults}
                className="bg-transparent text-[#6D6D5C] hover:text-[#2D2D2A] hover:bg-[#F2ECE4] transition-all py-4 px-6 rounded-full text-xs font-semibold cursor-pointer border border-[#E6E2D3]"
              >
                Restore Classic Demo Data
              </button>
            </div>

            {/* Professional and cleaner space */}
            <div className="pt-8 text-xs text-[#8E8E85] flex justify-center items-center gap-5">
              <span>Secure, Private, and High-Performance Ledger</span>
            </div>

          </motion.div>
        </div>
      ) : (
        
        /* SCREEN 2: MAIN WORKSPACE DASHBOARD (Matching screenshot perfectly) */
        <div className="flex flex-col min-h-screen relative z-10 animate-fade-in">
          
          {/* Dashboard Header Bar */}
          <header className="bg-white/80 backdrop-blur-lg border-b border-[#E6E2D3] px-4 sm:px-10 py-5 sticky top-0 z-30">
            <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setCurrentScreen('landing')}
                  className="w-10 h-10 bg-[#FAF9F5] hover:bg-[#F2ECE4] text-[#8E8E85] hover:text-[#5A5A40] rounded-xl flex items-center justify-center transition-all border border-[#E6E2D3] shadow-sm cursor-pointer"
                  title="Return to Landing sanctuary"
                >
                  🌸
                </button>
                <div>
                  <h1 className="text-2xl font-serif italic text-[#2D2D2A] tracking-tight leading-tight">Oasis Tracker</h1>
                  <p className="text-[10px] uppercase tracking-widest text-[#8E8E85] font-bold mt-0.5">Personal Expense Tracker &bull; {currentMonthName} {currentYear}</p>
                </div>
              </div>

              {/* Status Header Indicator stats bar mimicking the uploaded screenshot overview indicators */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-[#FAF9F5] p-2.5 sm:px-6 rounded-2xl border border-[#E6E2D3]">
                {/* 1 */}
                <div className="text-center px-1 sm:px-2">
                  <p className="text-[8px] uppercase tracking-widest text-[#8E8E85] font-bold">TOTAL BUDGET</p>
                  <p className="text-sm font-semibold text-[#6E6E64]">{formatINR(budgetSettings.totalBudget)}</p>
                </div>
                
                <span className="text-[#E6E2D3] text-sm font-light select-none">|</span>

                {/* 2 */}
                <div className="text-center px-1 sm:px-2">
                  <p className="text-[8px] uppercase tracking-widest text-[#8E8E85] font-bold text-emerald-800">TOTAL INCOME</p>
                  <p className="text-sm font-semibold text-emerald-700">{formatINR(totalIncomesSum)}</p>
                </div>

                <span className="text-[#E6E2D3] text-sm font-light select-none">|</span>

                {/* 3 */}
                <div className="text-center px-1 sm:px-2">
                  <p className="text-[8px] uppercase tracking-widest text-[#8E8E85] font-bold text-[#814C34]">TOTAL EXPENSES</p>
                  <p className="text-sm font-semibold text-[#814C34]">{formatINR(totalSpentSum)}</p>
                </div>

                <span className="text-[#E6E2D3] text-sm font-light select-none">|</span>

                {/* 4 */}
                <div className="text-center px-1 sm:px-2">
                  <p className="text-[8px] uppercase tracking-widest text-[#8E8E85] font-bold">SAVINGS GOAL</p>
                  <p className="text-sm font-semibold text-[#5A5A40]">{formatINR(budgetSettings.savingsGoal)}</p>
                </div>

                <span className="text-[#E6E2D3] text-sm font-light select-none">|</span>

                {/* 5 */}
                <div className="text-center px-1 sm:px-2">
                  <p className="text-[8px] uppercase tracking-widest text-[#8E8E85] font-bold text-[#5A5A40]">TOTAL SAVINGS</p>
                  <p className={`text-sm font-serif italic font-extrabold ${totalSavingsSum >= budgetSettings.savingsGoal ? 'text-emerald-700' : 'text-amber-800'}`}>
                    {formatINR(totalSavingsSum)}
                  </p>
                </div>
              </div>

              {/* Action Buttons Desk */}
              <div className="flex gap-2">
                <button
                  onClick={startEditBudgetSettings}
                  className="bg-white text-[#5A5A40] hover:bg-[#F2ECE4] border border-[#E6E2D3] px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Configure global limits"
                >
                  🔧 Settings
                </button>
                <button
                  onClick={startNewExpense}
                  className="bg-[#5A5A40] text-white hover:bg-[#4A4A35] px-5 py-2.5 rounded-full text-xs font-medium shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record Expense</span>
                </button>
              </div>

            </div>
          </header>

          {/* Core App BENTO Workspace */}
          <main className="max-w-[1400px] w-full mx-auto p-4 sm:p-8 space-y-8 flex-1">
            
            {/* ROW 1: SENSATIONAL SUMMARY BLOCKS MOCKING USER PICTURE */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Income Details Widget (Left Column screenshot mapping) */}
              <div className="bg-white border border-[#E6E2D3] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE4] mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">💵</span>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[#8E8E85]">Income Details</h3>
                    </div>
                    <button 
                      onClick={startNewIncome}
                      className="text-[10px] uppercase font-bold text-[#8A7E5E] hover:text-[#5A5A40] flex items-center gap-1 transition-colors bg-[#FAF9F5] px-2 py-1 rounded border border-[#E6E2D3]/60 cursor-pointer"
                    >
                      <span>+</span> New Income
                    </button>
                  </div>

                  {incomes.length === 0 ? (
                    <p className="text-xs text-[#8E8E85] italic text-center py-6">No active income recorded yet</p>
                  ) : (
                    <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                      {incomes.map((inc) => (
                        <div key={inc.id} className="flex justify-between items-center bg-[#FAF9F5] px-3.5 py-2 rounded-xl text-xs hover:bg-[#F3F2EB]/50 transition-all border border-dashed border-[#E6E2D3]/80 group">
                          <div>
                            <p className="font-semibold text-[#3D3D36]">{inc.title}</p>
                            <p className="text-[10px] text-[#8E8E85]">{inc.date} &bull; <span className="italic">{inc.source}</span></p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-800 font-serif italic">{formatINR(inc.amount)}</span>
                            <button 
                              onClick={() => handleDeleteIncome(inc.id)}
                              className="text-neutral-300 hover:text-red-700 transition-colors opacity-0 group-hover:opacity-100 p-1"
                              title="Delete source"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#F2ECE4] flex justify-between items-center text-xs text-[#8E8E85]">
                  <span>Total Calculated Revenue</span>
                  <span className="font-serif italic text-base font-extrabold text-emerald-800">{formatINR(totalIncomesSum)}</span>
                </div>
              </div>

              {/* Pie Segment / Donut Allocation Diagram (Middle Column diagram mapping) */}
              <div className="bg-white border border-[#E6E2D3] rounded-3xl p-6 shadow-sm flex flex-col items-center justify-between text-center relative overflow-hidden">
                <div className="w-full flex justify-between items-center pb-3 border-b border-[#F2ECE4] mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🍩</span>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#8E8E85]">Visual Shares</h3>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider text-[#8E8E85] font-bold">Category weightage</span>
                </div>

                {totalSpentSum === 0 ? (
                  <div className="py-12 text-center text-xs text-[#8E8E85] italic">
                    Add expenses to visualize the distribution ring
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-2 h-full w-full">
                    {/* SVG Donut Custom Circle */}
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-95" viewBox="0 0 42 42">
                        {/* Underlay tracker */}
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#FAF8F3" strokeWidth="4.5" />
                        
                        {/* Dynamic calculated segments */}
                        {(() => {
                          let accumulatedPercentage = 0;
                          return categoryStats.list.map((item, index) => {
                            if (item.percentage === 0) return null;
                            const percent = item.percentage;
                            const strokeDashArray = `${percent} ${100 - percent}`;
                            const strokeDashOffset = 100 - accumulatedPercentage + 25; // 25 to turn the initial start up
                            accumulatedPercentage += percent;
                            return (
                              <circle
                                key={item.category}
                                cx="21"
                                cy="21"
                                r="15.915"
                                fill="transparent"
                                stroke={CATEGORY_META[item.category].colorHex}
                                strokeWidth="4.5"
                                strokeDasharray={strokeDashArray}
                                strokeDashoffset={strokeDashOffset}
                                className="transition-all duration-500 hover:stroke-amber-900 cursor-pointer"
                                title={`${item.category}: ${Math.round(percent)}%`}
                              />
                            );
                          });
                        })()}
                      </svg>

                      {/* Dynamic Central graphics label mimicking screenshot envelope/moneybag bag */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
                        <span className="text-2xl mt-1 select-none">🥡</span>
                        <p className="text-[10.5px] uppercase tracking-wider text-[#8E8E85] font-extrabold mt-0.5">Spent</p>
                        <p className="text-sm font-serif italic text-[#3D3D36] font-bold leading-none">{formatINR(totalSpentSum)}</p>
                      </div>
                    </div>

                    {/* Compact color indicator bullet tags row */}
                    <div className="flex flex-wrap justify-center gap-2 mt-4 text-[10px]">
                      {categoryStats.list.filter(c => c.amount > 0).map(c => (
                        <span key={c.category} className="inline-flex items-center gap-1 bg-[#FAF9F5] px-2 py-0.5 rounded border border-[#E6E2D3]">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_META[c.category].colorHex }} />
                          <span className="capitalize">{c.category === 'shopping bills' ? 'Bills' : c.category}</span>
                          <span className="text-[#8E8E85]">({Math.round(c.percentage)}%)</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Monthly Calendar Highlight Block (Right Column representation) */}
              <div className="bg-white border border-[#E6E2D3] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE4] mb-3">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-[#8A7E5E]" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#8E8E85]">{currentMonthName} calendar</h3>
                  </div>
                  <span className="text-[10px] text-[#8E8E85] font-bold italic">{currentYear} calendar grid</span>
                </div>

                <div className="text-center font-serif text-sm italic text-[#2D2D2A] mb-2 font-semibold">
                  May 2026 Grid Overview
                </div>

                {/* Grid Calendar element mapped */}
                <div className="space-y-1">
                  {/* Days of week */}
                  <div className="grid grid-cols-7 text-[8.5px] uppercase tracking-wider font-bold text-[#8E8E85] text-center pb-1 border-b border-[#FAF9F5]">
                    <span>S</span>
                    <span>M</span>
                    <span>T</span>
                    <span>W</span>
                    <span>T</span>
                    <span>F</span>
                    <span>S</span>
                  </div>

                  {/* Days numbers */}
                  <div className="grid grid-cols-7 gap-y-1 text-[10.5px] text-center">
                    {calendarDays.map((day, ix) => {
                      if (day === null) {
                        return <span key={`empty-${ix}`} className="py-0.5 text-[#E6E2D3]/40 select-none">-</span>;
                      }

                      const val = dateWiseSpending[day];
                      const hasSpent = val !== undefined && val > 0;

                      return (
                        <div 
                          key={`day-${day}`} 
                          className={`relative py-0.5 rounded-md flex flex-col items-center justify-center font-medium ${
                            hasSpent ? 'bg-[#FAF6EC] border border-[#E6E2D3]/70 font-bold' : ''
                          }`}
                          title={hasSpent ? `Spent on day ${day}: ${formatINR(val)}` : `No records`}
                        >
                          <span className={hasSpent ? 'text-[#5A5A40]' : 'text-[#8E8E85]'}>{day}</span>
                          {hasSpent && (
                            <span 
                              className="w-1.5 h-1.5 rounded-full absolute -top-0.5 -right-0.5" 
                              style={{ 
                                backgroundColor: val > 1500 ? '#8B5A42' : '#C2B280',
                                transform: 'scale(0.8)'
                              }} 
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <p className="text-[8.5px] text-center text-[#8E8E85] mt-3 font-medium flex items-center justify-center gap-1 bg-[#FAF9F5] py-1 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8B5A42] inline-block" /> High Spend days flagged &bull; <span className="w-1.5 h-1.5 rounded-full bg-[#C2B280] inline-block" /> Regular spend
                </p>
              </div>

            </div>

            {/* ROW 2: DETAILED STATS (Budget vs actuals limit breakdown tables segment) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-[#E6E2D3] rounded-3xl p-6 shadow-sm overflow-hidden">
              
              {/* Category-wise Budgets Allocation Status */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex justify-between items-center pb-2.5 border-b border-[#F2ECE4]">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#8E8E85] flex items-center gap-2">
                    <span>📊</span> Monthly Expense Allocations vs Actuals
                  </h3>
                  <span className="text-[10px] text-[#A3A380] font-bold">INR Core Database</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[9.5px] uppercase tracking-wider text-[#8E8E85] border-b border-[#FAF9F5]">
                      <tr>
                        <th className="py-2">Category</th>
                        <th className="py-2 text-right">Budget Allocation</th>
                        <th className="py-2 text-right">Actual Spent</th>
                        <th className="py-2 text-right">Variance Balance</th>
                        <th className="py-2 text-right">Limit Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#FAF9F5]">
                      {budgetBreakdowns.map((bt) => {
                        const style = CATEGORY_META[bt.category];
                        const overspent = bt.difference < 0;
                        const percentageSpent = bt.budgeted > 0 ? (bt.actual / bt.budgeted) * 100 : 0;

                        return (
                          <tr key={bt.category} className="hover:bg-[#FCFBFA] transition-colors">
                            <td className="py-2.5 capitalize font-medium text-[#2D2D2A]">
                              <span className="mr-1.5 text-xs">{style.emoji}</span>
                              {bt.category === 'shopping bills' ? 'Shopping & bills' : bt.category}
                            </td>
                            <td className="py-2.5 text-right font-mono text-[#8E8E85]">{formatINR(bt.budgeted)}</td>
                            <td className="py-2.5 text-right font-semibold font-serif italic text-neutral-800">{formatINR(bt.actual)}</td>
                            <td className={`py-2.5 text-right font-semibold text-[11px] ${overspent ? 'text-rose-600 font-bold' : 'text-emerald-700'}`}>
                              {overspent ? '-' : '+'}{formatINR(Math.abs(bt.difference))}
                            </td>
                            <td className="py-2.5 text-right">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                overspent 
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                  : percentageSpent >= 85 
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                                  : 'bg-[#5A5A40]/10 text-[#5A5A40]'
                              }`}>
                                {overspent ? 'Limit Exceeded' : `${Math.round(percentageSpent)}% Core`}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Real-time Category share progress percentage bars visual screen */}
              <div className="lg:col-span-5 bg-[#FAF9F5] border border-[#E6E2D3] p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-[#8E8E85] font-extrabold mb-3 flex items-center justify-between">
                    <span>⚡ Category Weight Share</span>
                    <span className="font-serif font-light text-[11px]">relative bars</span>
                  </h4>

                  <div className="space-y-4">
                    {categoryStats.list.map((cs) => {
                      const style = CATEGORY_META[cs.category];
                      return (
                        <div key={cs.category} className="space-y-1">
                          <div className="flex justify-between items-center text-[11px] font-medium text-[#6E6E64]">
                            <span className="capitalize">{cs.category === 'shopping bills' ? 'Shopping bills' : cs.category}</span>
                            <span>{Math.round(cs.percentage)}%</span>
                          </div>
                          
                          {/* Colored bar background matching the natural colors selection */}
                          <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-[#E6E2D3]/55">
                            <div 
                              className="h-full rounded-full transition-all duration-700"
                              style={{ 
                                width: `${cs.percentage || 0}%`, 
                                backgroundColor: style.colorHex 
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#E6E2D3] flex items-center justify-between text-xs text-[#8E8E85]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-amber-800 animate-pulse inline-block" />
                    <span>Calculated with logged transactions.</span>
                  </span>
                  <a 
                    href="#ledg" 
                    className="underline text-[#8A7E5E] hover:text-[#5A5A40] text-[10px]"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('ledg')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    View ledger table
                  </a>
                </div>
              </div>

            </div>

            {/* ROW 3: DETAILED SEARCH FILTER MECHANICS & RECENT LIST entries ledger */}
            <div id="ledg" className="space-y-4 pt-4 scroll-mt-24">
              
              {/* Filter Row card */}
              <div className="bg-white border border-[#E6E2D3] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3.5 border-b border-[#F2ECE4] gap-2">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#5A5A40]" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#8E8E85]">Adaptive Ledger Filters</h3>
                  </div>

                  {/* Reset indicators */}
                  {(filterSearch || filterCategory !== 'all' || filterDateFrom || filterDateTo) && (
                    <button 
                      onClick={() => {
                        setFilterCategory('all');
                        setFilterSearch('');
                        setFilterDateFrom('');
                        setFilterDateTo('');
                        triggerToast('Clearing parameters');
                      }}
                      className="text-xs text-[#8A7E5E] hover:text-[#5A5A40] underline font-medium cursor-pointer"
                    >
                      Reset active parameters
                    </button>
                  )}
                </div>

                {/* Direct Filter input elements */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Search Title Phrase */}
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-[#8E8E85] mb-1.5">Partial match title</span>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search className="w-3.5 h-3.5 text-[#8E8E85]" />
                      </span>
                      <input 
                        type="text" 
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        placeholder="Search coffees, rents..." 
                        className="w-full bg-[#FAF9F5] hover:bg-[#F2ECE4]/50 text-xs border border-[#E6E2D3] rounded-xl pl-9 pr-3 py-2 text-[#3D3D36] placeholder-[#8E8E85] outline-none transition-all focus:bg-white focus:ring-1 focus:ring-[#5A5A40]"
                      />
                    </div>
                  </div>

                  {/* Category Type */}
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-[#8E8E85] mb-1.5">Category Segment</span>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full bg-[#FAF9F5] hover:bg-[#F2ECE4]/50 border border-[#E6E2D3] rounded-xl px-3 py-2 text-xs text-[#3D3D36] outline-none transition-all focus:bg-white focus:ring-1 focus:ring-[#5A5A40] cursor-pointer"
                    >
                      <option value="all">💳 All Category Allocations (Any)</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>
                          {CATEGORY_META[cat].emoji} {cat === 'shopping bills' ? 'shopping bills' : cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date range from */}
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-[#8E8E85] mb-1.5">From Date</span>
                    <input 
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                      className="w-full bg-[#FAF9F5] hover:bg-[#F2ECE4]/50 border border-[#E6E2D3] rounded-xl px-3 py-1.5 text-xs text-[#3D3D36] outline-none focus:bg-white focus:ring-1 focus:ring-[#5A5A40]"
                    />
                  </div>

                  {/* Date range to */}
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-[#8E8E85] mb-1.5">To Date</span>
                    <input 
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                      className="w-full bg-[#FAF9F5] hover:bg-[#F2ECE4]/50 border border-[#E6E2D3] rounded-xl px-3 py-1.5 text-xs text-[#3D3D36] outline-none focus:bg-white focus:ring-1 focus:ring-[#5A5A40]"
                    />
                  </div>

                </div>

                {/* Validation Date Range constraint warning */}
                {filterDateFrom && filterDateTo && filterDateFrom > filterDateTo && (
                  <div className="text-[11px] text-[#814C34] bg-[#F2ECE4] border border-[#E6E2D3] px-3.5 py-2 rounded-xl flex items-center gap-1.5 animate-fade-in font-medium">
                    <span>⚠️ Warning Range:</span>
                    <span>The "From" filter date is set after the "To" parameter date. No entries will display until this sequence is re-aligned.</span>
                  </div>
                )}
              </div>

              {/* Expense Ledger Records Table Card */}
              <div className="bg-white border border-[#E6E2D3] rounded-3xl overflow-hidden shadow-sm">
                
                <div className="px-6 py-4.5 bg-[#FAF9F5] border-b border-[#E6E2D3] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📓</span>
                    <span className="text-xs uppercase tracking-widest font-extrabold text-[#8E8E85]">Expense Registry</span>
                  </div>
                  <span className="text-[10.5px] font-mono text-[#8E8E85] bg-white border border-[#E6E2D3] px-2.5 py-0.5 rounded">
                    Active dataset: {filteredExpensesList.length} items matched
                  </span>
                </div>

                {filteredExpensesList.length === 0 ? (
                  <div className="py-20 text-center select-none space-y-4 px-4">
                    <div className="w-14 h-14 bg-[#FAF9F5] border border-[#E6E2D3] rounded-full flex items-center justify-center mx-auto text-xl">
                      🧳
                    </div>
                    <div className="max-w-xs mx-auto space-y-2">
                      <h4 className="font-serif italic text-lg text-[#2D2D2A]">No expenses found</h4>
                      <p className="text-xs text-[#8E8E85] leading-relaxed">
                        No expenses match your constraints. Add a new expense or clear your filters.
                      </p>
                    </div>
                    <div className="pt-2 flex justify-center gap-2.5">
                      <button 
                        onClick={() => {
                          setFilterCategory('all');
                          setFilterSearch('');
                          setFilterDateFrom('');
                          setFilterDateTo('');
                        }}
                        className="bg-[#FAF9F5] text-[#5A5A40] hover:bg-[#F2ECE4] border border-[#E6E2D3] text-xs px-4  py-2 rounded-full font-medium transition-colors cursor-pointer"
                      >
                        Reset filters
                      </button>
                      <button 
                        onClick={startNewExpense}
                        className="bg-[#5A5A40] text-white hover:bg-[#4A4A35] text-xs px-4.5 py-2 rounded-full font-medium shadow-sm transition-colors cursor-pointer"
                      >
                        New Entry Ledger
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-[#FAF9F5]/40 border-b border-[#E6E2D3] text-[9.5px] uppercase tracking-widest font-extrabold text-[#8E8E85]">
                        <tr>
                          <th className="py-4.5 px-6 font-semibold">Calendar Date</th>
                          <th className="py-4.5 px-6 font-semibold">Expense Core Title</th>
                          <th className="py-4.5 px-6 font-semibold">Category Type</th>
                          <th className="py-4.5 px-6 font-semibold">Ledger Remarks / Note Space</th>
                          <th className="py-4.5 px-6 text-right font-semibold">Actual Cost Sum</th>
                          <th className="py-4.5 px-6 text-right font-semibold">Workspace Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F2ECE4]/50">
                        {filteredExpensesList.map((exp) => {
                          const meta = CATEGORY_META[exp.category];
                          
                          // Format nice calendar date visually: May 15, 2026
                          const displayDate = new Date(exp.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          });

                          return (
                            <tr key={exp.id} className="hover:bg-[#FCFBFA] group transition-colors">
                              {/* Date */}
                              <td className="py-4 px-6 whitespace-nowrap text-xs text-[#8E8E85]">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-[#C2B280]" />
                                  <span>{displayDate}</span>
                                </div>
                              </td>

                              {/* Title */}
                              <td className="py-4 px-6">
                                <p className="font-semibold text-sm text-[#2D2D2A] line-clamp-1 max-w-[250px]" title={exp.title}>
                                  {exp.title}
                                </p>
                              </td>

                              {/* Category badge */}
                              <td className="py-4 px-6 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 ${meta.bg} ${meta.text} text-[10px] uppercase tracking-wider rounded-full font-extrabold border border-[#E6E2D3]/30`}>
                                  <span>{meta.emoji}</span>
                                  <span>{exp.category === 'shopping bills' ? 'shopping bills' : exp.category}</span>
                                </span>
                              </td>

                              {/* Note/Optional Description */}
                              <td className="py-4 px-6">
                                <p className="text-xs text-[#8E8E85] italic truncate max-w-[190px]" title={exp.note || 'None'}>
                                  {exp.note ? exp.note : <span className="text-neutral-200">...</span>}
                                </p>
                              </td>

                              {/* Amount INR */}
                              <td className="py-4 px-6 text-right whitespace-nowrap">
                                <span className="font-serif italic text-[#3D3D35] font-extrabold text-[#2C2C28] text-[15px]">
                                  {formatINR(exp.amount)}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="py-4 px-6 text-right whitespace-nowrap">
                                <div className="inline-flex justify-end gap-1 relative opacity-75 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => startEditExpense(exp)}
                                    className="p-1.5 text-[#8E8E85] hover:text-[#5A5A40] hover:bg-[#FAF9F5] rounded-full transition-all"
                                    title="Edit entry"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteExpense(exp.id, exp.title)}
                                    className="p-1.5 text-neutral-300 hover:text-red-700 hover:bg-red-50 rounded-full transition-all"
                                    title="Delete entry"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Simulated file table page footer limits */}
                <div className="bg-[#FAF9F5] border-t border-[#E6E2D3] py-4 px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8E8E85] gap-2 select-none">
                  <span>
                    Showing {filteredExpensesList.length} expenses inside your tracker
                  </span>
                  
                  <div className="flex gap-4">
                    <span>Sorted by date (most recent first)</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Sample data reset option */}
            <div className="text-center py-4 text-[#8E8E85] space-y-2 select-none">
              <div className="flex justify-center gap-4 text-[11px]">
                <button 
                  onClick={handleRequestRestoreDefaults}
                  className="bg-transparent text-[#8A7E5E] underline hover:text-[#5A5A40]/90 transition-all font-medium cursor-pointer"
                >
                  🔄 Reset to sample transactions
                </button>
              </div>
            </div>

          </main>

          {/* Core App footer info */}
          <footer className="bg-white border-t border-[#E6E2D3] py-8 text-center text-xs text-[#8E8E85]">
            <p className="font-serif italic text-sm text-[#4A4A35]">Oasis Expense Tracker</p>
            <p className="mt-1">A beautifully designed way to align your daily spending</p>
          </footer>

        </div>
      )}


      {/* MODAL 1: ADD/EDIT EXPENSE */}
      {expenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#3D3D36]/40 backdrop-blur-sm"
            onClick={() => setExpenseModalOpen(false)}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[#FDFCF7] border border-[#E6E2D3] rounded-3xl w-full max-w-lg p-7 relative z-10 text-[#3D3D36] shadow-2xl overflow-hidden"
          >
            {/* Top design header */}
            <div className="flex justify-between items-center pb-4 border-b border-[#E6E2D3]/60 mb-5">
              <h3 className="text-lg font-serif italic text-[#2D2D2A] flex items-center gap-2">
                <span>🍀</span>
                <span>{activeExpenseEdit ? 'Modify Expense Entry' : 'Record Fresh Expense'}</span>
              </h3>
              <button 
                onClick={() => setExpenseModalOpen(false)}
                className="text-neutral-500 hover:text-black p-1 bg-[#FAF9F5] border rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-[10.5px] uppercase tracking-widest font-extrabold text-[#5A5A40] mb-1.5">
                  Expense Name label *
                </label>
                <input 
                  type="text" 
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="e.g. Weekly organic Groceries at Nature Basket"
                  required
                  className="w-full bg-[#FAF9F5] border border-[#E6E2D3] rounded-xl px-4 py-2.5 text-xs text-[#3D3D36] placeholder-[#8E8E85] focus:bg-white focus:ring-1 focus:ring-[#5A5A40] outline-none transition-all"
                />
              </div>

              {/* Amount & Date split row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10.5px] uppercase tracking-widest font-extrabold text-[#5A5A40] mb-1.5">
                    Amount (in INR) *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-serif font-extrabold italic text-[#8E8E85]">
                      ₹
                    </span>
                    <input 
                      type="number" 
                      step="any"
                      min="1"
                      placeholder="450"
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                      required
                      className="w-full bg-[#FAF9F5] border border-[#E6E2D3] pl-8 pr-4 py-2.5 text-xs text-[#3D3D36] placeholder-[#8E8E85] focus:bg-white focus:ring-1 focus:ring-[#5A5A40] outline-none transition-all font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10.5px] uppercase tracking-widest font-extrabold text-[#5A5A40] mb-1.5">
                    Calendar Date *
                  </label>
                  <input 
                    type="date" 
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    required
                    className="w-full bg-[#FAF9F5] border border-[#E6E2D3] rounded-xl px-4 py-2.5 text-xs text-[#3D3D36] focus:bg-white focus:ring-1 focus:ring-[#5A5A40] outline-none transition-all"
                  />
                </div>
              </div>

              {/* Category Segment Selection */}
              <div>
                <label className="block text-[10.5px] uppercase tracking-widest font-extrabold text-[#5A5A40] mb-1.5">
                  Category Segment Allocations
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map(category => {
                    const active = expCategory === category;
                    const meta = CATEGORY_META[category];
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setExpCategory(category)}
                        className={`flex items-center gap-1.5 p-2 rounded-xl text-left text-xs capitalize transition-all border outline-none cursor-pointer ${
                          active 
                            ? `${meta.bg} ${meta.text} border-amber-900 ring-1 ring-amber-900 font-extrabold` 
                            : 'bg-white hover:bg-neutral-50 text-[#8E8E85] border-[#E6E2D3]'
                        }`}
                      >
                        <span className="text-sm">{meta.emoji}</span>
                        <span className="truncate">{category === 'shopping bills' ? 'bills' : category}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Note Option Description */}
              <div>
                <label className="block text-[10.5px] uppercase tracking-widest font-extrabold text-[#5A5A40] mb-1.5">
                  Private Description Note (Optional)
                </label>
                <textarea 
                  rows={3}
                  value={expNote}
                  onChange={(e) => setExpNote(e.target.value)}
                  placeholder="Additional remarks such as receipt details, precise location, category specifications..."
                  className="w-full bg-[#FAF9F5] border border-[#E6E2D3] rounded-xl px-4 py-2.5 text-xs text-[#3D3D36] placeholder-[#8E8E85] focus:bg-white focus:ring-1 focus:ring-[#5A5A40] outline-none transition-all resize-none font-medium"
                />
              </div>

              {/* Actions row footer */}
              <div className="pt-4 border-t border-[#E6E2D3]/60 flex justify-end gap-2 text-xs">
                <button 
                  type="button"
                  onClick={() => setExpenseModalOpen(false)}
                  className="bg-transparent border border-[#E6E2D3] text-[#8E8E85] hover:bg-neutral-100 py-2.5 px-5 rounded-full font-medium transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-[#5A5A40] text-white hover:bg-[#4A4A35] py-2.5 px-6 rounded-full font-medium transition-all shadow-md active:scale-95"
                >
                  Confirm Entry
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 2: ADD INCOME SOURCE */}
      {incomeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#3D3D36]/40 backdrop-blur-sm"
            onClick={() => setIncomeModalOpen(false)}
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#FDFCF7] border border-[#E6E2D3] rounded-3xl w-full max-w-md p-7 relative z-10 text-[#3D3D36] shadow-2xl"
          >
            <div className="flex justify-between items-center pb-3 border-b border-[#E6E2D3] mb-4">
              <h3 className="text-lg font-serif italic text-[#2D2D2A] flex items-center gap-1.5">
                <span>💰</span>
                <span>Record Revenue Source</span>
              </h3>
              <button 
                onClick={() => setIncomeModalOpen(false)}
                className="text-neutral-500 hover:text-black p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveIncome} className="space-y-4">
              
              <div>
                <label className="block text-[10.5px] uppercase tracking-widest font-extrabold text-[#5A5A40] mb-1.5">
                  Income Description Name *
                </label>
                <input 
                  type="text" 
                  value={incTitle}
                  onChange={(e) => setIncTitle(e.target.value)}
                  placeholder="e.g. Freelance Consulting Project"
                  required
                  className="w-full bg-[#FAF9F5] border border-[#E6E2D3] rounded-xl px-4 py-2 text-xs focus:bg-white focus:ring-1 focus:ring-[#5A5A40] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10.5px] uppercase tracking-widest font-extrabold text-[#5A5A40] mb-1.5">
                  Amount Allocation (in INR) *
                </label>
                <input 
                  type="number" 
                  value={incAmount}
                  onChange={(e) => setIncAmount(e.target.value)}
                  placeholder="25000"
                  required
                  className="w-full bg-[#FAF9F5] border border-[#E6E2D3] rounded-xl px-4 py-2 text-xs focus:bg-white focus:ring-1 focus:ring-[#5A5A40] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10.5px] uppercase tracking-widest font-extrabold text-[#5A5A40] mb-1.5">
                    Income Source type
                  </label>
                  <select
                    value={incSource}
                    onChange={(e) => setIncSource(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-[#E6E2D3] rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="Salary">Salary Core</option>
                    <option value="Freelance">Freelance Skill</option>
                    <option value="Investments">Investments Dev</option>
                    <option value="Gifts">Gifts / Bonus</option>
                    <option value="Other">Other Revenue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10.5px] uppercase tracking-widest font-extrabold text-[#5A5A40] mb-1.5">
                    Date Received
                  </label>
                  <input 
                    type="date" 
                    value={incDate}
                    onChange={(e) => setIncDate(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-[#E6E2D3] rounded-xl px-3 py-1.5 text-xs text-[#3D3D36]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E6E2D3] flex justify-end gap-2 text-xs">
                <button 
                  type="button" 
                  onClick={() => setIncomeModalOpen(false)}
                  className="bg-transparent border border-[#E6E2D3] hover:bg-neutral-50 px-4 py-2 rounded-full font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-[#5A5A40] text-white hover:bg-[#4A4A35] px-5 py-2 rounded-full font-medium text-xs"
                >
                  Record Revenue
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 3: CONFIGURE GLOBAL SETTINGS (Limit controls) */}
      {budgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#3D3D36]/40 backdrop-blur-sm"
            onClick={() => setBudgetModalOpen(false)}
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#FDFCF7] border border-[#E6E2D3] rounded-3xl w-full max-w-md p-7 relative z-10 text-[#3D3D36] shadow-2xl"
          >
            <div className="flex justify-between items-center pb-3 border-b border-[#E6E2D3] mb-4">
              <h3 className="text-lg font-serif italic text-[#2D2D2A] flex items-center gap-1.5">
                <span>🔧</span>
                <span>Configure Sanctuary Goals</span>
              </h3>
              <button 
                onClick={() => setBudgetModalOpen(false)}
                className="text-neutral-500 hover:text-black p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudgetSettings} className="space-y-4">
              
              <div>
                <label className="block text-[10.5px] uppercase tracking-widest font-extrabold text-[#5A5A40] mb-1.5">
                  Configured Monthly Limit (in INR) *
                </label>
                <input 
                  type="number" 
                  value={budTotal}
                  onChange={(e) => setBudTotal(e.target.value)}
                  placeholder="60000"
                  required
                  className="w-full bg-[#FAF9F5] border border-[#E6E2D3] rounded-xl px-4 py-2 text-xs focus:bg-white focus:ring-1 focus:ring-[#5A5A40] outline-none"
                />
                <p className="text-[10px] text-[#8E8E85] mt-1">This sets the global limit allocation tracker on your workspace header.</p>
              </div>

              <div>
                <label className="block text-[10.5px] uppercase tracking-widest font-extrabold text-[#5A5A40] mb-1.5">
                  Target Savings Goal Limit (in INR) *
                </label>
                <input 
                  type="number" 
                  value={budSavingsGoal}
                  onChange={(e) => setBudSavingsGoal(e.target.value)}
                  placeholder="15000"
                  required
                  className="w-full bg-[#FAF9F5] border border-[#E6E2D3] rounded-xl px-4 py-2 text-xs focus:bg-white focus:ring-1 focus:ring-[#5A5A40] outline-none"
                />
                <p className="text-[10px] text-[#8E8E85] mt-1">Target savings goal that tracks your income vs actual monthly spent variance.</p>
              </div>

              <div className="pt-4 border-t border-[#E6E2D3] flex justify-end gap-2 text-xs">
                <button 
                  type="button" 
                  onClick={() => setBudgetModalOpen(false)}
                  className="bg-transparent border border-[#E6E2D3] hover:bg-neutral-50 px-4 py-2 rounded-full font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-[#5A5A40] text-white hover:bg-[#4A4A35] px-5 py-2 rounded-full font-medium text-xs"
                >
                  Apply Settings
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
