import connectToDatabase from './src/db/db_connection.js'; // Adjust the path as needed
import app from './app.js'; // Import the Express app

const PORT = process.env.PORT || 3000;

// Function to start the server
async function startServer() {
    try {
        // Connect to the database
        await connectToDatabase({ enableConnectionEvents: true });
        console.log('Successfully connected to the database');

        // Start the Express server
        const server = app.listen(PORT, () => {
            console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
        });

        // Graceful shutdown on exit signals
        process.on('SIGINT', () => shutdown(server)); // Handle Ctrl + C
        process.on('SIGTERM', () => shutdown(server)); // Handle termination signal (e.g., from a process manager)
    } catch (error) {
        console.error('Failed to start the server:', error);
        process.exit(1); // Exit with a failure code
    }
}

// Function to gracefully shut down the server
function shutdown(server) {
    console.log('\nShutting down gracefully...');
    
    // Close the server and stop accepting new connections
    server.close(() => {
        console.log('Closed out remaining connections');
        process.exit(0); // Exit with success code
    });

    // Force exit if server doesn't close in time
    setTimeout(() => {
        console.error('Forcing shutdown due to prolonged connections');
        process.exit(1); // Force shutdown
    }, 10000); // Force shutdown after 10 seconds
}

// Start the server
startServer();
