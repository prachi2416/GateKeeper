local key = KEYS[1]

local limit = tonumber(ARGV[1])
local window_ms = tonumber(ARGV[2])
local requested = tonumber(ARGV[3])
local now = tonumber(ARGV[4])

local window_start = now - window_ms

-- Remove requests outside the current window
redis.call(
    "ZREMRANGEBYSCORE",
    key,
    0,
    window_start
)

-- Count requests currently inside the window
local current_count = redis.call(
    "ZCARD",
    key
)

local allowed = 0

if current_count + requested <= limit then

    -- Add each requested request
    for i = 1, requested do
        local member = tostring(now) .. ":" .. tostring(i) .. ":" .. tostring(math.random(1000000))
        
        redis.call(
            "ZADD",
            key,
            now,
            member
        )
    end

    allowed = 1
    current_count = current_count + requested
end

-- Keep Redis key alive slightly longer than the window
redis.call(
    "PEXPIRE",
    key,
    window_ms + 60000
)

local remaining = math.max(
    0,
    limit - current_count
)

return {
    allowed,
    remaining,
    limit,
    current_count
}