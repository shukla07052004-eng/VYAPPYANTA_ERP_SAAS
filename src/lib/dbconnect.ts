
import mongoose from "mongoose";

const MONGODBURI = process.env.MONGODB_URI;

if (!MONGODBURI) {
    throw new Error("MONGODB_URI is not defined");
}

type ConnectObject = {
    isConnected?: number;
};

const connection: ConnectObject = {};

async function connectDB(): Promise<void> {
    
    // Already connected
    if (connection.isConnected === 1) {
        console.log("Already connected to the database");
        return;
    }
    
    try {
        const db = await mongoose.connect(MONGODBURI! || '', {});
        
        connection.isConnected = db.connection.readyState;
        
        console.log("Database connected successfully");
        
    } catch (error) {
        
        console.error("Failed to connect DB:", error);
        
        // VERY IMPORTANT
        throw error;
    }
}

export default connectDB;



// import mongoose from "mongoose";

// type ConnectObject = {
//     isConnected?: number;
// }

// const connection: ConnectObject = {}

// async function connectDB(): Promise<void> {
//     if (connection.isConnected) {
//         console.log("Already connected to the database")
//         return
//     }

//     try {
//         const db = await mongoose.connect(process.env.MONGODB_URI! || '', {})
        
//         connection.isConnected = db.connections[0].readyState;

//         console.log('Database connected successfully');
//     } catch (error) {
//         console.log("Failed to connect DB", error)
//     }
// }

// export default connectDB