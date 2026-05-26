import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

// Establish db.json folder and initial values safely
function initializeDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    const today = new Date();
    const makeYMD = (daysAgo: number) => {
      const d = new Date();
      d.setDate(today.getDate() - daysAgo);
      return d.toISOString().split("T")[0];
    };

    const initialData = {
      expenses: [
        {
          id: "1",
          title: "Coffee at Starbucks",
          amount: 450,
          category: "food",
          date: makeYMD(0),
          note: "Regular espresso run"
        },
        {
          id: "2",
          title: "Weekly Groceries",
          amount: 3200,
          category: "food",
          date: makeYMD(1),
          note: "Purchased milk, cheese, and organic veggies"
        },
        {
          id: "3",
          title: "Uber to Office",
          amount: 1150,
          category: "transport",
          date: makeYMD(2),
          note: "Regional business commute"
        },
        {
          id: "4",
          title: "Broadband Wifi Bills",
          amount: 1599,
          category: "shopping bills",
          date: makeYMD(4),
          note: "High-speed optic fiber subscription"
        },
        {
          id: "5",
          title: "Netflix Streaming Subscription",
          amount: 649,
          category: "entertainment",
          date: makeYMD(6),
          note: "Monthly Premium UHD subscription"
        },
        {
          id: "6",
          title: "Houseplants Care Potting Mix",
          amount: 800,
          category: "others",
          date: makeYMD(8),
          note: "Terracotta containers and premium organic compost"
        }
      ],
      incomes: [
        { id: "i1", title: "Monthly Salary Core", amount: 62000, date: makeYMD(10), source: "Salary" },
        { id: "i2", title: "Freelance UI Project", amount: 15000, date: makeYMD(5), source: "Freelance" }
      ],
      budgetSettings: {
        totalBudget: 60000,
        savingsGoal: 15000
      }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf8");
    console.log("Initialized database JSON record neatly at:", DB_FILE);
  }
}

initializeDatabase();

// Middleware to parse incoming request payloads
app.use(express.json());

// Load database helper
function readDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const dat = fs.readFileSync(DB_FILE, "utf8");
      return JSON.parse(dat);
    }
  } catch (err) {
    console.error("Error reading db file, returning fallback object", err);
  }
  return { expenses: [], incomes: [], budgetSettings: { totalBudget: 60000, savingsGoal: 15000 } };
}

// Write database helper
function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Error writing database state", err);
    return false;
  }
}

// ------------- BACKEND API ROUTES --------------

// GET full state
app.get("/api/state", (req, res) => {
  const db = readDB();
  res.json(db);
});

// GET query expenses
app.get("/api/expenses", (req, res) => {
  const db = readDB();
  res.json(db.expenses || []);
});

// POST append new expense
app.post("/api/expenses", (req, res) => {
  const db = readDB();
  const newExp = {
    id: Date.now().toString(),
    title: req.body.title || "Untitled",
    amount: Number(req.body.amount) || 0,
    category: req.body.category || "others",
    date: req.body.date || new Date().toISOString().split("T")[0],
    note: req.body.note || ""
  };
  
  db.expenses = [newExp, ...(db.expenses || [])];
  writeDB(db);
  res.status(201).json(newExp);
});

// PUT modify existing expense
app.put("/api/expenses/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = (db.expenses || []).findIndex((e: any) => e.id === id);
  
  if (index !== -1) {
    db.expenses[index] = {
      ...db.expenses[index],
      title: req.body.title || db.expenses[index].title,
      amount: Number(req.body.amount) ?? db.expenses[index].amount,
      category: req.body.category || db.expenses[index].category,
      date: req.body.date || db.expenses[index].date,
      note: req.body.note !== undefined ? req.body.note : db.expenses[index].note
    };
    writeDB(db);
    res.json(db.expenses[index]);
  } else {
    res.status(404).json({ error: "Expense not discovered in JSON" });
  }
});

// DELETE remove expense
app.delete("/api/expenses/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const initialCount = db.expenses?.length || 0;
  db.expenses = (db.expenses || []).filter((e: any) => e.id !== id);
  
  if (db.expenses.length < initialCount) {
    writeDB(db);
    res.json({ success: true, message: "Removed neatly from JSON database" });
  } else {
    res.status(404).json({ error: "Expense entry not found" });
  }
});

// GET incomes
app.get("/api/incomes", (req, res) => {
  const db = readDB();
  res.json(db.incomes || []);
});

// POST new income
app.post("/api/incomes", (req, res) => {
  const db = readDB();
  const newInc = {
    id: Date.now().toString(),
    title: req.body.title || "Untitled Income",
    amount: Number(req.body.amount) || 0,
    date: req.body.date || new Date().toISOString().split("T")[0],
    source: req.body.source || "Other"
  };
  db.incomes = [newInc, ...(db.incomes || [])];
  writeDB(db);
  res.status(201).json(newInc);
});

// DELETE income
app.delete("/api/incomes/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.incomes = (db.incomes || []).filter((i: any) => i.id !== id);
  writeDB(db);
  res.json({ success: true });
});

// PUT update budget configuration settings
app.put("/api/budgetSettings", (req, res) => {
  const db = readDB();
  db.budgetSettings = {
    totalBudget: Number(req.body.totalBudget) || db.budgetSettings?.totalBudget || 60000,
    savingsGoal: Number(req.body.savingsGoal) || db.budgetSettings?.savingsGoal || 15000
  };
  writeDB(db);
  res.json(db.budgetSettings);
});


// ---------------- INTEGRATE FRONTEND OR VITE MIDDLEWARE ----------------

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Oasis Finance Server successfully launched on http://localhost:${PORT}`);
  });
}

start();
