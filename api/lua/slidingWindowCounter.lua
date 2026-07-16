-- Sliding Window Counter Rate Limiting (Atomic)
-- KEYS[1] = current window counter key
-- KEYS[2] = previous window counter key
-- ARGV[1] = current timestamp (ms)
-- ARGV[2] = window size (ms)
-- ARGV[3] = limit (max requests)
-- ARGV[4] = ttl (ms)

local currentKey = KEYS[1]
local prevKey = KEYS[2]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local ttl = tonumber(ARGV[4])

local windowStart = math.floor(now / window) * window
local prevWindowStart = windowStart - window

local currentCount = tonumber(redis.call('GET', currentKey) or '0')
local prevCount = tonumber(redis.call('GET', prevKey) or '0')

-- If current window doesn't exist yet, it might be a new window
local currentKeyStart = redis.call('PTTL', currentKey)
if currentKeyStart == -2 then
  currentCount = 0
end

-- Calculate weighted count from previous window
local elapsedInWindow = now - windowStart
local weight = 1 - (elapsedInWindow / window)
local weightedCount = math.floor(prevCount * weight) + currentCount

local allowed = 0
local remaining = math.max(0, limit - weightedCount)

if weightedCount < limit then
  currentCount = currentCount + 1
  redis.call('SET', currentKey, currentCount, 'PX', ttl)
  allowed = 1
  remaining = remaining - 1
end

return { allowed, remaining }
