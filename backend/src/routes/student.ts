import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// Configure Multer for profile photo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname);
    cb(null, `profile_${Date.now()}${fileExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Limit 2MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (.jpg, .jpeg, .png, .webp) are allowed'));
    }
  },
});

router.use(authenticate);

// 1. GET /api/student/dashboard -- Dashboard summary (GPA, Attendance, notices, schedules)
router.get('/dashboard', authorize(['STUDENT']), async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        department: true,
      },
    });
    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }
    const marks = await prisma.mark.findMany({
      where: { studentId: student.id, grade: { not: null } },
    });
    const gradePoints: { [key: string]: number } = {
      'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C': 6, 'D': 5, 'F': 0
    };
    let totalPoints = 0;
    let gradedSubjectsCount = 0;
    marks.forEach((m) => {
      if (m.grade && gradePoints[m.grade] !== undefined) {
        totalPoints += gradePoints[m.grade];
        gradedSubjectsCount++;
      }
    });
    const gpa = gradedSubjectsCount > 0 ? parseFloat((totalPoints / gradedSubjectsCount).toFixed(2)) : 0.0;
    const attendances = await prisma.attendance.findMany({
      where: { studentId: student.id },
    });
    const totalClasses = attendances.length;
    const presentClasses = attendances.filter(
      (att) => att.status === 'PRESENT' || att.status === 'LATE'
    ).length;
    const attendancePercentage = totalClasses > 0 ? parseFloat(((presentClasses / totalClasses) * 100).toFixed(2)) : 100.0;
    const notices = await prisma.notice.findMany({
      where: {
        OR: [
          { targetRole: 'STUDENT', departmentId: null },
          { targetRole: 'STUDENT', departmentId: student.departmentId },
          { targetRole: null, departmentId: null },
          { targetRole: null, departmentId: student.departmentId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    const todayClasses = await prisma.timetableSlot.findMany({
      where: {
        day: today,
        timetable: {
          departmentId: student.departmentId,
          semester: {
            number: student.currentSemester,
          },
        },
      },
      include: {
        subject: {
          select: {
            name: true,
            code: true,
            faculty: {
              include: {
                user: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });
    const formattedClasses = todayClasses.map((slot) => ({
      id: slot.id,
      subjectName: slot.subject.name,
      subjectCode: slot.subject.code,
      startTime: slot.startTime,
      endTime: slot.endTime,
      room: slot.room,
      facultyName: slot.subject.faculty?.user.name || 'Not Assigned',
    }));
    return res.status(200).json({
      stats: {
        gpa,
        attendancePercentage,
        defaulterAlert: attendancePercentage < 75.0,
      },
      notices,
      todayClasses: formattedClasses,
    });
  } catch (error) {
    console.error('Student Dashboard error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 2. GET /api/student/grades -- Subject-wise grades list
router.get('/grades', authorize(['STUDENT']), async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
    });
    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: student.id },
      include: {
        subject: {
          include: {
            semester: true,
          },
        },
      },
      orderBy: { subject: { code: 'asc' } },
    });
    const marks = await prisma.mark.findMany({
      where: { studentId: student.id },
    });
    const marksMap = new Map(marks.map((m) => [m.subjectId, m]));
    const gradePoints: { [key: string]: number } = {
      'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C': 6, 'D': 5, 'F': 0
    };
    let totalPoints = 0;
    let gradedCount = 0;
    const gradesReport = enrollments.map((en) => {
      const mark = marksMap.get(en.subjectId);
      const grade = mark?.grade || null;
      if (grade && gradePoints[grade] !== undefined) {
        totalPoints += gradePoints[grade];
        gradedCount++;
      }
      return {
        subjectId: en.subjectId,
        subjectName: en.subject.name,
        subjectCode: en.subject.code,
        credits: en.subject.credits,
        semester: en.subject.semester.number,
        internal1: mark ? mark.internal1 : null,
        internal2: mark ? mark.internal2 : null,
        midterm: mark ? mark.midterm : null,
        external: mark ? mark.external : null,
        total: mark ? mark.total : null,
        grade,
      };
    });
    const gpa = gradedCount > 0 ? parseFloat((totalPoints / gradedCount).toFixed(2)) : 0.0;
    return res.status(200).json({
      gpa,
      grades: gradesReport,
    });
  } catch (error) {
    console.error('Student grades error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 3. GET /api/student/attendance -- Attendance breakdown per subject
router.get('/attendance', authorize(['STUDENT']), async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
    });
    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: student.id },
      include: {
        subject: true,
      },
    });
    const attendances = await prisma.attendance.findMany({
      where: { studentId: student.id },
    });
    const report = enrollments.map((en) => {
      const subAtts = attendances.filter((att) => att.subjectId === en.subjectId);
      const totalClasses = subAtts.length;
      const present = subAtts.filter((att) => att.status === 'PRESENT' || att.status === 'LATE').length;
      const absent = subAtts.filter((att) => att.status === 'ABSENT').length;
      const late = subAtts.filter((att) => att.status === 'LATE').length;
      const percentage = totalClasses > 0 ? parseFloat(((present / totalClasses) * 100).toFixed(2)) : 100.0;
      return {
        subjectId: en.subjectId,
        subjectName: en.subject.name,
        subjectCode: en.subject.code,
        totalClasses,
        present,
        absent,
        late,
        attendancePercentage: percentage,
        warning: percentage < 75.0,
      };
    });
    return res.status(200).json(report);
  } catch (error) {
    console.error('Student attendance report error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 4. GET /api/student/timetable -- Timetable for department and current semester
router.get('/timetable', authorize(['STUDENT']), async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    const timetable = await prisma.timetable.findFirst({
      where: {
        departmentId: student.departmentId,
        semester: {
          number: student.currentSemester,
        },
      },
      include: {
        slots: {
          include: {
            subject: {
              select: {
                name: true,
                code: true,
                faculty: {
                  include: {
                    user: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!timetable) {
      return res.status(200).json([]);
    }

    const formattedSlots = timetable.slots.map((slot) => ({
      id: slot.id,
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      room: slot.room,
      subjectName: slot.subject.name,
      subjectCode: slot.subject.code,
      facultyName: slot.subject.faculty?.user.name || 'Not Assigned',
    }));

    return res.status(200).json(formattedSlots);
  } catch (error) {
    console.error('Student timetable error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 5. GET /api/student/profile -- Own profile details (For all roles!)
router.get('/profile', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: {
          include: {
            department: true,
          },
        },
        faculty: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Strip password
    const { password, ...safeUser } = user;
    return res.status(200).json(safeUser);
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 6. PUT /api/student/profile -- Update profile / upload photo (Accepts text & profile photo file)
router.put('/profile', upload.single('photo'), async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { name, email, currentPassword, newPassword } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let photoPath = user.photo;
    if (req.file) {
      // If upload succeeded, store relative path (e.g. /uploads/filename)
      photoPath = `/uploads/${req.file.filename}`;
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) {
      // Verify email isn't taken
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      updateData.email = email;
    }
    if (photoPath) {
      updateData.photo = photoPath;
    }

    // Handle password change
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password does not match' });
      }
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        photo: true,
      },
    });

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

export default router;
