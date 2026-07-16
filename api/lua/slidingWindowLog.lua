-- Sliding Window Log Rate Limiting (Atomic)
-- KEYS[1] = log key (sorted set)
-- ARGV[1] = current timestamp (ms)
-- ARGV[2] = window size (ms)
-- ARGV[3] = limit (max requests)
-- ARGV[4] = ttl (ms)

local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local ttl = tonumber(ARGV[4])
local windowStart = now - window

-- Remove expired entries
redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)

-- Count current entries
local count = redis.call('ZCARD', key)

local allowed = 0
local remaining = limit - count

if count < limit then
  -- Add current request
  redis.call('ZADD', key, now, now .. ':' .. redis.call('INCR', key .. ':seq'))
  redis.call('PEXPIRE', key, ttl)
  allowed = 1
  remaining = remaining - 1
end

return { allowed, remaining }
