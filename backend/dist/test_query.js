"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("./config/db"));
async function main() {
    const subjects = await db_1.default.subject.findMany({
        include: {
            department: {
                select: { name: true, code: true },
            },
            semester: {
                select: { number: true, year: true },
            },
        },
        take: 2
    });
    console.log("SUBJECTS:", JSON.stringify(subjects, null, 2));
}
main().catch(console.error).finally(() => db_1.default.$disconnect());
