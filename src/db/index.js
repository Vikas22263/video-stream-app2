import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB = async () => {
  try {
    const connectionInstsnce = await mongoose.connect("mongodb+srv://mongo:5wJvTQlwgB3qTJ68@cluster0.gbaiebn.mongodb.net");
    console.log(
      ` MongoDb connected !! DB HOST :${connectionInstsnce.connection.host}`
    );
  } catch (error) {
    console.log("MONGODB connection error", error);
    process.exit(1);
  }
};

export default connectDB;
