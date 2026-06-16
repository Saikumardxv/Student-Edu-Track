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
// 1. POST /api/marks -- Enter/update student marks (Faculty or Admin)
router.post('/marks', async (req, res) => {
    if (req.user.role !== 'FACULTY' && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    const { subjectId, studentId, internal1, internal2, midterm, external } = req.body;
    if (!subjectId || !studentId) {
        return res.status(400).json({ message: 'subjectId and studentId are required' });
    }
    try {
        // If faculty, verify they teach the subject
        if (req.user.role === 'FACULTY') {
            const faculty = await db_1.default.faculty.findUnique({
                where: { userId: req.user.id },
            });
            if (!faculty) {
                return res.status(404).json({ message: 'Faculty record not found' });
            }
            const subject = await db_1.default.subject.findUnique({ where: { id: Number(subjectId) } });
            if (!subject || subject.facultyId !== faculty.id) {
                return res.status(403).json({ message: 'Forbidden: You are not the instructor for this subject' });
            }
        }
        // Parse values (convert string empty inputs to null)
        const i1 = internal1 !== undefined && internal1 !== '' ? Number(internal1) : null;
        const i2 = internal2 !== undefined && internal2 !== '' ? Number(internal2) : null;
        const mid = midterm !== undefined && midterm !== '' ? Number(midterm) : null;
        const ext = external !== undefined && external !== '' ? Number(external) : null;
        // Calculate Total Marks: total = internal1 (25%) + internal2 (25%) + external (50%)
        // If any component is null, we can treat it as 0 for scaling or wait until all are entered.
        // Let's compute if at least one component exists, otherwise total is null.
        let total = null;
        let grade = null;
        if (i1 !== null || i2 !== null || ext !== null) {
            const v1 = i1 || 0;
            const v2 = i2 || 0;
            const vExt = ext || 0;
            total = v1 * 0.25 + v2 * 0.25 + vExt * 0.5;
            // Grade calculation:
            // 90-100 -> A+, 80-89 -> A, 70-79 -> B+, 60-69 -> B, 50-59 -> C, 40-49 -> D, below 40 -> F
            if (total >= 90)
                grade = 'A+';
            else if (total >= 80)
                grade = 'A';
            else if (total >= 70)
                grade = 'B+';
            else if (total >= 60)
                grade = 'B';
            else if (total >= 50)
                grade = 'C';
            else if (total >= 40)
                grade = 'D';
            else
                grade = 'F';
        }
        // Upsert mark record
        const existingMark = await db_1.default.mark.findFirst({
            where: {
                studentId: Number(studentId),
                subjectId: Number(subjectId),
            },
        });
        let markRecord;
        if (existingMark) {
            markRecord = await db_1.default.mark.update({
                where: { id: existingMark.id },
                data: {
                    internal1: i1,
                    internal2: i2,
                    midterm: mid,
                    external: ext,
                    total,
                    grade,
                },
            });
        }
        else {
            markRecord = await db_1.default.mark.create({
                data: {
                    studentId: Number(studentId),
                    subjectId: Number(subjectId),
                    internal1: i1,
                    internal2: i2,
                    midterm: mid,
                    external: ext,
                    total,
                    grade,
                },
            });
        }
        return res.status(200).json({ message: 'Marks saved successfully', record: markRecord });
    }
    catch (error) {
        console.error('Save marks error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// 2. GET /api/marks -- View marks for a subject (Faculty, Admin, or Student)
router.get('/marks', async (req, res) => {
    const subjectId = Number(req.query.subjectId);
    if (!subjectId) {
        return res.status(400).json({ message: 'subjectId query parameter is required' });
    }
    try {
        // If student, return only their own marks for this subject
        if (req.user.role === 'STUDENT') {
            const student = await db_1.default.student.findUnique({
                where: { userId: req.user.id },
            });
            if (!student) {
                return res.status(404).json({ message: 'Student record not found' });
            }
            const mark = await db_1.default.mark.findFirst({
                where: {
                    subjectId,
                    studentId: student.id,
                },
            });
            return res.status(200).json(mark ? [mark] : []);
        }
        // Faculty or Admin can see all students enrolled in the subject and their marks
        const enrollments = await db_1.default.enrollment.findMany({
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
        const marks = await db_1.default.mark.findMany({
            where: { subjectId },
        });
        const marksMap = new Map(marks.map((m) => [m.studentId, m]));
        const result = enrollments.map((en) => {
            const mark = marksMap.get(en.studentId);
            return {
                studentId: en.student.id,
                rollNumber: en.student.rollNumber,
                name: en.student.user.name,
                markId: mark ? mark.id : null,
                internal1: mark ? mark.internal1 : null,
                internal2: mark ? mark.internal2 : null,
                midterm: mark ? mark.midterm : null,
                external: mark ? mark.external : null,
                total: mark ? mark.total : null,
                grade: mark ? mark.grade : null,
            };
        });
        return res.status(200).json(result);
    }
    catch (error) {
        console.error('Get marks error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.default = router;
