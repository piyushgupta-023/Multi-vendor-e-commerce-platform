function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || !secret.trim()) {
    throw new Error('JWT_SECRET must be configured.');
  }
  return secret.trim();
}

module.exports = { getJwtSecret };
