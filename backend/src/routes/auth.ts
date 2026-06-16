import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-access-token-key-123!';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-token-key-123!';

const generateTokens = (user: { id: number; email: string; role: string; departmentId: number | null }) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role, departmentId: user.departmentId },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role, departmentId: user.departmentId },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// Login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        student: {
          include: {
            department: true,
          }
        },
        faculty: {
          include: {
            department: true,
          }
        },
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // Set Refresh Token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Determine details
    let roleDetails = null;
    if (user.role === 'STUDENT' && user.student) {
      roleDetails = {
        studentId: user.student.id,
        rollNumber: user.student.rollNumber,
        currentSemester: user.student.currentSemester,
        departmentName: user.student.department.name,
        departmentCode: user.student.department.code,
      };
    } else if (user.role === 'FACULTY' && user.faculty) {
      roleDetails = {
        facultyId: user.faculty.id,
        employeeId: user.faculty.employeeId,
        departmentName: user.faculty.department.name,
        departmentCode: user.faculty.department.code,
      };
    }

    return res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        photo: user.photo,
        ...roleDetails,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  return res.status(200).json({ message: 'Logged out successfully' });
});

// Refresh Token
router.post('/refresh', async (req: Request, res: Response) => {
  let refreshToken = req.cookies?.refreshToken;
  
  if (!refreshToken && req.body.refreshToken) {
    refreshToken = req.body.refreshToken;
  }

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;
    
    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        student: {
          include: {
            department: true,
          }
        },
        faculty: {
          include: {
            department: true,
          }
        },
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    const tokens = generateTokens(user);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Determine details
    let roleDetails = null;
    if (user.role === 'STUDENT' && user.student) {
      roleDetails = {
        studentId: user.student.id,
        rollNumber: user.student.rollNumber,
        currentSemester: user.student.currentSemester,
        departmentName: user.student.department.name,
        departmentCode: user.student.department.code,
      };
    } else if (user.role === 'FACULTY' && user.faculty) {
      roleDetails = {
        facultyId: user.faculty.id,
        employeeId: user.faculty.employeeId,
        departmentName: user.faculty.department.name,
        departmentCode: user.faculty.department.code,
      };
    }

    return res.status(200).json({
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        photo: user.photo,
        ...roleDetails,
      },
    });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});

export default router;
