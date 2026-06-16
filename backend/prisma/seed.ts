import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Clear existing data (in order of dependencies)
  await prisma.timetableSlot.deleteMany();
  await prisma.timetable.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.mark.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.department.deleteMany();

  // 1. Create Departments
  console.log('Seeding departments...');
  const cseDept = await prisma.department.create({
    data: { name: 'Computer Science & Engineering', code: 'CSE' },
  });
  const eceDept = await prisma.department.create({
    data: { name: 'Electronics & Communication Engineering', code: 'ECE' },
  });
  const mbaDept = await prisma.department.create({
    data: { name: 'Master of Business Administration', code: 'MBA' },
  });

  const depts = [cseDept, eceDept, mbaDept];

  // 2. Create Semesters
  console.log('Seeding semesters...');
  const sem1 = await prisma.semester.create({
    data: { number: 1, year: 2026 },
  });
  const sem2 = await prisma.semester.create({
    data: { number: 2, year: 2026 },
  });

  const sems = [sem1, sem2];

  // 3. Create Admin User
  console.log('Seeding admin user...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      name: 'System Administrator',
      email: 'admin@edutrack.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // 4. Create Faculty Users
  console.log('Seeding faculty users...');
  const facultyPassword = await bcrypt.hash('faculty123', 10);
  const facultyData = [
    { name: 'Dr. Alan Turing', email: 'alan.turing@edutrack.com', employeeId: 'EMP001', deptId: cseDept.id },
    { name: 'Dr. Heinrich Hertz', email: 'heinrich.hertz@edutrack.com', employeeId: 'EMP002', deptId: eceDept.id },
    { name: 'Prof. Peter Drucker', email: 'peter.drucker@edutrack.com', employeeId: 'EMP003', deptId: mbaDept.id },
  ];

  const faculties: any[] = [];
  for (const f of facultyData) {
    const user = await prisma.user.create({
      data: {
        name: f.name,
        email: f.email,
        password: facultyPassword,
        role: 'FACULTY',
        departmentId: f.deptId,
      },
    });

    const faculty = await prisma.faculty.create({
      data: {
        userId: user.id,
        employeeId: f.employeeId,
        departmentId: f.deptId,
      },
    });
    faculties.push(faculty);
  }

  // 5. Create Subjects
  console.log('Seeding subjects...');
  // 5 subjects per dept per semester = 30 subjects
  const subjectList = [
    // CSE Semester 1
    { name: 'Introduction to Programming', code: 'CS101', credits: 4, deptId: cseDept.id, semId: sem1.id, facIndex: 0 },
    { name: 'Discrete Mathematics', code: 'CS102', credits: 3, deptId: cseDept.id, semId: sem1.id, facIndex: 0 },
    { name: 'Digital Electronics', code: 'CS103', credits: 3, deptId: cseDept.id, semId: sem1.id, facIndex: 0 },
    { name: 'Computer Organization', code: 'CS104', credits: 4, deptId: cseDept.id, semId: sem1.id, facIndex: 0 },
    { name: 'Technical Writing', code: 'CS105', credits: 2, deptId: cseDept.id, semId: sem1.id, facIndex: 0 },
    // CSE Semester 2
    { name: 'Data Structures & Algorithms', code: 'CS201', credits: 4, deptId: cseDept.id, semId: sem2.id, facIndex: 0 },
    { name: 'Object Oriented Programming', code: 'CS202', credits: 4, deptId: cseDept.id, semId: sem2.id, facIndex: 0 },
    { name: 'Operating Systems', code: 'CS203', credits: 3, deptId: cseDept.id, semId: sem2.id, facIndex: 0 },
    { name: 'Database Management Systems', code: 'CS204', credits: 4, deptId: cseDept.id, semId: sem2.id, facIndex: 0 },
    { name: 'Environmental Sciences', code: 'CS205', credits: 2, deptId: cseDept.id, semId: sem2.id, facIndex: 0 },

    // ECE Semester 1
    { name: 'Network Analysis', code: 'EC101', credits: 4, deptId: eceDept.id, semId: sem1.id, facIndex: 1 },
    { name: 'Electronic Devices', code: 'EC102', credits: 4, deptId: eceDept.id, semId: sem1.id, facIndex: 1 },
    { name: 'Engineering Physics', code: 'EC103', credits: 3, deptId: eceDept.id, semId: sem1.id, facIndex: 1 },
    { name: 'Calculus & Linear Algebra', code: 'EC104', credits: 4, deptId: eceDept.id, semId: sem1.id, facIndex: 1 },
    { name: 'Basic Electrical Eng', code: 'EC105', credits: 2, deptId: eceDept.id, semId: sem1.id, facIndex: 1 },
    // ECE Semester 2
    { name: 'Signals & Systems', code: 'EC201', credits: 4, deptId: eceDept.id, semId: sem2.id, facIndex: 1 },
    { name: 'Analog Circuits', code: 'EC202', credits: 4, deptId: eceDept.id, semId: sem2.id, facIndex: 1 },
    { name: 'Electromagnetics', code: 'EC203', credits: 3, deptId: eceDept.id, semId: sem2.id, facIndex: 1 },
    { name: 'Communication Theory', code: 'EC204', credits: 4, deptId: eceDept.id, semId: sem2.id, facIndex: 1 },
    { name: 'C Programming', code: 'EC205', credits: 3, deptId: eceDept.id, semId: sem2.id, facIndex: 1 },

    // MBA Semester 1
    { name: 'Principles of Management', code: 'MB101', credits: 3, deptId: mbaDept.id, semId: sem1.id, facIndex: 2 },
    { name: 'Organizational Behavior', code: 'MB102', credits: 3, deptId: mbaDept.id, semId: sem1.id, facIndex: 2 },
    { name: 'Managerial Economics', code: 'MB103', credits: 3, deptId: mbaDept.id, semId: sem1.id, facIndex: 2 },
    { name: 'Financial Accounting', code: 'MB104', credits: 4, deptId: mbaDept.id, semId: sem1.id, facIndex: 2 },
    { name: 'Business Communication', code: 'MB105', credits: 2, deptId: mbaDept.id, semId: sem1.id, facIndex: 2 },
    // MBA Semester 2
    { name: 'Marketing Management', code: 'MB201', credits: 4, deptId: mbaDept.id, semId: sem2.id, facIndex: 2 },
    { name: 'Human Resource Management', code: 'MB202', credits: 3, deptId: mbaDept.id, semId: sem2.id, facIndex: 2 },
    { name: 'Corporate Finance', code: 'MB203', credits: 4, deptId: mbaDept.id, semId: sem2.id, facIndex: 2 },
    { name: 'Operations Research', code: 'MB204', credits: 3, deptId: mbaDept.id, semId: sem2.id, facIndex: 2 },
    { name: 'Business Law', code: 'MB205', credits: 2, deptId: mbaDept.id, semId: sem2.id, facIndex: 2 },
  ];

  const subjects: any[] = [];
  for (const s of subjectList) {
    const sub = await prisma.subject.create({
      data: {
        name: s.name,
        code: s.code,
        credits: s.credits,
        departmentId: s.deptId,
        semesterId: s.semId,
        facultyId: faculties[s.facIndex].id,
      },
    });
    subjects.push(sub);
  }

  // 6. Create Students & Enroll them
  console.log('Seeding students & enrollments...');
  const studentPassword = await bcrypt.hash('student123', 10);
  const students: any[] = [];

  for (const dept of depts) {
    for (let i = 1; i <= 10; i++) {
      const rollNumber = `${dept.code}${String(i).padStart(3, '0')}`;
      const email = `student.${dept.code.toLowerCase()}${i}@edutrack.com`;
      const name = `Student ${dept.code} ${i}`;
      // Distribute: first 5 are Semester 1, last 5 are Semester 2
      const currentSemesterNumber = i <= 5 ? 1 : 2;
      const currentSemesterId = currentSemesterNumber === 1 ? sem1.id : sem2.id;

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: studentPassword,
          role: 'STUDENT',
          departmentId: dept.id,
        },
      });

      const student = await prisma.student.create({
        data: {
          userId: user.id,
          rollNumber,
          departmentId: dept.id,
          currentSemester: currentSemesterNumber,
        },
      });

      students.push(student);

      // Enroll in the 5 subjects of their department and semester
      const deptSemSubjects = subjects.filter(
        (sub) => sub.departmentId === dept.id && sub.semesterId === currentSemesterId
      );

      for (const sub of deptSemSubjects) {
        await prisma.enrollment.create({
          data: {
            studentId: student.id,
            subjectId: sub.id,
            semesterId: currentSemesterId,
          },
        });
      }
    }
  }

  // 7. Seed Sample Attendance Records for past 30 days
  console.log('Seeding 30 days of attendance logs...');
  // We want to generate history. Let's do it for all students
  const todayDate = new Date();
  const attendanceRecords: any[] = [];

  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const recordDate = new Date();
    recordDate.setDate(todayDate.getDate() - dayOffset);
    // Ignore Sundays
    if (recordDate.getDay() === 0) continue;

    recordDate.setUTCHours(0, 0, 0, 0);

    for (const student of students) {
      // Find subjects student is enrolled in
      const enrolls = await prisma.enrollment.findMany({
        where: { studentId: student.id },
        include: { subject: true },
      });

      for (const en of enrolls) {
        // Find faculty for subject
        const facultyId = en.subject.facultyId;
        if (!facultyId) continue;

        // Generate status. We want warning system verification,
        // so let's make CSE Student 1 have very low attendance (< 60%),
        // and others have standard high attendance (~85-95% PRESENT).
        let status = 'PRESENT';
        const rand = Math.random();

        if (student.rollNumber === 'CSE001') {
          // low attendance for CS001
          status = rand < 0.55 ? 'PRESENT' : rand < 0.65 ? 'LATE' : 'ABSENT';
        } else {
          status = rand < 0.88 ? 'PRESENT' : rand < 0.94 ? 'LATE' : 'ABSENT';
        }

        attendanceRecords.push({
          studentId: student.id,
          subjectId: en.subjectId,
          facultyId,
          date: recordDate,
          status,
        });
      }
    }
  }

  // Batch insert attendance (using chunks to prevent SQLite limits)
  const chunkSize = 500;
  for (let i = 0; i < attendanceRecords.length; i += chunkSize) {
    const chunk = attendanceRecords.slice(i, i + chunkSize);
    await prisma.attendance.createMany({ data: chunk });
  }

  // 8. Seed Marks for all students
  console.log('Seeding marks...');
  for (const student of students) {
    const enrolls = await prisma.enrollment.findMany({
      where: { studentId: student.id },
    });

    for (const en of enrolls) {
      // Generate marks: internal1 (max 25), internal2 (max 25), midterm (max 30), external (max 100)
      // Wait, let's keep all marks out of 100, and scale them in the database record:
      // total = internal1*0.25 + internal2*0.25 + external*0.5.
      // So:
      // internal1 = 60-95
      // internal2 = 60-95
      // midterm = 65-92
      // external = 55-94
      const internal1 = Math.floor(Math.random() * 35) + 60; // 60 to 95
      const internal2 = Math.floor(Math.random() * 35) + 60; // 60 to 95
      const midterm = Math.floor(Math.random() * 30) + 65; // 65 to 95
      const external = Math.floor(Math.random() * 40) + 55; // 55 to 95

      const total = internal1 * 0.25 + internal2 * 0.25 + external * 0.5;
      
      let grade = 'F';
      if (total >= 90) grade = 'A+';
      else if (total >= 80) grade = 'A';
      else if (total >= 70) grade = 'B+';
      else if (total >= 60) grade = 'B';
      else if (total >= 50) grade = 'C';
      else if (total >= 40) grade = 'D';

      await prisma.mark.create({
        data: {
          studentId: student.id,
          subjectId: en.subjectId,
          internal1,
          internal2,
          midterm,
          external,
          total,
          grade,
        },
      });
    }
  }

  // 9. Seed Timetables
  console.log('Seeding timetables...');
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const times = [
    { start: '09:00', end: '10:30' },
    { start: '10:45', end: '12:15' },
    { start: '13:00', end: '14:30' },
    { start: '14:45', end: '16:15' },
  ];

  for (const dept of depts) {
    for (const sem of sems) {
      const timetable = await prisma.timetable.create({
        data: {
          departmentId: dept.id,
          semesterId: sem.id,
        },
      });

      // Find subjects for this department & semester
      const deptSemSubjects = subjects.filter(
        (sub) => sub.departmentId === dept.id && sub.semesterId === sem.id
      );

      if (deptSemSubjects.length === 0) continue;

      // Create a few slots
      let subIndex = 0;
      for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
        const day = days[dayIdx];
        
        // Two classes per day
        for (let classIdx = 0; classIdx < 2; classIdx++) {
          const time = times[classIdx];
          const subject = deptSemSubjects[subIndex % deptSemSubjects.length];
          subIndex++;

          await prisma.timetableSlot.create({
            data: {
              timetableId: timetable.id,
              subjectId: subject.id,
              day,
              startTime: time.start,
              endTime: time.end,
              room: `Block ${dept.code} - Room ${100 + dayIdx * 10 + classIdx}`,
            },
          });
        }
      }
    }
  }

  // 10. Seed Notices
  console.log('Seeding notices...');
  await prisma.notice.create({
    data: {
      title: 'Welcome to EduTrack!',
      content: 'Welcome all students and faculty members to the brand new EduTrack Student Management System! Explore your personalized dashboard and calendars.',
      targetRole: null, // all roles
      createdBy: adminUser.id,
    },
  });

  await prisma.notice.create({
    data: {
      title: 'End Semester Examination Schedule',
      content: 'The end-semester examinations for Semester 1 and 2 will commence from July 15, 2026. The detailed timetable will be posted by the controller of exams shortly.',
      targetRole: 'STUDENT',
      createdBy: adminUser.id,
    },
  });

  await prisma.notice.create({
    data: {
      title: 'Faculty Senate Meeting',
      content: 'There will be a mandatory Faculty Senate meeting on June 15, 2026, at 3:00 PM in the Main Conference Hall. Agenda: Curriculum review and grade entry procedures.',
      targetRole: 'FACULTY',
      createdBy: adminUser.id,
    },
  });

  console.log('Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
