import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense'
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  useEffect(() => {
    // Fetch transactions (this would be an API call in production)
    // For demo, we'll use sample data
    const sampleTransactions = [
      { id: 1, amount: 1200, category: 'Salary', description: 'Monthly salary', date: '2025-03-01', type: 'income' },
      { id: 2, amount: 500, category: 'Rent', description: 'March rent', date: '2025-03-05', type: 'expense' },
      { id: 3, amount: 120, category: 'Groceries', description: 'Weekly groceries', date: '2025-03-10', type: 'expense' },
      { id: 4, amount: 80, category: 'Utilities', description: 'Electricity bill', date: '2025-03-15', type: 'expense' },
      { id: 5, amount: 200, category: 'Entertainment', description: 'Concert tickets', date: '2025-03-18', type: 'expense' },
      { id: 6, amount: 50, category: 'Dining', description: 'Restaurant dinner', date: '2025-03-19', type: 'expense' }
    ];

    setTransactions(sampleTransactions);

    // Process data for charts
    processMonthlyData(sampleTransactions);
    processCategoryData(sampleTransactions);
  }, []);

  const processMonthlyData = (data) => {
    const monthlyIncome = {};
    const monthlyExpense = {};

    data.forEach(transaction => {
      const month = transaction.date.substring(0, 7); // YYYY-MM format
      if (transaction.type === 'income') {
        monthlyIncome[month] = (monthlyIncome[month] || 0) + transaction.amount;
      } else {
        monthlyExpense[month] = (monthlyExpense[month] || 0) + transaction.amount;
      }
    });

    const months = [...new Set([...Object.keys(monthlyIncome), ...Object.keys(monthlyExpense)])].sort();

    const chartData = months.map(month => ({
      month,
      income: monthlyIncome[month] || 0,
      expense: monthlyExpense[month] || 0,
      balance: (monthlyIncome[month] || 0) - (monthlyExpense[month] || 0)
    }));

    setMonthlyData(chartData);
  };

  const processCategoryData = (data) => {
    const categories = {};

    data.filter(t => t.type === 'expense').forEach(transaction => {
      categories[transaction.category] = (categories[transaction.category] || 0) + transaction.amount;
    });

    const chartData = Object.keys(categories).map(category => ({
      category,
      amount: categories[category]
    }));

    setCategoryData(chartData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTransaction(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate input
    if (!newTransaction.amount || !newTransaction.category || !newTransaction.date) {
      alert('Please fill in all required fields');
      return;
    }

    const transaction = {
      ...newTransaction,
      id: transactions.length + 1,
      amount: parseFloat(newTransaction.amount)
    };

    // Add new transaction to state
    const updatedTransactions = [...transactions, transaction];
    setTransactions(updatedTransactions);

    // Update charts
    processMonthlyData(updatedTransactions);
    processCategoryData(updatedTransactions);

    // Clear form
    setNewTransaction({
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      type: 'expense'
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Personal Finance Tracker</h1>

      {/* Transaction Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={newTransaction.amount}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Category</label>
                <input
                  type="text"
                  name="category"
                  value={newTransaction.category}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Description</label>
                <input
                  type="text"
                  name="description"
                  value={newTransaction.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={newTransaction.date}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Type</label>
                <select
                  name="type"
                  value={newTransaction.type}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Add Transaction
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#4CAF50" />
                <Line type="monotone" dataKey="expense" stroke="#F44336" />
                <Line type="monotone" dataKey="balance" stroke="#2196F3" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Category</th>
                  <th className="p-2 text-left">Description</th>
                  <th className="p-2 text-right">Amount</th>
                  <th className="p-2 text-center">Type</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(transaction => (
                  <tr key={transaction.id} className="border-b">
                    <td className="p-2">{transaction.date}</td>
                    <td className="p-2">{transaction.category}</td>
                    <td className="p-2">{transaction.description}</td>
                    <td className="p-2 text-right">${transaction.amount.toFixed(2)}</td>
                    <td className="p-2 text-center">
                      <span className={`inline-block px-2 py-1 rounded text-xs ${transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {transaction.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
