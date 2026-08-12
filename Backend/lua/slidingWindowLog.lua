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

    -- Add each requested event
    for i = 1, requested do
        local event_id =
    tostring(now) .. ":" ..
    tostring(i) .. ":" ..
    tostring(redis.call("INCR", key .. ":sequence"))

        redis.call(
            "ZADD",
            key,
            now,
            event_id
        )
    end

    allowed = 1
end

local new_count = redis.call(
    "ZCARD",
    key
)

local remaining = math.max(
    0,
    limit - new_count
)

-- Keep Redis key alive slightly longer than the window
redis.call(
    "PEXPIRE",
    key,
    window_ms + 1000
)

return {
    allowed,
    remaining,
    limit
}