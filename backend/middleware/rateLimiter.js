// Simple in-memory rate limiter (production mein Redis-based use karo)
const requestCounts = new Map();

const rateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    return (req, res, next) => {
        const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
        const now = Date.now();
        const windowStart = now - windowMs;

        if (!requestCounts.has(ip)) {
            requestCounts.set(ip, []);
        }

        const requests = requestCounts.get(ip).filter(time => time > windowStart);
        requests.push(now);
        requestCounts.set(ip, requests);

        if (requests.length > maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please try again later.'
            });
        }

        next();
    };
};

// Strict limiter for auth routes
const authRateLimiter = rateLimiter(10, 15 * 60 * 1000); // 10 requests per 15 min
const generalRateLimiter = rateLimiter(200, 15 * 60 * 1000); // 200 per 15 min

module.exports = { rateLimiter, authRateLimiter, generalRateLimiter };
