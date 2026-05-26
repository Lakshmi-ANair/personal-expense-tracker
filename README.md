# Oasis Tracker

Oasis Tracker is a beautifully designed, highly polished **Personal Expense Tracker** built to help you align your spendings and simplify your finances. It features a responsive, calming aesthetic layout using soft organic shades, subtle shadows, and crisp sans-serif/serif/mono typography.

All entered transactions (expenses, incomes, and custom budget limits) are synchronized and preserved within a structured, native `db.json` database file in the project's root folder, enabling persistent state storage.

---

## 🎨 Design Philosophy & Features

Oasis Tracker was built with simplicity, ease of use, and visual harmony in mind. It separates itself from noisy dashboards with its clean user interface, spacious alignment, and functional clarity:

* **Fluid Dual-Screen Journey**: Start with a warm, minimalist landing page and enter your ledger workspace seamlessly with transition animations.
* **Persistent Stored Ledger**: Your data is not stored in ephemeral browser cache. All updates are handled directly on the Express server and written to the `db.json` database block.
* **Complete Expense Lifecycle (CRUD)**: Easily record, edit, and remove transactions. Each expense contains a short descriptive title, numeric amount in INR, category tagging, a date selector, and longer narrative notes.
* **Smart Categorization**: Organizes expenses across 5 clean categories:
  * 🍲 **Food**
  * 🚗 **Transport**
  * 🧾 **Shopping & Bills**
  * 🍿 **Entertainment**
  * 📦 **Others**
* **Instant Interactive Filters**: Filter hundreds of expenses in real-time by category, customized date range boundaries (*From* and *To* dates with validation checks), and partial text matching on titles or notes.
* **Monthly Summaries**: View your financial status at a glance:
  * Total Spent vs. Total Earned vs. Monthly Savings
  * Circular progress ring highlighting expense proportions
  * Comparison grid displaying actual expense figures vs. targeted budget allocations
  * Spending calendar grid overlay pointing out high-spending landmarks

---

## 🛠️ Structure & Technology Stack

The application uses a full-stack architecture that combines the swift bundling of Vite/React with a lightweight and robust Express backend.

* **Frontend**:
  * [React](https://react.dev) with [TypeScript](https://www.typescriptlang.org)
  * [Tailwind CSS](https://tailwindcss.com) for layout, color theory, and responsive margins
  * [Motion](https://motion.dev) for page transitions and micro-interactions
  * [Lucide React](https://lucide.dev) for standard wireframe vector icons
* **Backend**:
  * [Node.js](https://nodejs.org) and [Express](https://expressjs.com) custom server handling REST API endpoints
  * Standard JSON storage directly in `/db.json`
  * [esbuild](https://esbuild.github.io) for production bundling of the backend into a compact target file

---

## 🚀 Getting Started & Local Hosting

To run and host **Oasis Tracker** on your local machine (offline or inside your home network) and publish it to your GitHub profile, follow the instructions below.

### 🌐 Where & How to Host Locally
When you host this locally, the application runs on your personal computer (as a local server) and uses your machine's filesystem to securely write and update your transactions inside the `db.json` file. 

This means:
1. **Your data remains offline and private** to your machine.
2. Other devices on your local home Wi-Fi network can also access your tracker if you share your computer's local IP address (e.g., `http://192.168.x.x:3000`).

---

### Step-by-step Setup Guide

#### 1. Install Node.js
Oasis Tracker runs on Node.js. If you don't have it installed yet:
* Go to [nodejs.org](https://nodejs.org/) and download the **LTS (Long Term Support)** version.
* Install it on your system (this automatically installs both `node` and `npm`).

#### 2. Get the Code
Download your exported ZIP file from the AI Studio workspace, extract it to a folder, and open your command prompt/terminal inside that directory.

#### 3. Install NPM Packages
To configure the necessary environment, run the following command to download all dependencies:
```bash
npm install
```

#### 4. Run the Local Host Server (Development Mode)
To boot-up the Express server and compile the React interface simultaneously, run:
```bash
npm run dev
```
* **Address**: Open your browser and go to **`http://localhost:3000`**
* Changes you make in the UI will instantly persist to the newly generated `db.json` file in your root folder.

#### 5. Compile and Start and Run in Production Mode (Highly Recommended)
If you want the fastest, light-weight version of the app to run continuously:
```bash
# Compile and build both client and server
npm run build

# Start the optimized fast production server
npm start
```
Go to **`http://localhost:3000`** in your browser.

---

## 🐙 Publishing to GitHub

To store your code in GitHub and track modifications, use the following commands or upload manually:

### Option A: Via Git Terminal (Recommended)
1. Initialize a new local Git repository:
   ```bash
   git init
   ```
2. Add all files to the repository tracking list:
   ```bash
   git add .
   ```
3. Commit the progress:
   ```bash
   git commit -m "Initial commit of Oasis Tracker with offline local JSON database"
   ```
4. Create a new empty repository on your [GitHub Dashboard](https://github.com/new). Do not check "Add a README" or ".gitignore" since those are already in this folder.
5. Link your local directory to your newly created GitHub repository and push your elements online:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
   git push -u origin main
   ```

*Note: The actual active storage file `db.json` is not excluded in `.gitignore` by default so your current database records can act as templates, but you can add it to `.gitignore` if you'd prefer to keep your personal transactions confidential.*

---

## 📁 Repository Structure
```text
├── db.json            # Permanent state snapshot file (created automatically)
├── server.ts          # Express.js REST server endpoints & db.json writing operations
├── package.json       # Dependencies, build parameters, and run scripts
├── tsconfig.json      # TypeScript compiler specifications
├── vite.config.ts     # Bundler options
├── src/
│   ├── main.tsx       # Core React UI client bootstrap
│   ├── index.css      # Imported Google fonts & custom Tailwind parameters
│   └── App.tsx        # High-Fidelity Views, Modals, State Sync, and Calculations
```

---

## 📝 Stored Schema Details

The application stores data in the following clean, readable format within `db.json`:

```json
{
  "expenses": [
    {
      "id": "1716712398293",
      "title": "Coffee at Starbucks",
      "amount": 450,
      "category": "food",
      "date": "2026-05-26",
      "note": "Regular espresso run"
    }
  ],
  "incomes": [
    {
      "id": "i1",
      "title": "Monthly Salary Core",
      "amount": 62000,
      "date": "2026-05-16",
      "source": "Salary"
    }
  ],
  "budgetSettings": {
    "totalBudget": 60000,
    "savingsGoal": 15000
  }
}
```

---

## 🛡️ License
Oasis Tracker is open source software. Feel free to clone, modify, and build upon it to customize your financial tracking experience.
