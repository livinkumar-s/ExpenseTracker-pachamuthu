const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

// Default categories
const DEFAULT_CATEGORIES = {
    income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Bonus', 'Other Income'],
    expense: ['Food & Dining', 'Shopping', 'Transportation', 'Entertainment', 
             'Bills & Utilities', 'Healthcare', 'Education', 'Travel', 'Other']
};

// All routes are now protected
router.use(protect);

// ✅ GET /api/transactions - Get all transactions for logged in user
router.get('/', async (req, res) => {
    try {
        const { type, category, startDate, endDate, limit = 100, page = 1 } = req.query;
        
        // Build filter object - always filter by user
        const filter = { user: req.user.id };
        
        if (type && ['income', 'expense'].includes(type.toLowerCase())) {
            filter.type = type.toLowerCase();
        }
        
        if (category) {
            filter.category = { $regex: new RegExp(category, 'i') };
        }
        
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) {
                filter.date.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.date.$lte = new Date(endDate);
            }
        }
        
        // Pagination
        const pageSize = parseInt(limit);
        const skip = (parseInt(page) - 1) * pageSize;
        
        // Get transactions for current user
        const transactions = await Transaction.find(filter)
            .sort({ date: -1, createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .select('-__v');
        
        // Get total count for pagination info
        const total = await Transaction.countDocuments(filter);
        
        res.json({
            success: true,
            count: transactions.length,
            total,
            totalPages: Math.ceil(total / pageSize),
            currentPage: parseInt(page),
            data: transactions
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: error.message 
        });
    }
});

// ✅ GET /api/transactions/summary - Get financial summary for logged in user
router.get('/summary', async (req, res) => {
    try {
        const summary = await Transaction.getSummary(req.user.id);
        res.json({
            success: true,
            ...summary
        });
    } catch (error) {
        console.error('Error fetching summary:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
});

// ✅ GET /api/transactions/monthly - Get monthly breakdown for logged in user
router.get('/monthly', async (req, res) => {
    try {
        const { year, month } = req.query;
        const now = new Date();
        const targetYear = parseInt(year) || now.getFullYear();
        const targetMonth = parseInt(month) || now.getMonth() + 1;
        
        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
        
        // Get monthly transactions for current user
        const monthlyTransactions = await Transaction.find({
            user: req.user.id,
            date: {
                $gte: startDate,
                $lte: endDate
            }
        }).sort({ date: -1 });
        
        const monthIncome = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const monthExpense = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        res.json({
            success: true,
            year: targetYear,
            month: targetMonth,
            summary: {
                monthIncome,
                monthExpense,
                monthBalance: monthIncome - monthExpense,
                expenseRatio: monthIncome > 0 ? (monthExpense / monthIncome * 100) : 0,
                transactionCount: monthlyTransactions.length
            },
            transactions: monthlyTransactions
        });
    } catch (error) {
        console.error('Error fetching monthly data:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
});

// ✅ GET /api/categories - Get available categories
router.get('/categories', (req, res) => {
    try {
        res.json({
            success: true,
            data: DEFAULT_CATEGORIES
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
});

// ✅ GET /api/transactions/:id - Get single transaction (user-specific)
router.get('/:id', async (req, res) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            user: req.user.id
        });
        
        if (!transaction) {
            return res.status(404).json({ 
                success: false,
                message: 'Transaction not found' 
            });
        }
        
        res.json({
            success: true,
            data: transaction
        });
    } catch (error) {
        console.error('Error fetching transaction:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid transaction ID' 
            });
        }
        
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
});

// ✅ POST /api/transactions - Create transaction for logged in user
router.post('/', async (req, res) => {
    try {
        const { title, amount, type, category, date } = req.body;
        
        // Validate required fields
        const missingFields = [];
        if (!title) missingFields.push('title');
        if (!amount && amount !== 0) missingFields.push('amount');
        if (!type) missingFields.push('type');
        if (!category) missingFields.push('category');
        if (!date) missingFields.push('date');
        
        if (missingFields.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: `Please provide: ${missingFields.join(', ')}`
            });
        }
        
        // Validate type
        const lowerType = type.toLowerCase();
        if (!['income', 'expense'].includes(lowerType)) {
            return res.status(400).json({ 
                success: false,
                message: 'Type must be either "income" or "expense"' 
            });
        }
        
        // Validate amount
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Amount must be a positive number' 
            });
        }
        
        // Validate category
        const validCategories = DEFAULT_CATEGORIES[lowerType];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ 
                success: false,
                message: `Invalid category. Valid ${lowerType} categories: ${validCategories.join(', ')}` 
            });
        }
        
        // Create transaction with user ID
        const transaction = await Transaction.create({
            title: title.trim(),
            amount: parseFloat(amount),
            type: lowerType,
            category: category.trim(),
            date: new Date(date),
            user: req.user.id
        });
        
        res.status(201).json({
            success: true,
            message: 'Transaction created successfully',
            data: transaction
        });
    } catch (error) {
        console.error('Error creating transaction:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ 
                success: false,
                message: 'Validation error', 
                errors: messages 
            });
        }
        
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
});

// ✅ PUT /api/transactions/:id - Update transaction (user-specific)
router.put('/:id', async (req, res) => {
    try {
        const { title, amount, type, category, date } = req.body;
        
        // Check if transaction exists and belongs to user
        let transaction = await Transaction.findOne({
            _id: req.params.id,
            user: req.user.id
        });
        
        if (!transaction) {
            return res.status(404).json({ 
                success: false,
                message: 'Transaction not found' 
            });
        }
        
        // Prepare update data
        const updateData = {};
        if (title !== undefined) updateData.title = title.trim();
        if (amount !== undefined) updateData.amount = parseFloat(amount);
        if (type !== undefined) updateData.type = type.toLowerCase();
        if (category !== undefined) updateData.category = category.trim();
        if (date !== undefined) updateData.date = new Date(date);
        
        // Validate type if provided
        if (updateData.type && !['income', 'expense'].includes(updateData.type)) {
            return res.status(400).json({ 
                success: false,
                message: 'Type must be either "income" or "expense"' 
            });
        }
        
        // Validate amount if provided
        if (updateData.amount !== undefined && (isNaN(updateData.amount) || updateData.amount <= 0)) {
            return res.status(400).json({ 
                success: false,
                message: 'Amount must be a positive number' 
            });
        }
        
        // Validate category if provided
        if (updateData.category) {
            const transactionType = updateData.type || transaction.type;
            const validCategories = DEFAULT_CATEGORIES[transactionType];
            
            if (!validCategories.includes(updateData.category)) {
                return res.status(400).json({ 
                    success: false,
                    message: `Invalid category for ${transactionType}. Valid categories: ${validCategories.join(', ')}` 
                });
            }
        }
        
        // Update transaction
        transaction = await Transaction.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            updateData,
            {
                new: true,
                runValidators: true
            }
        );
        
        res.json({
            success: true,
            message: 'Transaction updated successfully',
            data: transaction
        });
    } catch (error) {
        console.error('Error updating transaction:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid transaction ID' 
            });
        }
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ 
                success: false,
                message: 'Validation error', 
                errors: messages 
            });
        }
        
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
});

// ✅ DELETE /api/transactions/:id - Delete transaction (user-specific)
router.delete('/:id', async (req, res) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            user: req.user.id
        });
        
        if (!transaction) {
            return res.status(404).json({ 
                success: false,
                message: 'Transaction not found' 
            });
        }
        
        await transaction.deleteOne();
        
        res.json({
            success: true,
            message: 'Transaction deleted successfully',
            data: {
                id: req.params.id,
                title: transaction.title
            }
        });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid transaction ID' 
            });
        }
        
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
});

module.exports = router;