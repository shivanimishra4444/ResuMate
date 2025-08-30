const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

require('dotenv').config();
const connectDB = require('./database/config/database');
const setupGraphQL = require('./graphql');

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'ResuMate Backend API is running!' });
});

// Start server with GraphQL setup
const startServer = async () => {
  // Setup GraphQL
  await setupGraphQL(app);
  
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
  });
};

startServer();
