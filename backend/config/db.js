const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        
        // Connection events
        mongoose.connection.on('error', (err) => {
            console.error(`❌ MongoDB connection error: ${err}`);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('⚠️  MongoDB disconnected');
        });
        
        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected');
        });
        
    } catch (error) {
        console.error(`❌ Error connecting to MongoDB: ${error.message}`);
        console.log('Please check:');
        console.log('1. MongoDB server is running');
        console.log('2. Connection string is correct');
        console.log('3. Network connectivity');
        process.exit(1);
    }
};

module.exports = connectDB;