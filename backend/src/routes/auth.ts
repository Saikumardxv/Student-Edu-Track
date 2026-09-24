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
      sameSite: 'lax',
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
      refreshToken,
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
    sameSite: 'lax',
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
      sameSite: 'lax',
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

// Public: Fetch available departments for registration
router.get('/departments', async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: { name: 'asc' },
    });
    return res.status(200).json(departments);
  } catch (error: any) {
    console.error('Get departments error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Public: Fetch semesters for registration
router.get('/semesters', async (req: Request, res: Response) => {
  try {
    const semesters = await prisma.semester.findMany({
      select: {
        id: true,
        number: true,
        year: true,
      },
      orderBy: { number: 'asc' },
    });
    return res.status(200).json(semesters);
  } catch (error: any) {
    console.error('Get semesters error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Public: Register a new student account
router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password, rollNumber, departmentId, currentSemester } = req.body;

  if (!name || !email || !password || !rollNumber || !departmentId || !currentSemester) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const departmentIdNum = Number(departmentId);
  const currentSemesterId = Number(currentSemester);

  if (!Number.isInteger(departmentIdNum) || departmentIdNum <= 0) {
    return res.status(400).json({ message: 'Invalid department selected' });
  }

  if (!Number.isInteger(currentSemesterId) || currentSemesterId <= 0) {
    return res.status(400).json({ message: 'Invalid semester selected' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const existingRoll = await prisma.student.findUnique({ where: { rollNumber } });
    if (existingRoll) {
      return res.status(400).json({ message: 'Roll number already exists' });
    }

    const department = await prisma.department.findUnique({ where: { id: departmentIdNum } });
    if (!department) {
      return res.status(400).json({ message: 'Invalid department selected' });
    }

    const semester = await prisma.semester.findUnique({ where: { id: currentSemesterId } });
    if (!semester) {
      return res.status(400).json({ message: 'Invalid semester selected' });
    }

    const selectedSemesterId = semester.id;
    const currentSemesterNumber = semester.number;
    const hashedPassword = await bcrypt.hash(password, 10);

    const student = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'STUDENT',
          departmentId: department.id,
        },
      });

      const newStudent = await tx.student.create({
        data: {
          userId: user.id,
          rollNumber,
          departmentId: department.id,
          currentSemester: currentSemesterNumber,
        },
      });

      const subjects = await tx.subject.findMany({
        where: {
          departmentId: department.id,
          semesterId: selectedSemesterId,
        },
      });

      if (subjects.length > 0) {
        await tx.enrollment.createMany({
          data: subjects.map((subject) => ({
            studentId: newStudent.id,
            subjectId: subject.id,
            semesterId: currentSemesterId,
          })),
        });
      }

      return newStudent;
    });

    return res.status(201).json({ message: 'Registration successful', student });
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(', ')
        : error.meta?.target;
      return res.status(400).json({ message: `Duplicate field error: ${target}` });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
