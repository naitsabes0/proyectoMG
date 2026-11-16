const crypto = require('crypto');

const secret = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const tokenLifetimeSeconds = 8 * 60 * 60;

function base64url(value) {
  return Buffer.from(value).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function signToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    sub: user.id,
    role: user.rol,
    email: user.email,
    iat: now,
    exp: now + tokenLifetimeSeconds,
  }));
  const unsigned = `${header}.${payload}`;
  const signature = crypto.createHmac('sha256', secret).update(unsigned).digest('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${unsigned}.${signature}`;
}

function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const unsigned = `${parts[0]}.${parts[1]}`;
  const expected = crypto.createHmac('sha256', secret).update(unsigned).digest();
  let actual;
  try {
    actual = Buffer.from(parts[2].replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    if (!Number.isSafeInteger(payload.sub) || !payload.role || !payload.exp || payload.exp <= Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

module.exports = { signToken, verifyToken };
