
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Завантаження змінних середовища з .env файлу
dotenv.config();

// Функція для підключення до MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Обробка подій підключення
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
}); 

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
}); 

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

// Закриття підключення на кінці
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});

export default connectDB;
