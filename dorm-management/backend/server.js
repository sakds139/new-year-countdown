import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.join(__dirname, '..', 'frontend');
const dbPath = path.join(__dirname, 'dorm.db');
const port = 5000;

const db = new DatabaseSync(dbPath);

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_number TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      room_number TEXT NOT NULL,
      phone TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run('admin', 'admin123');
  }

  const roomCount = db.prepare('SELECT COUNT(*) as count FROM rooms').get().count;
  if (roomCount === 0) {
    db.prepare('INSERT INTO rooms (room_number, type, status) VALUES (?, ?, ?)').run('101', 'single', 'occupied');
    db.prepare('INSERT INTO rooms (room_number, type, status) VALUES (?, ?, ?)').run('102', 'double', 'available');
  }

  const tenantCount = db.prepare('SELECT COUNT(*) as count FROM tenants').get().count;
  if (tenantCount === 0) {
    db.prepare('INSERT INTO tenants (name, room_number, phone, status) VALUES (?, ?, ?, ?)').run('Alex', '101', '0812345678', 'active');
  }

  const billCount = db.prepare('SELECT COUNT(*) as count FROM bills').get().count;
  if (billCount === 0) {
    const tenant = db.prepare('SELECT id FROM tenants LIMIT 1').get();
    if (tenant) {
      db.prepare('INSERT INTO bills (tenant_id, amount, status) VALUES (?, ?, ?)').run(tenant.id, 1500, 'unpaid');
    }
  }
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function getContentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.js')) return 'application/javascript; charset=utf-8';
  return 'application/octet-stream';
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function getSearchClause(search) {
  if (!search) return { sql: '', params: [] };
  const term = `%${search}%`;
  return {
    sql: ' WHERE room_number LIKE ? OR type LIKE ? OR status LIKE ? ',
    params: [term, term, term]
  };
}

function getTenantSearchClause(search) {
  if (!search) return { sql: '', params: [] };
  const term = `%${search}%`;
  return {
    sql: ' WHERE name LIKE ? OR room_number LIKE ? OR phone LIKE ? OR status LIKE ? ',
    params: [term, term, term, term]
  };
}

function getBillSearchClause(search) {
  if (!search) return { sql: '', params: [] };
  const term = `%${search}%`;
  return {
    sql: ` WHERE t.name LIKE ? OR r.room_number LIKE ? OR b.status LIKE ? OR CAST(b.amount AS TEXT) LIKE ? `,
    params: [term, term, term, term]
  };
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url || '/', 'http://localhost');
  const pathname = parsedUrl.pathname;
  const searchParam = parsedUrl.searchParams.get('search') || '';

  if (pathname === '/api/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (pathname === '/api/login') {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed' });
      return;
    }

    const body = await parseBody(req);
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(body.username, body.password);
    if (!user) {
      sendJson(res, 401, { error: 'Invalid credentials' });
      return;
    }

    sendJson(res, 200, { success: true, message: 'Login successful' });
    return;
  }

  if (pathname === '/api/dashboard') {
    const roomCount = db.prepare('SELECT COUNT(*) as count FROM rooms').get().count;
    const tenantCount = db.prepare('SELECT COUNT(*) as count FROM tenants').get().count;
    const unpaidCount = db.prepare('SELECT COUNT(*) as count FROM bills WHERE status = ?').get('unpaid').count;
    const paidCount = db.prepare('SELECT COUNT(*) as count FROM bills WHERE status = ?').get('paid').count;
    const revenue = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM bills WHERE status = ?').get('paid').total;
    const recentBills = db.prepare(`
      SELECT b.id, b.amount, b.status, b.created_at, t.name as tenant_name
      FROM bills b
      LEFT JOIN tenants t ON t.id = b.tenant_id
      ORDER BY b.id DESC
      LIMIT 5
    `).all();

    sendJson(res, 200, {
      rooms: roomCount,
      occupants: tenantCount,
      unpaid: unpaidCount,
      paid: paidCount,
      revenue: Number(revenue),
      recentBills
    });
    return;
  }

  if (pathname === '/api/monthly-revenue') {
    const monthlyRevenue = db.prepare(`
      SELECT strftime('%Y-%m', created_at) as month, COALESCE(SUM(amount), 0) as revenue
      FROM bills
      WHERE status = 'paid' AND created_at IS NOT NULL
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
      LIMIT 6
    `).all();

    sendJson(res, 200, monthlyRevenue.reverse());
    return;
  }

  if (pathname === '/api/payment-history') {
    const history = db.prepare(`
      SELECT b.id, b.amount, b.created_at, b.status, t.name as tenant_name
      FROM bills b
      LEFT JOIN tenants t ON t.id = b.tenant_id
      WHERE b.status = 'paid'
      ORDER BY b.id DESC
    `).all();

    sendJson(res, 200, history);
    return;
  }

  if (pathname === '/api/rooms') {
    if (req.method === 'GET') {
      const { sql, params } = getSearchClause(searchParam);
      const statement = db.prepare(`SELECT * FROM rooms${sql} ORDER BY id`);
      const rooms = statement.all(...params);
      sendJson(res, 200, rooms);
      return;
    }

    if (req.method === 'POST') {
      const body = await parseBody(req);
      const statement = db.prepare('INSERT INTO rooms (room_number, type, status) VALUES (?, ?, ?)');
      const result = statement.run(body.roomNumber, body.type || 'single', body.status || 'available');
      sendJson(res, 201, { id: result.lastInsertRowid, roomNumber: body.roomNumber, type: body.type || 'single', status: body.status || 'available' });
      return;
    }

    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  if (pathname.startsWith('/api/rooms/')) {
    const id = Number(pathname.split('/').pop());
    if (req.method === 'PUT') {
      const body = await parseBody(req);
      db.prepare('UPDATE rooms SET room_number = ?, type = ?, status = ? WHERE id = ?').run(body.roomNumber, body.type, body.status, id);
      const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
      sendJson(res, 200, room);
      return;
    }

    if (req.method === 'DELETE') {
      db.prepare('DELETE FROM rooms WHERE id = ?').run(id);
      sendJson(res, 200, { success: true });
      return;
    }

    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  if (pathname === '/api/tenants') {
    if (req.method === 'GET') {
      const { sql, params } = getTenantSearchClause(searchParam);
      const statement = db.prepare(`SELECT * FROM tenants${sql} ORDER BY id`);
      const tenants = statement.all(...params);
      sendJson(res, 200, tenants);
      return;
    }

    if (req.method === 'POST') {
      const body = await parseBody(req);
      const statement = db.prepare('INSERT INTO tenants (name, room_number, phone, status) VALUES (?, ?, ?, ?)');
      const result = statement.run(body.name, body.roomNumber, body.phone, body.status || 'active');
      sendJson(res, 201, { id: result.lastInsertRowid, name: body.name, roomNumber: body.roomNumber, phone: body.phone, status: body.status || 'active' });
      return;
    }

    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  if (pathname.startsWith('/api/tenants/')) {
    const id = Number(pathname.split('/').pop());
    if (req.method === 'PUT') {
      const body = await parseBody(req);
      db.prepare('UPDATE tenants SET name = ?, room_number = ?, phone = ?, status = ? WHERE id = ?').run(body.name, body.roomNumber, body.phone, body.status, id);
      const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(id);
      sendJson(res, 200, tenant);
      return;
    }

    if (req.method === 'DELETE') {
      db.prepare('DELETE FROM tenants WHERE id = ?').run(id);
      sendJson(res, 200, { success: true });
      return;
    }

    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  if (pathname === '/api/bills') {
    if (req.method === 'GET') {
      const { sql, params } = getBillSearchClause(searchParam);
      const statement = db.prepare(`
        SELECT b.id, b.tenant_id as tenantId, b.amount, b.status, b.created_at, t.name as tenantName
        FROM bills b
        LEFT JOIN tenants t ON t.id = b.tenant_id
        LEFT JOIN rooms r ON r.room_number = t.room_number${sql}
        ORDER BY b.id DESC
      `);
      const bills = statement.all(...params);
      sendJson(res, 200, bills);
      return;
    }

    if (req.method === 'POST') {
      const body = await parseBody(req);
      const statement = db.prepare('INSERT INTO bills (tenant_id, amount, status) VALUES (?, ?, ?)');
      const result = statement.run(Number(body.tenantId), Number(body.amount), body.status || 'unpaid');
      sendJson(res, 201, { id: result.lastInsertRowid, tenantId: Number(body.tenantId), amount: Number(body.amount), status: body.status || 'unpaid' });
      return;
    }

    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  if (pathname.startsWith('/api/bills/')) {
    const id = Number(pathname.split('/').pop());
    if (req.method === 'PUT') {
      const body = await parseBody(req);
      db.prepare('UPDATE bills SET tenant_id = ?, amount = ?, status = ? WHERE id = ?').run(Number(body.tenantId), Number(body.amount), body.status, id);
      const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(id);
      sendJson(res, 200, bill);
      return;
    }

    if (req.method === 'DELETE') {
      db.prepare('DELETE FROM bills WHERE id = ?').run(id);
      sendJson(res, 200, { success: true });
      return;
    }

    if (req.method === 'POST' && pathname.endsWith('/pay')) {
      db.prepare('UPDATE bills SET status = ? WHERE id = ?').run('paid', id);
      sendJson(res, 200, { success: true });
      return;
    }

    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const filePath = pathname === '/' ? path.join(frontendDir, 'index.html') : path.join(frontendDir, pathname.replace(/^\/+/, ''));
  if (!filePath.startsWith(frontendDir)) {
    sendJson(res, 403, { error: 'Forbidden' });
    return;
  }

  if (!fs.existsSync(filePath)) {
    const fallbackPath = path.join(frontendDir, 'index.html');
    res.writeHead(200, { 'Content-Type': getContentType(fallbackPath) });
    res.end(fs.readFileSync(fallbackPath));
    return;
  }

  res.writeHead(200, { 'Content-Type': getContentType(filePath) });
  res.end(fs.readFileSync(filePath));
});

initDb();
server.listen(port, () => {
  console.log(`Dorm management server running at http://localhost:${port}`);
});
