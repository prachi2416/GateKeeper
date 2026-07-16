-- Token Bucket Rate Limiting (Atomic)
-- KEYS[1] = bucket key
-- ARGV[1] = capacity (max tokens)
-- ARGV[2] = refill rate (tokens per millisecond)
-- ARGV[3] = current timestamp (ms)
-- ARGV[4] = cost (tokens to consume, usually 1)
-- ARGV[5] = ttl (ms)

local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refillRate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local cost = tonumber(ARGV[4])
local ttl = tonumber(ARGV[5])

local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
local tokens = tonumber(bucket[1])
local lastRefill = tonumber(bucket[2])

if tokens == nil then
  tokens = capacity
  lastRefill = now
end

local elapsed = now - lastRefill
local newTokens = math.min(capacity, tokens + (elapsed * refillRate))

local allowed = 0
local remaining = 0

if newTokens >= cost then
  newTokens = newTokens - cost
  allowed = 1
  remaining = math.floor(newTokens)
else
  remaining = math.floor(newTokens)
end

redis.call('HMSET', key, 'tokens', newTokens, 'lastRefill', now)
redis.call('PEXPIRE', key, ttl)

return { allowed, remaining }
