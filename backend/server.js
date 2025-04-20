require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRouter = require('./api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Mount API routes
app.use('/api', apiRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
