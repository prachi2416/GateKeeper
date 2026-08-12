local key = KEYS[1]

local limit = tonumber(ARGV[1])
local window_ms = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local current_window = math.floor(now / window_ms)
local previous_window = current_window - 1

local current_key = key .. ":" .. current_window
local previous_key = key .. ":" .. previous_window

local current_count = tonumber(redis.call("GET", current_key) or "0")
local previous_count = tonumber(redis.call("GET", previous_key) or "0")

local window_start = current_window * window_ms
local elapsed = now - window_start

local weight = (window_ms - elapsed) / window_ms

local estimated_count =
    previous_count * weight + current_count

local allowed = 0

if estimated_count < limit then
    current_count = current_count + 1

    redis.call(
        "SET",
        current_key,
        current_count,
        "PX",
        window_ms * 2
    )

    estimated_count = estimated_count + 1
    allowed = 1
end

local remaining = math.max(
    0,
    math.floor(limit - estimated_count)
)

return {
    allowed,
    remaining,
    limit
}