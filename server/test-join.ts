import { io } from 'socket.io-client';

async function verify() {
  console.log('--- STARTING JOIN PROJECT VERIFICATION ---');
  const API_URL = 'http://localhost:3000/api';

  try {
    // 1. Register User A (Alice - Project Creator)
    console.log('1. Registering Alice...');
    const resA = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice', email: `alice_${Date.now()}@test.com`, password: 'password', university: 'Macquarie' })
    });
    const { token: tokenA, user: alice } = await resA.json();

    // 2. Register User B (Bob - Joiner)
    console.log('2. Registering Bob...');
    const resB = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bob', email: `bob_${Date.now()}@test.com`, password: 'password', university: 'Macquarie' })
    });
    const { token: tokenB, user: bob } = await resB.json();

    // 3. Alice Creates a Project
    console.log('3. Alice creating a project...');
    const resProj = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify({ title: 'AI Collaboration App', description: 'Testing the app' })
    });
    const project = await resProj.json();
    console.log(`Created Project: ${project.id}`);

    // 4. Bob Connects to Socket.io
    console.log('4. Bob connecting to Socket.io...');
    const socket = io('http://localhost:3000', { transports: ['websocket'] });
    
    // We will listen for 'project_updated'
    let socketEventReceived = false;
    socket.on('project_updated', (data) => {
      console.log('>>> RECEIVED Socket.io Event: project_updated!');
      console.log(`>>> New Member Count: ${data.members.length}`);
      if (data.members.length === 2 && data.members.some((m:any) => m.userId === bob.id)) {
        socketEventReceived = true;
      }
    });

    // We also listen for `member_joined` in the project room
    socket.emit('join_project_room', project.id);
    socket.on('member_joined', (member) => {
      console.log(`>>> RECEIVED Socket.io Event: member_joined in project room! Role: ${member.role}`);
    });

    // Wait a brief moment for socket connection
    await new Promise(r => setTimeout(r, 500));

    // 5. Bob clicks "Join Project" (Trigger API)
    console.log('5. Bob sending Join Project request...');
    const resJoin = await fetch(`${API_URL}/projects/${project.id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenB}` },
      body: JSON.stringify({ role: 'Frontend Dev', commitmentLevel: 'Part-time' })
    });
    const joinData = await resJoin.json();
    
    if (resJoin.status === 201) {
      console.log(`Successfully joined project in backend! memberId: ${joinData.id}`);
    } else {
      console.error('Failed to join:', joinData);
    }

    // Wait for sockets to arrive
    await new Promise(r => setTimeout(r, 1000));

    if (socketEventReceived) {
      console.log('✅ ALL TESTS PASSED: Join flow API and Socket.io events worked flawlessly.');
    } else {
      console.error('❌ TESTS FAILED: Did not receive expected Socket events.');
    }

    socket.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

verify();
