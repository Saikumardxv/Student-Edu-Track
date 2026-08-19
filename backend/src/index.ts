import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import facultyRouter from './routes/faculty';
import studentRouter from './routes/student';
import attendanceRouter from './routes/attendance';
import marksRouter from './routes/marks';
import noticeRouter from './routes/notice';

const app = express();
const PORT = process.env.PORT || 5000;
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
const frontendOrigin = process.env.FRONTEND_URL;

// Middleware
app.use(cors({
  origin: frontendOrigin || true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/faculty', facultyRouter);
app.use('/api/student', studentRouter);
app.use('/api', attendanceRouter);
app.use('/api', marksRouter);
app.use('/api', noticeRouter);

// Serve the Vite build when the backend is deployed as the single host.
if (process.env.SERVE_FRONTEND !== 'false') {
  app.use(express.static(frontendDistPath));
}

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ message: 'API route not found' });
    return;
  }

  const frontendIndexPath = path.join(frontendDistPath, 'index.html');
  res.sendFile(frontendIndexPath, (error) => {
    if (error) {
      res.json({ status: 'ok', message: 'EduTrack API is running' });
    }
  });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Something went wrong!' });
});

// Start Server
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
