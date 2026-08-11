local key = KEYS[1]

local window = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local request_id = ARGV[4]

local window_start = now - window

-- Remove requests outside the current window
redis.call(
    "ZREMRANGEBYSCORE",
    key,
    0,
    window_start
)

-- Count requests currently inside the window
local current = redis.call(
    "ZCARD",
    key
)

local allowed = 0

if current < limit then

    redis.call(
        "ZADD",
        key,
        now,
        request_id
    )

    allowed = 1

    current = current + 1

end

-- Keep Redis memory under control
redis.call(
    "EXPIRE",
    key,
    window + 1
)

local remaining = math.max(0, limit - current)

return {
    allowed,
    remaining,
    limit
}