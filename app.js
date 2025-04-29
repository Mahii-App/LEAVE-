const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const userRoutes = require('./src/routes/user.routes');
const leaveRoutes = require('./src/routes/leave.routes');
const setupSwagger = require('./src/config/swagger');
const connectDB = require('./src/config/db');
const { setup } = require('swagger-ui-express');
const path = require('path');

dotenv.config();
global.logger = require('./src/utils/logger');

const app = express();


connectDB();


app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/users/api/v1', userRoutes);
app.use('/users/api/v1/leaves', leaveRoutes);
setupSwagger(app);

app.get('/', (req, res) => {
  res.send('Leave Management API is running');
});

module.exports = app;
