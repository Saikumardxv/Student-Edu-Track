"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const semesters = await prisma.semester.findMany();
    console.log('Semesters:', semesters);
    const departments = await prisma.department.findMany();
    console.log('Departments:', departments);
    const subjectsCount = await prisma.subject.count();
    console.log('Total Subjects:', subjectsCount);
}
main().finally(() => prisma.$disconnect());
