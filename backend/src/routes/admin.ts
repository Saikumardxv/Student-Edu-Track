import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all admin routes
router.use(authenticate);
router.use(authorize(['ADMIN']));

// 1. GET /api/admin/dashboard -- Stats and overview
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const totalStudents = await prisma.student.count();
    const totalFaculty = await prisma.faculty.count();
    const totalDepartments = await prisma.department.count();
    const totalSubjects = await prisma.subject.count();

    const recentNotices = await prisma.notice.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      stats: {
        totalStudents,
        totalFaculty,
        totalDepartments,
        totalSubjects,
      },
      recentNotices,
    });
  } catch (error) {
    console.error('Admin Dashboard error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 2. GET /api/admin/students -- List all students
router.get('/students', async (req: AuthRequest, res: Response) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            photo: true,
            createdAt: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { rollNumber: 'asc' },
    });
    return res.status(200).json(students);
  } catch (error) {
    console.error('Get students error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 3. POST /api/admin/students -- Create student
router.post('/students', async (req: AuthRequest, res: Response) => {
  const { name, email, password, rollNumber, departmentId, currentSemester } = req.body;

  if (!name || !email || !password || !rollNumber || !departmentId || !currentSemester) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if email or roll number already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const existingRoll = await prisma.student.findUnique({ where: { rollNumber } });
    if (existingRoll) {
      return res.status(400).json({ message: 'Roll number already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and student in a transaction
    const student = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'STUDENT',
          departmentId: Number(departmentId),
        },
      });

      const newStudent = await tx.student.create({
        data: {
          userId: user.id,
          rollNumber,
          departmentId: Number(departmentId),
          currentSemester: Number(currentSemester),
        },
      });

      // Automatically enroll student in subjects for their department & semester
      const subjects = await tx.subject.findMany({
        where: {
          departmentId: Number(departmentId),
          semester: {
            number: Number(currentSemester),
          },
        },
      });

      if (subjects.length > 0) {
        await tx.enrollment.createMany({
          data: subjects.map((sub) => ({
            studentId: newStudent.id,
            subjectId: sub.id,
            semesterId: sub.semesterId,
          })),
        });
      }

      return newStudent;
    });

    return res.status(201).json({ message: 'Student created successfully', student });
  } catch (error) {
    console.error('Create student error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 4. PUT /api/admin/students/:id -- Update student
router.put('/students/:id', async (req: AuthRequest, res: Response) => {
  const studentId = Number(req.params.id);
  const { name, email, rollNumber, departmentId, currentSemester } = req.body;

  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Update inside transaction
    await prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: studentId },
        data: {
          rollNumber,
          departmentId: Number(departmentId),
          currentSemester: Number(currentSemester),
        },
      });

      await tx.user.update({
        where: { id: student.userId },
        data: {
          name,
          email,
          departmentId: Number(departmentId),
        },
      });
    });

    return res.status(200).json({ message: 'Student updated successfully' });
  } catch (error) {
    console.error('Update student error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 5. DELETE /api/admin/students/:id -- Deactivate student (Deletes student and associated user)
router.delete('/students/:id', async (req: AuthRequest, res: Response) => {
  const studentId = Number(req.params.id);

  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    await prisma.$transaction(async (tx) => {
      // Delete child associations
      await tx.attendance.deleteMany({ where: { studentId } });
      await tx.mark.deleteMany({ where: { studentId } });
      await tx.enrollment.deleteMany({ where: { studentId } });
      await tx.student.delete({ where: { id: studentId } });
      await tx.user.delete({ where: { id: student.userId } });
    });

    return res.status(200).json({ message: 'Student deactivated/deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 6. GET /api/admin/faculty -- List all faculty
router.get('/faculty', async (req: AuthRequest, res: Response) => {
  try {
    const faculty = await prisma.faculty.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            photo: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        subjects: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { employeeId: 'asc' },
    });
    return res.status(200).json(faculty);
  } catch (error) {
    console.error('Get faculty error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 7. POST /api/admin/faculty -- Create faculty
router.post('/faculty', async (req: AuthRequest, res: Response) => {
  const { name, email, password, employeeId, departmentId } = req.body;

  if (!name || !email || !password || !employeeId || !departmentId) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const existingEmp = await prisma.faculty.findUnique({ where: { employeeId } });
    if (existingEmp) {
      return res.status(400).json({ message: 'Employee ID already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const faculty = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'FACULTY',
          departmentId: Number(departmentId),
        },
      });

      return await tx.faculty.create({
        data: {
          userId: user.id,
          employeeId,
          departmentId: Number(departmentId),
        },
      });
    });

    return res.status(201).json({ message: 'Faculty created successfully', faculty });
  } catch (error) {
    console.error('Create faculty error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 8. PUT /api/admin/faculty/:id -- Update faculty
router.put('/faculty/:id', async (req: AuthRequest, res: Response) => {
  const facultyId = Number(req.params.id);
  const { name, email, employeeId, departmentId } = req.body;

  try {
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
    });

    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.faculty.update({
        where: { id: facultyId },
        data: {
          employeeId,
          departmentId: Number(departmentId),
        },
      });

      await tx.user.update({
        where: { id: faculty.userId },
        data: {
          name,
          email,
          departmentId: Number(departmentId),
        },
      });
    });

    return res.status(200).json({ message: 'Faculty updated successfully' });
  } catch (error) {
    console.error('Update faculty error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 9. GET /api/admin/departments -- List departments
router.get('/departments', async (req: AuthRequest, res: Response) => {
  try {
    const depts = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            students: true,
            faculty: true,
            subjects: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });
    return res.status(200).json(depts);
  } catch (error) {
    console.error('Get departments error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 10. POST /api/admin/departments -- Create department
router.post('/departments', async (req: AuthRequest, res: Response) => {
  const { name, code } = req.body;

  if (!name || !code) {
    return res.status(400).json({ message: 'Name and code are required' });
  }

  try {
    const existingCode = await prisma.department.findUnique({ where: { code } });
    if (existingCode) {
      return res.status(400).json({ message: 'Department code already exists' });
    }

    const dept = await prisma.department.create({
      data: { name, code },
    });

    return res.status(201).json({ message: 'Department created successfully', dept });
  } catch (error) {
    console.error('Create department error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 10.5 GET /api/admin/semesters -- List semesters
router.get('/semesters', async (req: AuthRequest, res: Response) => {
  try {
    const semesters = await prisma.semester.findMany({
      orderBy: { number: 'asc' },
    });
    return res.status(200).json(semesters);
  } catch (error) {
    console.error('Get semesters error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 11. GET /api/admin/subjects -- List subjects
router.get('/subjects', async (req: AuthRequest, res: Response) => {
  try {
    const departmentId = req.query.departmentId ? parseInt(req.query.departmentId as string, 10) : undefined;
    const semesterId = req.query.semesterId ? parseInt(req.query.semesterId as string, 10) : undefined;

    const where: any = {};
    if (departmentId && !isNaN(departmentId)) {
      where.departmentId = departmentId;
    }
    if (semesterId && !isNaN(semesterId)) {
      where.semesterId = semesterId;
    }

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        department: {
          select: { name: true, code: true },
        },
        semester: {
          select: { number: true, year: true },
        },
        faculty: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { code: 'asc' },
    });
    return res.status(200).json(subjects);
  } catch (error) {
    console.error('Get subjects error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 12. POST /api/admin/subjects -- Create subject
router.post('/subjects', async (req: AuthRequest, res: Response) => {
  try {
    const name = req.body.name || req.body.subjectName;
    const { code } = req.body;
    const departmentId = parseInt(req.body.departmentId);
    const semesterId = parseInt(req.body.semesterId);  
    const facultyId = req.body.facultyId ? parseInt(req.body.facultyId) : null;
    const credits = parseInt(req.body.credits);

    if (!name || !code || isNaN(credits) || isNaN(departmentId) || isNaN(semesterId)) {
      return res.status(400).json({ error: 'All fields except faculty are required', message: 'All fields except faculty are required' });
    }

    const existingCode = await prisma.subject.findUnique({ where: { code } });
    if (existingCode) {
      return res.status(400).json({ error: 'Subject code already exists', message: 'Subject code already exists' });
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        code,
        credits,
        departmentId,
        semesterId,
        facultyId,
      },
    });

    // Auto-enroll all existing students in this department & semester to the new subject
    const semester = await prisma.semester.findUnique({ where: { id: semesterId } });
    if (semester) {
      const students = await prisma.student.findMany({
        where: {
          departmentId,
          currentSemester: semester.number,
        },
      });

      if (students.length > 0) {
        await prisma.enrollment.createMany({
          data: students.map((stu) => ({
            studentId: stu.id,
            subjectId: subject.id,
            semesterId: semester.id,
          })),
        });
      }
    }

    return res.status(201).json({ message: 'Subject created successfully', subject });
  } catch (error: any) {
    console.error('SUBJECT ERROR:', JSON.stringify(error));
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Subject code already exists', message: 'Subject code already exists' });
    }
    return res.status(400).json({ error: error.message, message: error.message });
  }
});

// 13. GET /api/admin/timetable -- Fetch timetable slots for department and semester
router.get('/timetable', async (req: AuthRequest, res: Response) => {
  const departmentId = Number(req.query.departmentId);
  const semesterId = Number(req.query.semesterId);

  if (!departmentId || !semesterId) {
    return res.status(400).json({ message: 'departmentId and semesterId query parameters are required' });
  }

  try {
    const timetable = await prisma.timetable.findFirst({
      where: {
        departmentId,
        semesterId,
      },
      include: {
        slots: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
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
      subjectId: slot.subjectId,
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      room: slot.room,
      subjectCode: slot.subject.code,
      subjectName: slot.subject.name,
    }));

    return res.status(200).json(formattedSlots);
  } catch (error) {
    console.error('Fetch timetable slots error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 14. POST /api/admin/timetable -- Create timetable slot
router.post('/timetable', async (req: AuthRequest, res: Response) => {
  const { departmentId, semesterId, slots } = req.body; // slots: Array<{ subjectId, day, startTime, endTime, room }>

  if (!departmentId || !semesterId || !slots || !Array.isArray(slots)) {
    return res.status(400).json({ message: 'Department, semester, and slots array are required' });
  }

  try {
    // Find or create timetable
    let timetable = await prisma.timetable.findFirst({
      where: {
        departmentId: Number(departmentId),
        semesterId: Number(semesterId),
      },
    });

    if (!timetable) {
      timetable = await prisma.timetable.create({
        data: {
          departmentId: Number(departmentId),
          semesterId: Number(semesterId),
        },
      });
    } else {
      // Clear existing slots for clean override
      await prisma.timetableSlot.deleteMany({
        where: { timetableId: timetable.id },
      });
    }

    // Add new slots
    const slotsData = slots.map((s: any) => ({
      timetableId: timetable!.id,
      subjectId: Number(s.subjectId),
      day: s.day,
      startTime: s.startTime,
      endTime: s.endTime,
      room: s.room || null,
    }));

    await prisma.timetableSlot.createMany({
      data: slotsData,
    });

    return res.status(200).json({ message: 'Timetable slots updated successfully' });
  } catch (error) {
    console.error('Create timetable error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 14. GET /api/admin/reports/attendance -- Department-wise attendance average
router.get('/reports/attendance', async (req: AuthRequest, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        students: {
          include: {
            attendances: true,
          },
        },
      },
    });

    const report = departments.map((dept) => {
      let totalClasses = 0;
      let presentClasses = 0;

      dept.students.forEach((stu) => {
        stu.attendances.forEach((att) => {
          totalClasses++;
          if (att.status === 'PRESENT' || att.status === 'LATE') {
            presentClasses++;
          }
        });
      });

      const average = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 100;

      return {
        departmentName: dept.name,
        departmentCode: dept.code,
        averageAttendance: parseFloat(average.toFixed(2)),
      };
    });

    return res.status(200).json(report);
  } catch (error) {
    console.error('Get attendance report error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 15. GET /api/admin/reports/marks -- Grades distribution and Subject averages
router.get('/reports/marks', async (req: AuthRequest, res: Response) => {
  try {
    // 1. Grade Distribution
    const marks = await prisma.mark.findMany({
      where: { grade: { not: null } },
      select: { grade: true },
    });

    const gradeCounts: { [key: string]: number } = {
      'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0
    };

    marks.forEach((m) => {
      if (m.grade && gradeCounts[m.grade] !== undefined) {
        gradeCounts[m.grade]++;
      }
    });

    const gradeDistribution = Object.keys(gradeCounts).map((grade) => ({
      grade,
      count: gradeCounts[grade],
    }));

    // 2. Subject Averages
    const subjects = await prisma.subject.findMany({
      include: {
        marks: {
          where: { total: { not: null } },
        },
        department: { select: { code: true } },
      },
    });

    const subjectAverages = subjects.map((sub) => {
      const totalMarks = sub.marks.reduce((acc, curr) => acc + (curr.total || 0), 0);
      const average = sub.marks.length > 0 ? totalMarks / sub.marks.length : 0;

      return {
        subjectName: sub.name,
        subjectCode: sub.code,
        deptCode: sub.department.code,
        averageMark: parseFloat(average.toFixed(2)),
      };
    });

    // 3. Performers (Top 5 & Bottom 5 based on average total marks across subjects)
    const students = await prisma.student.findMany({
      include: {
        user: { select: { name: true } },
        department: { select: { code: true } },
        marks: { where: { total: { not: null } } },
      },
    });

    const studentPerformances = students
      .map((stu) => {
        const total = stu.marks.reduce((acc, curr) => acc + (curr.total || 0), 0);
        const count = stu.marks.length;
        const avg = count > 0 ? total / count : 0;
        return {
          studentName: stu.user.name,
          rollNumber: stu.rollNumber,
          deptCode: stu.department.code,
          gpa: parseFloat(avg.toFixed(2)),
        };
      })
      .filter((stu) => stu.gpa > 0);

    const topPerformers = [...studentPerformances]
      .sort((a, b) => b.gpa - a.gpa)
      .slice(0, 5);

    const bottomPerformers = [...studentPerformances]
      .sort((a, b) => a.gpa - b.gpa)
      .slice(0, 5);

    return res.status(200).json({
      gradeDistribution,
      subjectAverages,
      topPerformers,
      bottomPerformers,
    });
  } catch (error) {
    console.error('Get marks report error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
