import { Router, Response } from 'express';
import prisma from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// 1. POST /api/attendance -- Mark attendance (Faculty only)
router.post('/attendance', async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'FACULTY' && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
  }

  const { subjectId, date, records } = req.body; // records: Array<{ studentId: number, status: 'PRESENT' | 'ABSENT' | 'LATE' }>

  if (!subjectId || !date || !records || !Array.isArray(records)) {
    return res.status(400).json({ message: 'subjectId, date, and records array are required' });
  }

  try {
    let facultyId = 0;
    
    if (req.user!.role === 'FACULTY') {
      const faculty = await prisma.faculty.findUnique({
        where: { userId: req.user!.id },
      });
      if (!faculty) {
        return res.status(404).json({ message: 'Faculty record not found' });
      }
      facultyId = faculty.id;

      // Verify that this faculty is teaching this subject
      const subject = await prisma.subject.findUnique({ where: { id: Number(subjectId) } });
      if (!subject || subject.facultyId !== facultyId) {
        return res.status(403).json({ message: 'Forbidden: You are not the instructor for this subject' });
      }
    } else {
      // If ADMIN is posting attendance, find the subject's assigned faculty
      const subject = await prisma.subject.findUnique({ where: { id: Number(subjectId) } });
      if (!subject || !subject.facultyId) {
        return res.status(400).json({ message: 'This subject has no assigned faculty' });
      }
      facultyId = subject.facultyId;
    }

    const attendanceDate = new Date(date);
    // Set time to midnight to avoid timestamp mismatch during queries
    attendanceDate.setUTCHours(0, 0, 0, 0);

    // Create attendance logs in a transaction
    await prisma.$transaction(async (tx) => {
      // Remove any existing records on the same day for this subject to prevent duplicates
      await tx.attendance.deleteMany({
        where: {
          subjectId: Number(subjectId),
          date: attendanceDate,
        },
      });

      // Create new logs
      await tx.attendance.createMany({
        data: records.map((rec: any) => ({
          studentId: Number(rec.studentId),
          subjectId: Number(subjectId),
          facultyId,
          date: attendanceDate,
          status: rec.status, // "PRESENT", "ABSENT", "LATE"
        })),
      });
    });

    return res.status(201).json({ message: 'Attendance marked successfully' });
  } catch (error) {
    console.error('Mark attendance error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 2. GET /api/attendance -- Get attendance list for subject and date (Faculty, Admin, or Student)
router.get('/attendance', async (req: AuthRequest, res: Response) => {
  const subjectId = Number(req.query.subjectId);
  const dateStr = req.query.date as string;

  if (!subjectId) {
    return res.status(400).json({ message: 'subjectId query parameter is required' });
  }

  try {
    // If student, they can only view their own attendance details (handled in student route, or filtered here)
    if (req.user!.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: req.user!.id },
      });

      if (!student) {
        return res.status(404).json({ message: 'Student record not found' });
      }

      const attendance = await prisma.attendance.findMany({
        where: {
          subjectId,
          studentId: student.id,
        },
        orderBy: { date: 'desc' },
      });

      return res.status(200).json(attendance);
    }

    // Faculty or Admin can see all students' attendance for a specific date
    if (!dateStr) {
      // If no date is provided, return all logs for this subject grouped by student or raw logs
      const attendance = await prisma.attendance.findMany({
        where: { subjectId },
        include: {
          student: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
        orderBy: { date: 'desc' },
      });
      return res.status(200).json(attendance);
    }

    const attendanceDate = new Date(dateStr);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    // Get all enrolled students first to make sure we include students who don't have attendance logged yet
    const enrollments = await prisma.enrollment.findMany({
      where: { subjectId },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { student: { rollNumber: 'asc' } },
    });

    // Get existing attendance logs for this day
    const logs = await prisma.attendance.findMany({
      where: {
        subjectId,
        date: attendanceDate,
      },
    });

    const logsMap = new Map(logs.map((l) => [l.studentId, l]));

    // Build the grid response
    const results = enrollments.map((en) => {
      const logged = logsMap.get(en.studentId);
      return {
        studentId: en.student.id,
        rollNumber: en.student.rollNumber,
        name: en.student.user.name,
        attendanceId: logged ? logged.id : null,
        status: logged ? logged.status : 'ABSENT', // Default to ABSENT or null to mark
        isMarked: !!logged,
      };
    });

    return res.status(200).json(results);
  } catch (error) {
    console.error('Get attendance error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 3. PUT /api/attendance/:id -- Correct attendance record
router.put('/attendance/:id', async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'FACULTY' && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
  }

  const attendanceId = Number(req.params.id);
  const { status } = req.body; // "PRESENT", "ABSENT", "LATE"

  if (!status || !['PRESENT', 'ABSENT', 'LATE'].includes(status)) {
    return res.status(400).json({ message: 'Valid status (PRESENT, ABSENT, LATE) is required' });
  }

  try {
    const record = await prisma.attendance.findUnique({
      where: { id: attendanceId },
    });

    if (!record) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // If faculty, verify they teach the subject
    if (req.user!.role === 'FACULTY') {
      const faculty = await prisma.faculty.findUnique({
        where: { userId: req.user!.id },
      });
      if (!faculty || record.facultyId !== faculty.id) {
        return res.status(403).json({ message: 'Forbidden: You are not authorized to edit this record' });
      }
    }

    const updated = await prisma.attendance.update({
      where: { id: attendanceId },
      data: { status },
    });

    return res.status(200).json({ message: 'Attendance record updated successfully', record: updated });
  } catch (error) {
    console.error('Update attendance error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
