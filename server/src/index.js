"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
// Routes imports
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const projects_1 = __importDefault(require("./routes/projects"));
const logs_1 = __importDefault(require("./routes/logs"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: { origin: '*' }
});
exports.prisma = new client_1.PrismaClient();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Main Routes
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/projects', projects_1.default);
app.use('/api/logs', logs_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
});
// Socket.io basics
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    socket.on('join_project_room', (projectId) => {
        socket.join(`project_${projectId}`);
        console.log(`User ${socket.id} joined room project_${projectId}`);
    });
    socket.on('send_message', async ({ projectId, senderId, content }) => {
        // In a real app we'd save to DB here
        try {
            const msg = await exports.prisma.message.create({
                data: { projectId, senderId, content }
            });
            io.to(`project_${projectId}`).emit('receive_message', msg);
        }
        catch (e) {
            console.error('Message error', e);
        }
    });
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map