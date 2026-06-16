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
// 1. GET /api/notices -- Fetch relevant notices based on user's role and department
router.get('/notices', async (req, res) => {
    const { role, departmentId } = req.user;
    try {
        let notices;
        if (role === 'ADMIN') {
            // Admins see all notices
            notices = await db_1.default.notice.findMany({
                orderBy: { createdAt: 'desc' },
            });
        }
        else {
            // Students and Faculty see notices targeted to their role or null, and departmentId or null
            notices = await db_1.default.notice.findMany({
                where: {
                    OR: [
                        { targetRole: role, departmentId: null },
                        { targetRole: role, departmentId: departmentId ? Number(departmentId) : null },
                        { targetRole: null, departmentId: null },
                        { targetRole: null, departmentId: departmentId ? Number(departmentId) : null },
                    ],
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        return res.status(200).json(notices);
    }
    catch (error) {
        console.error('Fetch notices error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// 2. POST /api/notices -- Post a new notice (Admin only)
router.post('/notices', async (req, res) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Admin only' });
    }
    const { title, content, targetRole, departmentId } = req.body;
    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
    }
    try {
        const notice = await db_1.default.notice.create({
            data: {
                title,
                content,
                targetRole: targetRole || null,
                departmentId: departmentId ? Number(departmentId) : null,
                createdBy: req.user.id,
            },
        });
        return res.status(201).json({ message: 'Notice posted successfully', notice });
    }
    catch (error) {
        console.error('Post notice error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.default = router;
