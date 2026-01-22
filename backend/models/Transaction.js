const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    amount: {
        type: Number,
        required: [true, 'Please add an amount'],
        min: [0.01, 'Amount must be greater than 0']
    },
    type: {
        type: String,
        required: true,
        enum: ['income', 'expense'],
        lowercase: true
    },
    category: {
        type: String,
        required: [true, 'Please select a category'],
        trim: true
    },
    date: {
        type: Date,
        required: [true, 'Please add a date'],
        default: Date.now
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for better query performance
transactionSchema.index({ user: 1 });
transactionSchema.index({ user: 1, type: 1 });
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1 });

// Static method to get monthly summary for a specific user
transactionSchema.statics.getMonthlySummary = async function(userId) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    const transactions = await this.find({
        user: userId,
        date: {
            $gte: startDate,
            $lte: endDate
        }
    });

    const monthIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const monthExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    return {
        monthIncome,
        monthExpense,
        monthBalance: monthIncome - monthExpense,
        expenseRatio: monthIncome > 0 ? (monthExpense / monthIncome * 100) : 0
    };
};

// Static method to get overall summary for a specific user
transactionSchema.statics.getSummary = async function(userId) {
    const transactions = await this.find({ user: userId });
    
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlySummary = await this.getMonthlySummary(userId);
    
    return {
        totalBalance: totalIncome - totalExpense,
        totalIncome,
        totalExpense,
        ...monthlySummary
    };
};

module.exports = mongoose.model('Transaction', transactionSchema);