import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faWallet, 
  faArrowUp, 
  faArrowDown, 
  faPlusCircle, 
  faHistory, 
  faChartPie, 
  faChartBar, 
  faPiggyBank, 
  faShieldAlt,
  faTag,
  faDollarSign,
  faFilter,
  faCalendar,
  faPlus,
  faSave,
  faTimes,
  faEdit,
  faTrash,
  faCheckCircle,
  faExclamationCircle,
  faExclamationTriangle,
  faRedo,
  faReceipt,
  faCalendarAlt,
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import "./home.css"

const ExpenseTracker = () => {
  // API Configuration
  const API_BASE_URL = 'https://expense-tracker-pachamuthu-backend1-three.vercel.app/api';
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
  
  // Month selection state
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // Current month (1-12)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyReport, setMonthlyReport] = useState({
    monthIncome: 0,
    monthExpense: 0,
    monthBalance: 0,
    expenseRatio: 0,
    transactionCount: 0,
    transactions: []
  });
  
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState({
    transactions: true,
    monthly: false,
    categories: true
  });
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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

  // Get month name
  const getMonthName = (monthNumber) => {
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  // Get available years (current year and previous 5 years)
  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push(i);
    }
    return years;
  };

  // Handle month navigation
  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    // Don't allow future months
    if (selectedYear === currentYear && selectedMonth === currentMonth) {
      return;
    }
    
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // API Functions
  const fetchTransactions = async () => {
    try {
      setLoading(prev => ({ ...prev, transactions: true }));
      const response = await fetch(API_ENDPOINTS.transactions, {
        credentials: 'include' 
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
      setError('Failed to load transactions.');
      showToast('Failed to load transactions', 'error');
    } finally {
      setLoading(prev => ({ ...prev, transactions: false }));
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.summary, {
        credentials: 'include'
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

  const fetchMonthlyReport = async (year, month) => {
    try {
      setLoading(prev => ({ ...prev, monthly: true }));
      const response = await fetch(`${API_ENDPOINTS.monthly}?year=${year}&month=${month}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setMonthlyReport({
          monthIncome: data.summary.monthIncome || 0,
          monthExpense: data.summary.monthExpense || 0,
          monthBalance: data.summary.monthBalance || 0,
          expenseRatio: data.summary.expenseRatio || 0,
          transactionCount: data.summary.transactionCount || 0,
          transactions: data.transactions || []
        });
      }
    } catch (error) {
      console.error('Error fetching monthly report:', error);
      showToast('Failed to load monthly report', 'error');
    } finally {
      setLoading(prev => ({ ...prev, monthly: false }));
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(prev => ({ ...prev, categories: true }));
      const response = await fetch(API_ENDPOINTS.categories, {
        credentials: 'include'
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
    } finally {
      setLoading(prev => ({ ...prev, categories: false }));
    }
  };

  const addTransactionAPI = async (transactionData) => {
    try {
      const response = await fetch(API_ENDPOINTS.transactions, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(transactionData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add transaction');
      }
      
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
        credentials: 'include',
        body: JSON.stringify(transactionData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update transaction');
      }
      
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
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete transaction');
      }
      
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
    setFormData({
      ...formData,
      [name]: value
    });
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
      
      // Refresh all data
      await Promise.all([
        fetchSummary(),
        fetchMonthlyReport(selectedYear, selectedMonth)
      ]);
      
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
        
        // Refresh data
        await Promise.all([
          fetchSummary(),
          fetchMonthlyReport(selectedYear, selectedMonth)
        ]);
        
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
      fetchCategories(),
      fetchMonthlyReport(selectedYear, selectedMonth)
    ]);
  };

  // Initialize on component mount
  useEffect(() => {
    initializeData();
  }, []);

  // Update monthly report when month/year changes
  useEffect(() => {
    fetchMonthlyReport(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

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
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card balance-card animate-slide-up">
          <div className="card-icon">
            <FontAwesomeIcon icon={faWallet} />
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
            <FontAwesomeIcon icon={faArrowUp} />
          </div>
          <div className="card-content">
            <h3>Income</h3>
            <p className="amount positive">{formatCurrency(summary.totalIncome)}</p>
          </div>
          <div className="card-wave"></div>
        </div>

        <div className="card expense-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="card-icon">
            <FontAwesomeIcon icon={faArrowDown} />
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
            <FontAwesomeIcon icon={faPlusCircle} /> {isEditing ? 'Edit Transaction' : 'Add Transaction'}
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
                <label htmlFor="title">
                  <FontAwesomeIcon icon={faTag} /> Description
                </label>
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
                <label htmlFor="amount">
                  <FontAwesomeIcon icon={faDollarSign} /> Amount
                </label>
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
                <label htmlFor="category">
                  <FontAwesomeIcon icon={faFilter} /> Category
                </label>
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
                <label htmlFor="date">
                  <FontAwesomeIcon icon={faCalendar} /> Date
                </label>
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
                  <FontAwesomeIcon icon={isEditing ? faSave : faPlus} />
                  {isEditing ? 'Update Transaction' : `Add ${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)}`}
                </button>
                
                {isEditing && (
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={handleResetForm}
                  >
                    <FontAwesomeIcon icon={faTimes} /> Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </section>

        {/* Transactions & Monthly Report Section */}
        <section className="transactions-section animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {/* Month Selector */}
          <div className="month-selector-container">
            <div className="section-header">
              <h2 className="section-title">
                <FontAwesomeIcon icon={faCalendarAlt} /> Monthly Report
              </h2>
              <div className="month-navigation">
                <button 
                  className="nav-btn"
                  onClick={handlePreviousMonth}
                  disabled={loading.monthly}
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                
                <div className="month-display">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="month-select"
                    disabled={loading.monthly}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={month} value={month}>
                        {getMonthName(month)}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="year-select"
                    disabled={loading.monthly}
                  >
                    {getAvailableYears().map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button 
                  className="nav-btn"
                  onClick={handleNextMonth}
                  disabled={loading.monthly || 
                    (selectedYear === new Date().getFullYear() && 
                     selectedMonth === new Date().getMonth() + 1)}
                >
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </div>
            </div>
            
            {/* Monthly Summary Stats */}
            <div className="monthly-stats">
              <div className="stat-card">
                <div className="stat-label">Monthly Income</div>
                <div className="stat-value positive">
                  {formatCurrency(monthlyReport.monthIncome)}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Monthly Expense</div>
                <div className="stat-value negative">
                  {formatCurrency(monthlyReport.monthExpense)}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Monthly Balance</div>
                <div className={`stat-value ${monthlyReport.monthBalance >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(monthlyReport.monthBalance)}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Expense Ratio</div>
                <div className="stat-value">
                  {monthlyReport.expenseRatio.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Transactions for Selected Month */}
          <div className="section-header">
            <h3 className="section-subtitle">
              <FontAwesomeIcon icon={faHistory} /> Transactions for {getMonthName(selectedMonth)} {selectedYear}
              <span className="transaction-count">
                ({monthlyReport.transactionCount} transactions)
              </span>
            </h3>
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
              {loading.monthly ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading monthly report...</p>
                </div>
              ) : error ? (
                <div className="error-state">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  <h3>Error Loading Data</h3>
                  <p>{error}</p>
                  <button onClick={handleRetry} className="retry-btn">
                    <FontAwesomeIcon icon={faRedo} /> Retry
                  </button>
                </div>
              ) : monthlyReport.transactions.length === 0 ? (
                <div className="empty-state">
                  <FontAwesomeIcon icon={faReceipt} />
                  <h3>No transactions for {getMonthName(selectedMonth)} {selectedYear}</h3>
                  <p>Add your first transaction for this month</p>
                </div>
              ) : (
                <div className="transactions-list">
                  {monthlyReport.transactions
                    .filter(transaction => {
                      if (currentFilter === 'all') return true;
                      return transaction.type === currentFilter;
                    })
                    .map((transaction, index) => (
                    <div 
                      key={transaction._id}
                      className={`transaction-item ${transaction.type} animate-slide-right`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="transaction-info">
                        <h4>{transaction.title}</h4>
                        <div className="transaction-meta">
                          <span><FontAwesomeIcon icon={faTag} /> {transaction.category}</span>
                          <span><FontAwesomeIcon icon={faCalendar} /> {formatDate(transaction.date)}</span>
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
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteTransaction(transaction._id, transaction.title)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Monthly Summary Chart */}
            <div className="monthly-summary">
              <h3><FontAwesomeIcon icon={faChartPie} /> Monthly Analysis</h3>
              <div className="summary-details">
                <div className="summary-item">
                  <span>Total Income</span>
                  <span className="positive">{formatCurrency(monthlyReport.monthIncome)}</span>
                </div>
                <div className="summary-item">
                  <span>Total Expenses</span>
                  <span className="negative">{formatCurrency(monthlyReport.monthExpense)}</span>
                </div>
                <div className="summary-item total">
                  <span>Net Balance</span>
                  <span className={monthlyReport.monthBalance >= 0 ? 'positive' : 'negative'}>
                    {formatCurrency(monthlyReport.monthBalance)}
                  </span>
                </div>
              </div>
              <div className="progress-container">
                <div className="progress-label">
                  <span>Expense to Income Ratio</span>
                  <span>{monthlyReport.expenseRatio.toFixed(1)}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${Math.min(monthlyReport.expenseRatio, 100)}%` }}
                  ></div>
                </div>
                <div className="progress-info">
                  <small>
                    {monthlyReport.expenseRatio > 100 
                      ? 'Spending exceeds income!' 
                      : monthlyReport.expenseRatio > 80 
                      ? 'High spending ratio' 
                      : monthlyReport.expenseRatio > 50 
                      ? 'Moderate spending' 
                      : 'Good spending control'}
                  </small>
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
          <FontAwesomeIcon icon={faChartBar} />
          <FontAwesomeIcon icon={faPiggyBank} />
          <FontAwesomeIcon icon={faShieldAlt} />
        </div>
      </footer>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast ${toast.type} show`}>
          <div className="toast-content">
            <FontAwesomeIcon icon={
              toast.type === 'error' ? faExclamationCircle :
              toast.type === 'warning' ? faExclamationTriangle : faCheckCircle
            } />
            <span className="toast-message">{toast.message}</span>
          </div>
          <div className="toast-progress"></div>
        </div>
      )}
    </div>
  );
};

export default ExpenseTracker;