local key = KEYS[1]

local window = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local current_window = math.floor(now / window)
local previous_window = current_window - 1

local current_key = key .. ":" .. current_window
local previous_key = key .. ":" .. previous_window

local current_count = tonumber(
    redis.call("GET", current_key)
) or 0

local previous_count = tonumber(
    redis.call("GET", previous_key)
) or 0

local elapsed = now % window

local weight = 1 - (elapsed / window)

local estimated_count =
    previous_count * weight +
    current_count

local allowed = 0

if estimated_count < limit then

    current_count = redis.call(
        "INCR",
        current_key
    )

    redis.call(
        "EXPIRE",
        current_key,
        window * 2
    )

    allowed = 1

end

local remaining = math.max(
    0,
    math.floor(limit - estimated_count - allowed)
)

return {
    allowed,
    remaining,
    limit
}