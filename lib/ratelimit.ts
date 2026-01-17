// Basic in-memory rate limiter
// In a production environment, use Redis or a similar store.

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export function checkRateLimit(ip: string, limit: number = 20, windowMs: number = 60000) {
    const now = Date.now();
    const userData = rateLimitMap.get(ip) || { count: 0, lastReset: now };

    if (now - userData.lastReset > windowMs) {
        userData.count = 0;
        userData.lastReset = now;
    }

    userData.count += 1;
    rateLimitMap.set(ip, userData);

    return userData.count <= limit;
}
