import React, { useState, useEffect } from 'react';
import './home.css';

const Home = () => {
    // API Configuration
    const API_BASE_URL = 'http://localhost:3333/api';
    const API_ENDPOINTS = {
        transactions: `${API_BASE_URL}/transactions`,
        summary: `${API_BASE_URL}/transactions/summary`,
        monthly: `${API_BASE_URL}/transactions/monthly`,
        categories: `${API_BASE_URL}/transactions/categories`
    };

    // State
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [currentFilter, setCurrentFilter] = useState('all');
    const [transactionType, setTransactionType] = useState('income');
    const [categories, setCategories] = useState({
        income: [],
        expense: []
    });
    const [summary, setSummary] = useState({
        totalBalance: 0,
        totalIncome: 0,
        totalExpense: 0,
        monthIncome: 0,
        monthExpense: 0,
        monthBalance: 0,
        expenseRatio: 0
    });
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState({
        show: false,
        message: '',
        type: 'success'
    });

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };


    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        }

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Show toast notification
    const showToast = (message, type = 'success') => {
        setToast({
            show: true,
            message,
            type
        });

        setTimeout(() => {
            setToast(prev => ({ ...prev, show: false }));
        }, 3000);
    };

    // API Functions
    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const response = await fetch(API_ENDPOINTS.transactions, {
                method: "GET",
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                setTransactions(data.data || []);
                filterTransactions(data.data || [], currentFilter);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
            setError('Failed to load transactions. Please check if the backend is running.');
            showToast('Failed to load transactions', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.summary, {
                method: "GET",
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                setSummary(data);
            }
        } catch (error) {
            console.error('Error fetching summary:', error);
            showToast('Failed to load summary', 'error');
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.categories, {
                method: "GET",
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                setCategories(data.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            showToast('Failed to load categories', 'error');
        }
    };

    const addTransactionAPI = async (transactionData) => {
        try {
            const response = await fetch(API_ENDPOINTS.transactions, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transactionData),
                credentials: "include",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to add transaction');
            }
            fetchTransactions()
            return data;
        } catch (error) {
            console.error('Error adding transaction:', error);
            throw error;
        }
    };

    const updateTransactionAPI = async (id, transactionData) => {
        try {
            const response = await fetch(`${API_ENDPOINTS.transactions}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transactionData),
                credentials: "include",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update transaction');
            }
            fetchTransactions()
            return data;
        } catch (error) {
            console.error('Error updating transaction:', error);
            throw error;
        }
    };

    const deleteTransactionAPI = async (id) => {
        try {
            const response = await fetch(`${API_ENDPOINTS.transactions}/${id}`, {
                method: 'DELETE',
                credentials: "include",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete transaction');
            }
            fetchTransactions()
            return data;
        } catch (error) {
            console.error('Error deleting transaction:', error);
            throw error;
        }
    };

    // Filter transactions
    const filterTransactions = (transactionsList, filter) => {
        if (filter === 'all') {
            setFilteredTransactions(transactionsList);
        } else {
            const filtered = transactionsList.filter(transaction => transaction.type === filter);
            setFilteredTransactions(filtered);
        }
    };

    // Handle filter change
    const handleFilterChange = (filter) => {
        setCurrentFilter(filter);
        filterTransactions(transactions, filter);
    };

    // Handle transaction type toggle
    const handleTransactionTypeToggle = (type) => {
        setTransactionType(type);
        setFormData(prev => ({ ...prev, category: '' }));
    };

    // Handle form input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        const { title, amount, category, date } = formData;

        if (!title || !amount || !category || !date) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        const transactionData = {
            title,
            amount: parseFloat(amount),
            type: transactionType,
            category,
            date
        };

        try {
            if (isEditing) {
                // Update existing transaction
                await updateTransactionAPI(editingId, transactionData);
                showToast('Transaction updated successfully!');

                // Reset editing state
                setIsEditing(false);
                setEditingId(null);
            } else {
                // Add new transaction
                const result = await addTransactionAPI(transactionData);

                // Add to local state
                const newTransaction = result.data;
                const updatedTransactions = [newTransaction, ...transactions];
                setTransactions(updatedTransactions);
                filterTransactions(updatedTransactions, currentFilter);

                showToast(`${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} added successfully!`);
            }

            // Refresh data
            await fetchSummary();

            // Reset form
            setFormData({
                title: '',
                amount: '',
                category: '',
                date: new Date().toISOString().split('T')[0]
            });
        } catch (error) {
            showToast(error.message || 'Failed to save transaction', 'error');
        }
    };

    // Handle edit transaction
    const handleEditTransaction = (transaction) => {
        setFormData({
            title: transaction.title,
            amount: transaction.amount.toString(),
            category: transaction.category,
            date: transaction.date.split('T')[0]
        });
        setTransactionType(transaction.type);
        setIsEditing(true);
        setEditingId(transaction._id);
        showToast('Editing transaction...', 'warning');
    };

    // Handle delete transaction
    const handleDeleteTransaction = async (id, title) => {
        if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
            try {
                await deleteTransactionAPI(id);

                // Remove from local state
                const updatedTransactions = transactions.filter(t => t._id !== id);
                setTransactions(updatedTransactions);
                filterTransactions(updatedTransactions, currentFilter);

                // Refresh summary
                await fetchSummary();

                showToast('Transaction deleted successfully!');
            } catch (error) {
                showToast(error.message || 'Failed to delete transaction', 'error');
            }
        }
    };

    // Reset form
    const handleResetForm = () => {
        setFormData({
            title: '',
            amount: '',
            category: '',
            date: new Date().toISOString().split('T')[0]
        });
        setIsEditing(false);
        setEditingId(null);
        setTransactionType('income');
    };

    // Initialize data
    const initializeData = async () => {
        await Promise.all([
            fetchTransactions(),
            fetchSummary(),
            fetchCategories()
        ]);
    };

    // Initialize on component mount
    useEffect(() => {
        initializeData();
    }, []);

    // Update categories when transaction type changes
    useEffect(() => {
        if (categories[transactionType]) {
            setFormData(prev => ({
                ...prev,
                category: prev.category || ''
            }));
        }
    }, [transactionType, categories]);

    // Handle retry
    const handleRetry = () => {
        setError(null);
        initializeData();
    };

    return (
        <div className="container">

            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Roboto:wght@300;400;500&display=swap" rel="stylesheet"></link>

            {/* Summary Cards */}
            <div className="summary-cards">
                <div className="card balance-card animate-slide-up">
                    <div className="card-icon">
                        <i className="fas fa-wallet"></i>
                    </div>
                    <div className="card-content">
                        <h3>Total Balance</h3>
                        <p className={`amount ${summary.totalBalance >= 0 ? 'positive' : 'negative'}`}>
                            {formatCurrency(summary.totalBalance)}
                        </p>
                    </div>
                    <div className="card-wave"></div>
                </div>

                <div className="card income-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="card-icon">
                        <i className="fas fa-arrow-up"></i>
                    </div>
                    <div className="card-content">
                        <h3>Income</h3>
                        <p className="amount positive">{formatCurrency(summary.totalIncome)}</p>
                    </div>
                    <div className="card-wave"></div>
                </div>

                <div className="card expense-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <div className="card-icon">
                        <i className="fas fa-arrow-down"></i>
                    </div>
                    <div className="card-content">
                        <h3>Expenses</h3>
                        <p className="amount negative">{formatCurrency(summary.totalExpense)}</p>
                    </div>
                    <div className="card-wave"></div>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                {/* Transaction Form */}
                <section className="form-section animate-fade-in">
                    <h2 className="section-title">
                        <i className="fas fa-plus-circle"></i> {isEditing ? 'Edit Transaction' : 'Add Transaction'}
                    </h2>
                    <div className="form-container">
                        <div className="form-toggle">
                            <button
                                className={`toggle-btn ${transactionType === 'income' ? 'active' : ''}`}
                                onClick={() => handleTransactionTypeToggle('income')}
                            >
                                Income
                            </button>
                            <button
                                className={`toggle-btn ${transactionType === 'expense' ? 'active' : ''}`}
                                onClick={() => handleTransactionTypeToggle('expense')}
                            >
                                Expense
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label htmlFor="title"><i className="fas fa-tag"></i> Description</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    placeholder="Salary, Groceries, Rent..."
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="amount"><i className="fas fa-rupee-sign"></i> Amount</label>
                                <input
                                    type="number"
                                    id="amount"
                                    name="amount"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={formData.amount}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="category"><i className="fas fa-filter"></i> Category</label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories[transactionType]?.map((category) => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="input-group">
                                <label htmlFor="date"><i className="fas fa-calendar"></i> Date</label>
                                <input
                                    type="date"
                                    id="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-buttons">
                                <button type="submit" className="submit-btn" style={{
                                    background: transactionType === 'income'
                                        ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                                        : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                                }}>
                                    <i className={`fas ${isEditing ? 'fa-save' : 'fa-plus'}`}></i>
                                    {isEditing ? 'Update Transaction' : `Add ${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)}`}
                                </button>

                                {isEditing && (
                                    <button
                                        type="button"
                                        className="cancel-btn"
                                        onClick={handleResetForm}
                                    >
                                        <i className="fas fa-times"></i> Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </section>

                {/* Transactions List */}
                <section className="transactions-section animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <div className="section-header">
                        <h2 className="section-title">
                            <i className="fas fa-history"></i> Recent Transactions
                        </h2>
                        <div className="filter-buttons">
                            <button
                                className={`filter-btn ${currentFilter === 'all' ? 'active' : ''}`}
                                onClick={() => handleFilterChange('all')}
                            >
                                All
                            </button>
                            <button
                                className={`filter-btn ${currentFilter === 'income' ? 'active' : ''}`}
                                onClick={() => handleFilterChange('income')}
                            >
                                Income
                            </button>
                            <button
                                className={`filter-btn ${currentFilter === 'expense' ? 'active' : ''}`}
                                onClick={() => handleFilterChange('expense')}
                            >
                                Expense
                            </button>
                        </div>
                    </div>

                    <div className="transactions-container">
                        <div className="transactions-list-container">
                            {loading ? (
                                <div className="loading-state">
                                    <div className="spinner"></div>
                                    <p>Loading transactions...</p>
                                </div>
                            ) : error ? (
                                <div className="error-state">
                                    <i className="fas fa-exclamation-triangle"></i>
                                    <h3>Error Loading Data</h3>
                                    <p>{error}</p>
                                    <button onClick={handleRetry} className="retry-btn">
                                        <i className="fas fa-redo"></i> Retry
                                    </button>
                                </div>
                            ) : filteredTransactions.length === 0 ? (
                                <div className="empty-state">
                                    <i className="fas fa-receipt"></i>
                                    <h3>No {currentFilter === 'all' ? '' : currentFilter} transactions</h3>
                                    <p>{currentFilter === 'all' ? 'Add your first transaction to get started' : `No ${currentFilter} transactions found`}</p>
                                </div>
                            ) : (
                                <div className="transactions-list">
                                    {filteredTransactions.map((transaction, index) => (
                                        <div
                                            key={transaction._id}
                                            className={`transaction-item ${transaction.type} animate-slide-right`}
                                            style={{ animationDelay: `${index * 0.05}s` }}
                                        >
                                            <div className="transaction-info">
                                                <h4>{transaction.title}</h4>
                                                <div className="transaction-meta">
                                                    <span><i className="fas fa-tag"></i> {transaction.category}</span>
                                                    <span><i className="fas fa-calendar"></i> {formatDate(transaction.date)}</span>
                                                </div>
                                            </div>
                                            <div className={`transaction-amount ${transaction.type === 'income' ? 'positive' : 'negative'}`}>
                                                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                            </div>
                                            <div className="transaction-actions">
                                                <button
                                                    className="action-btn edit-btn"
                                                    onClick={() => handleEditTransaction(transaction)}
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    className="action-btn delete-btn"
                                                    onClick={() => handleDeleteTransaction(transaction._id, transaction.title)}
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Monthly Summary */}
                        <div className="monthly-summary">
                            <h3><i className="fas fa-chart-pie"></i> Monthly Summary</h3>
                            <div className="summary-details">
                                <div className="summary-item">
                                    <span>This Month's Income</span>
                                    <span className="positive">{formatCurrency(summary.monthIncome)}</span>
                                </div>
                                <div className="summary-item">
                                    <span>This Month's Expenses</span>
                                    <span className="negative">{formatCurrency(summary.monthExpense)}</span>
                                </div>
                                <div className="summary-item total">
                                    <span>Monthly Balance</span>
                                    <span className={summary.monthBalance >= 0 ? 'positive' : 'negative'}>
                                        {formatCurrency(summary.monthBalance)}
                                    </span>
                                </div>
                            </div>
                            <div className="progress-container">
                                <div className="progress-label">
                                    <span>Expense Ratio</span>
                                    <span>{summary.expenseRatio.toFixed(1)}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${Math.min(summary.expenseRatio, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Footer */}
            <footer className="footer">
                <p>© 2023 ExpenseFlow • Track Smart, Live Better</p>
                <div className="footer-icons">
                    <i className="fas fa-chart-bar"></i>
                    <i className="fas fa-piggy-bank"></i>
                    <i className="fas fa-shield-alt"></i>
                </div>
            </footer>

            {/* Toast Notification */}
            {toast.show && (
                <div className={`toast toast-${toast.type}`}>
                    <div className="toast-content">
                        <i className={`fas ${toast.type === 'error' ? 'fa-exclamation-circle' :
                            toast.type === 'warning' ? 'fa-exclamation-triangle' : 'fa-check-circle'
                            }`}></i>
                        <span className="toast-message">{toast.message}</span>
                    </div>
                    <div className="toast-progress"></div>
                </div>
            )}
        </div>
    );
};

export default Home;