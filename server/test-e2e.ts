import { io as Client } from 'socket.io-client';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3001/api';
const SOCKET_URL = 'http://localhost:3001';

async function request(path: string, method = 'GET', body?: any, headers?: any) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function runTest() {
  console.log('🚀 Starting Full MVP E2E Test Simulation...\n');

  try {
    // 1. Cleanup specific emails to ensure clean run
    const testUsers = await prisma.user.findMany({ where: { email: { in: ['alice@unico.edu', 'bob@unico.edu'] } } });
    const testUserIds = testUsers.map(u => u.id);
    if (testUserIds.length > 0) {
      // Find projects owned by test users
      const testProjects = await prisma.project.findMany({ where: { createdBy: { in: testUserIds } } });
      const testProjectIds = testProjects.map(p => p.id);
      if (testProjectIds.length > 0) {
        await prisma.message.deleteMany({ where: { projectId: { in: testProjectIds } } });
        await prisma.progressLog.deleteMany({ where: { projectId: { in: testProjectIds } } });
        await prisma.joinRequest.deleteMany({ where: { projectId: { in: testProjectIds } } });
        await prisma.projectMember.deleteMany({ where: { projectId: { in: testProjectIds } } });
        await prisma.project.deleteMany({ where: { id: { in: testProjectIds } } });
      }
      // Also clean memberships in other projects
      await prisma.projectMember.deleteMany({ where: { userId: { in: testUserIds } } });
      await prisma.progressLog.deleteMany({ where: { userId: { in: testUserIds } } });
      await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
    }

    // 2. User A (Alice): Sign up
    console.log('👤 [User A] Alice registering...');
    const aliceRes = await request('/auth/register', 'POST', {
      name: 'Alice Founder',
      email: 'alice@unico.edu',
      password: 'password123',
      university: 'Macquarie University'
    });
    const aliceToken = jwt.sign({ id: aliceRes.user.id, email: aliceRes.user.email }, process.env.JWT_SECRET || 'secret');
    const aliceHeader = { Authorization: `Bearer ${aliceToken}` };
    console.log(`✅ Alice Registered: ${aliceRes.user.id}`);

    // 3. User A (Alice): Create Project
    console.log('\n📦 [User A] Alice creating project...');
    const projectRes = await request('/projects', 'POST', {
      title: 'Unico Core V1',
      description: 'Revolutionizing student collaboration networks.'
    }, aliceHeader);
    const projectId = projectRes.id;
    console.log(`✅ Project Created: ${projectId}`);

    // 4. User B (Bob): Sign up
    console.log('\n👤 [User B] Bob registering...');
    const bobRes = await request('/auth/register', 'POST', {
      name: 'Bob Builder',
      email: 'bob@unico.edu',
      password: 'password123',
      university: 'UNSW'
    });
    const bobToken = jwt.sign({ id: bobRes.user.id, email: bobRes.user.email }, process.env.JWT_SECRET || 'secret');
    const bobHeader = { Authorization: `Bearer ${bobToken}` };
    console.log(`✅ Bob Registered: ${bobRes.user.id}`);

    // 5. Connect Realtime Sockets for Alice and Bob
    console.log('\n🔌 Connecting Socket.io instances...');
    const aliceSocket = Client(SOCKET_URL);
    const bobSocket = Client(SOCKET_URL);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Subscribe to events
    let eventsCaught = {
      project_updated: false,
      member_joined: false,
      new_message: false,
      feed_update: false,
      new_progress_log: false
    };

    bobSocket.emit('join_project_room', projectId);
    aliceSocket.emit('join_project_room', projectId);

    bobSocket.on('project_updated', () => { eventsCaught.project_updated = true; });
    aliceSocket.on('member_joined', () => { eventsCaught.member_joined = true; });
    aliceSocket.on('receive_message', () => { eventsCaught.new_message = true; });
    bobSocket.on('feed_update', () => { eventsCaught.feed_update = true; });
    aliceSocket.on('new_progress_log', () => { eventsCaught.new_progress_log = true; });

    // 6. User B (Bob): Join Project
    console.log('\n🤝 [User B] Bob joining project...');
    await request(`/projects/${projectId}/join`, 'POST', {
      role: 'Fullstack Dev',
      commitmentLevel: 'Part-time'
    }, bobHeader);
    console.log('✅ Bob Joined the project');

    // Wait for sockets
    await new Promise(resolve => setTimeout(resolve, 800));

    // 7. User B (Bob): Send message in chat
    console.log('\n💬 [User B] Bob sending message...');
    bobSocket.emit('send_message', { projectId, senderId: bobRes.user.id, content: "Hey Alice! Excited to build Unico." });
    console.log('✅ Message emitted');

    // Wait for sockets
    await new Promise(resolve => setTimeout(resolve, 800));

    // 8. User A (Alice): Post progress log
    console.log('\n📈 [User A] Alice posting progress log...');
    await request(`/logs/${projectId}`, 'POST', {
      content: "Bob just joined the team! We are shipping V1 today."
    }, aliceHeader);
    console.log('✅ Progress log created');

    // Wait for sockets
    await new Promise(resolve => setTimeout(resolve, 800));

    // 9. Validation
    console.log('\n📊 Validating System State...');

    const dbProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true, progressLogs: true }
    });

    const bobProfile = await prisma.user.findUnique({
      where: { id: bobRes.user.id },
      include: { memberships: true }
    });

    const aliceProfile = await prisma.user.findUnique({
      where: { id: aliceRes.user.id },
      include: { progressLogs: true }
    });

    const messages = await prisma.message.findMany({ where: { projectId } });

    console.log('\n=== REAL-TIME EVENTS ASSERTION ===');
    console.log(`Global feed_update caught: ${eventsCaught.feed_update}`);
    console.log(`project_updated caught: ${eventsCaught.project_updated}`);
    console.log(`member_joined caught: ${eventsCaught.member_joined}`);
    console.log(`receive_message caught: ${eventsCaught.new_message}`);
    console.log(`new_progress_log caught: ${eventsCaught.new_progress_log}`);

    const allEventsPass = Object.values(eventsCaught).every(v => v === true);

    console.log('\n=== DATABASE ASSERTION ===');
    const memberCountPass = dbProject!.members.length === 2;
    const logCountPass = dbProject!.progressLogs.length === 1;
    const messagePass = messages.length === 1;
    const profilePass = bobProfile!.memberships.length === 1 && aliceProfile!.progressLogs.length === 1;

    console.log(`Members length == 2: ${memberCountPass}`);
    console.log(`Logs length == 1: ${logCountPass}`);
    console.log(`Messages length == 1: ${messagePass}`);
    console.log(`Profile linking synced: ${profilePass}`);

    if (allEventsPass && memberCountPass && logCountPass && messagePass && profilePass) {
      console.log('\n🎉 E2E TEST PASSED! The MVP collaboration loop works flawlessly.');
    } else {
      console.error('\n❌ E2E TEST FAILED. Data misaligned or Sockets dropped.');
      process.exit(1);
    }

    // Cleanup
    aliceSocket.disconnect();
    bobSocket.disconnect();

  } catch (error: any) {
    console.error('❌ Error during E2E flow:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
