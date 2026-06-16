"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../config/db"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use((0, auth_1.authorize)(['FACULTY']));
// 1. GET /api/faculty/dashboard -- Dashboard statistics & classes today
router.get('/dashboard', async (req, res) => {
    const userId = req.user.id;
    try {
        const faculty = await db_1.default.faculty.findUnique({
            where: { userId },
        });
        if (!faculty) {
            return res.status(404).json({ message: 'Faculty record not found' });
        }
        // Number of assigned subjects
        const subjectsCount = await db_1.default.subject.count({
            where: { facultyId: faculty.id },
        });
        // Today's classes
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = days[new Date().getDay()]; // e.g. "Monday"
        const todayClasses = await db_1.default.timetableSlot.findMany({
            where: {
                day: today,
                subject: {
                    facultyId: faculty.id,
                },
            },
            include: {
                subject: {
                    select: {
                        name: true,
                        code: true,
                    },
                },
                timetable: {
                    include: {
                        department: { select: { code: true } },
                        semester: { select: { number: true } },
                    },
                },
            },
            orderBy: { startTime: 'asc' },
        });
        // Recent marks input
        const recentMarks = await db_1.default.mark.findMany({
            where: {
                subject: { facultyId: faculty.id },
            },
            take: 5,
            include: {
                student: {
                    include: {
                        user: { select: { name: true } },
                    },
                },
                subject: { select: { name: true, code: true } },
            },
            orderBy: { id: 'desc' },
        });
        return res.status(200).json({
            stats: {
                subjectsCount,
                todayClassesCount: todayClasses.length,
            },
            todayClasses,
            recentMarks,
        });
    }
    catch (error) {
        console.error('Faculty Dashboard error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// 2. GET /api/faculty/subjects -- List assigned subjects
router.get('/subjects', async (req, res) => {
    const userId = req.user.id;
    try {
        const faculty = await db_1.default.faculty.findUnique({
            where: { userId },
        });
        if (!faculty) {
            return res.status(404).json({ message: 'Faculty record not found' });
        }
        const subjects = await db_1.default.subject.findMany({
            where: { facultyId: faculty.id },
            include: {
                department: { select: { id: true, name: true, code: true } },
                semester: { select: { id: true, number: true, year: true } },
                _count: {
                    select: { enrollments: true },
                },
            },
            orderBy: { code: 'asc' },
        });
        return res.status(200).json(subjects);
    }
    catch (error) {
        console.error('Faculty subjects error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// 3. GET /api/faculty/reports/defaulters -- Students with attendance < 75%
router.get('/reports/defaulters', async (req, res) => {
    const subjectId = Number(req.query.subjectId);
    const userId = req.user.id;
    if (!subjectId) {
        return res.status(400).json({ message: 'subjectId parameter is required' });
    }
    try {
        const faculty = await db_1.default.faculty.findUnique({
            where: { userId },
        });
        if (!faculty) {
            return res.status(404).json({ message: 'Faculty record not found' });
        }
        // Verify faculty teaches this subject
        const subject = await db_1.default.subject.findUnique({
            where: { id: subjectId },
        });
        if (!subject || subject.facultyId !== faculty.id) {
            return res.status(403).json({ message: 'Access denied: You are not the instructor for this subject' });
        }
        // Get all enrolled students
        const enrollments = await db_1.default.enrollment.findMany({
            where: { subjectId },
            include: {
                student: {
                    include: {
                        user: { select: { name: true, email: true } },
                        attendances: {
                            where: { subjectId },
                        },
                    },
                },
            },
        });
        const defaulters = enrollments
            .map((enroll) => {
            const student = enroll.student;
            const totalClasses = student.attendances.length;
            const presentClasses = student.attendances.filter((att) => att.status === 'PRESENT' || att.status === 'LATE').length;
            const percentage = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 100;
            return {
                studentId: student.id,
                name: student.user.name,
                email: student.user.email,
                rollNumber: student.rollNumber,
                totalClasses,
                presentClasses,
                attendancePercentage: parseFloat(percentage.toFixed(2)),
            };
        })
            .filter((stu) => stu.attendancePercentage < 75.0);
        return res.status(200).json(defaulters);
    }
    catch (error) {
        console.error('Defaulters report error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.default = router;
