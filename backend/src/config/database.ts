import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = "mongodb+srv://ehsan_db_user:B850Tnfk2Pp4VLn6@chatdb.qmcimwv.mongodb.net/?appName=chatdb";
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(mongoUri, { /* options if needed */ });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default mongoose;




