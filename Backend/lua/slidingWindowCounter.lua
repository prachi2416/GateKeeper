local key = KEYS[1]

local limit = tonumber(ARGV[1])
local window_ms = tonumber(ARGV[2])
local requested = tonumber(ARGV[3])
local now = tonumber(ARGV[4])

local data = redis.call(
    "HMGET",
    key,
    "current_count",
    "previous_count",
    "window_start"
)

local current_count = tonumber(data[1]) or 0
local previous_count = tonumber(data[2]) or 0
local window_start = tonumber(data[3])

if window_start == nil then
    window_start = now
end

local elapsed = now - window_start

-- Move to the next window when necessary
if elapsed >= window_ms then

    local windows_passed = math.floor(
        elapsed / window_ms
    )

    if windows_passed == 1 then
        previous_count = current_count
    else
        previous_count = 0
    end

    current_count = 0

    window_start = window_start +
        (windows_passed * window_ms)

    elapsed = now - window_start
end

-- Calculate weighted previous-window contribution
local previous_weight =
    (window_ms - elapsed) / window_ms

local estimated_count =
    (previous_count * previous_weight) +
    current_count

local allowed = 0

if estimated_count + requested <= limit then
    current_count = current_count + requested
    allowed = 1
end

local new_estimated_count =
    (previous_count * previous_weight) +
    current_count

local remaining = math.max(
    0,
    math.floor(limit - new_estimated_count)
)

redis.call(
    "HSET",
    key,
    "current_count",
    current_count,
    "previous_count",
    previous_count,
    "window_start",
    window_start
)

redis.call(
    "PEXPIRE",
    key,
    window_ms * 2 + 60000
)

return {
    allowed,
    remaining,
    limit,
    math.floor(new_estimated_count)
}