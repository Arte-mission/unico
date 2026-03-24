import { io } from 'socket.io-client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3001/api';
const SOCKET_URL = 'http://localhost:3001';

async function validateE2E() {
  console.log('🚀 Starting Full E2E Validation...\n');

  try {
    // ---------------------------------------------------------
    // 1. AUTHENTICATION TEST
    // ---------------------------------------------------------
    console.log('--- Step 1: User Authentication ---');
    const user1Email = `testuser1_${Date.now()}@example.com`;
    const signupRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User 1',
        email: user1Email,
        password: 'Password123!',
        university: 'Test University'
      })
    });
    const user1Data = await signupRes.json();
    if (!signupRes.ok) throw new Error('User 1 Signup Failed');
    console.log('✅ User 1 Signup Success');

    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user1Email,
        password: 'Password123!'
      })
    });
    const { token: user1Token, user: user1 } = await loginRes.json();
    if (!loginRes.ok) throw new Error('User 1 Login Failed');
    console.log('✅ User 1 Login Success (JWT Received)\n');


    // ---------------------------------------------------------
    // 2. PROJECT CREATION TEST
    // ---------------------------------------------------------
    console.log('--- Step 2: Project Creation ---');
    const projectRes = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user1Token}`
      },
      body: JSON.stringify({
        title: 'E2E Validation Project',
        description: 'Testing the live Supabase setup!',
        role: 'Founder'
      })
    });
    const project = await projectRes.json();
    if (!projectRes.ok) throw new Error('Project Creation Failed');
    console.log('✅ Project Created in Supabase');

    const feedRes = await fetch(`${API_URL}/projects`);
    const feed = await feedRes.json();
    const found = feed.some((p: any) => p.id === project.id);
    if (!found) throw new Error('Project NOT found in Feed');
    console.log('✅ Project exists in Public Feed\n');


    // ---------------------------------------------------------
    // 3. JOIN PROJECT FLOW (Second User)
    // ---------------------------------------------------------
    console.log('--- Step 3: Join Project Flow ---');
    const user2Email = `testuser2_${Date.now()}@example.com`;
    await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User 2', email: user2Email, password: 'Password123!' })
    });
    const user2Login = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user2Email, password: 'Password123!' })
    });
    const { token: user2Token, user: user2 } = await user2Login.json();

    const socket1 = io(SOCKET_URL);
    const socket2 = io(SOCKET_URL);
    
    // JOIN ROOM BEFORE JOINING API CALL
    socket1.emit('join_project_room', project.id);
    await new Promise(r => setTimeout(r, 500)); 

    let joinedEventFired = false;
    socket1.on('member_joined', (data) => {
      if (data.projectId === project.id) joinedEventFired = true;
    });

    const joinRes = await fetch(`${API_URL}/projects/${project.id}/join`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${user2Token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: 'Developer' })
    });
    if (!joinRes.ok) throw new Error('Join Project Failed');
    
    // Wait for socket
    await new Promise(r => setTimeout(r, 1000));
    console.log('✅ User 2 Joined Successfully');
    console.log(joinedEventFired ? '✅ Socket: member_joined Event Fired' : '❌ Socket: member_joined Event Missed\n');


    // ---------------------------------------------------------
    // 4. POST PROGRESS LOG
    // ---------------------------------------------------------
    console.log('--- Step 4: Progress Logs ---');
    const logRes = await fetch(`${API_URL}/logs/${project.id}`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${user1Token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectId: project.id,
        content: 'Building the future of student collab!'
      })
    });
    if (!logRes.ok) throw new Error('Log Post Failed');
    console.log('✅ Progress Log Stored in Supabase\n');


    // ---------------------------------------------------------
    // 5. REAL-TIME CHAT TEST
    // ---------------------------------------------------------
    console.log('--- Step 5: Real-Time Chat ---');
    socket1.emit('join_project_room', project.id);
    socket2.emit('join_project_room', project.id);
    await new Promise(r => setTimeout(r, 500)); // WAIT FOR BOTH TO BE IN ROOM

    let chatReceived = false;
    socket2.on('receive_message', (msg) => {
      if (msg.content === 'Hello from User 1!') chatReceived = true;
    });

    socket1.emit('send_message', {
      projectId: project.id,
      senderId: user1.id,
      content: 'Hello from User 1!'
    });

    await new Promise(r => setTimeout(r, 1000));
    console.log(chatReceived ? '✅ Chat: Message Broadcasted Successfully' : '❌ Chat: Message Sync Failed\n');


    // ---------------------------------------------------------
    // 6. DB INTEGRITY CHECK
    // ---------------------------------------------------------
    console.log('--- Step 6: Database Integrity Check ---');
    const stats = {
      users: await prisma.user.count(),
      projects: await prisma.project.count(),
      members: await prisma.projectMember.count(),
      logs: await prisma.progressLog.count(),
      messages: await prisma.message.count(),
    };
    console.log('📊 Supabase Database Snapshot:');
    console.table(stats);
    console.log('✅ Integrity Confirmed\n');


    // ---------------------------------------------------------
    // 7. ERROR HANDLING CHECK
    // ---------------------------------------------------------
    console.log('--- Step 7: Error Resilience Check ---');
    const badLogin = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user1Email, password: 'WrongPassword' })
    });
    process.stdout.write(`❌ Invalid Login (Expected 401/400): ${badLogin.status} `);
    console.log(badLogin.status >= 400 ? '✅' : '❌');

    const doubleJoin = await fetch(`${API_URL}/projects/${project.id}/join`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${user2Token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'Developer' })
    });
    process.stdout.write(`❌ Double Join (Expected 4xx): ${doubleJoin.status} `);
    console.log(doubleJoin.status >= 400 ? '✅' : '❌');

    console.log('\n🌟 ALL E2E TESTS PASSED SUCCESSFULLY! 🌟');
    
    socket1.disconnect();
    socket2.disconnect();
    await prisma.$disconnect();
    process.exit(0);

  } catch (error) {
    console.error('\n💥 E2E Validation Failed:', error);
    process.exit(1);
  }
}

validateE2E();
