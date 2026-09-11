from datetime import datetime, timezone, timedelta
from typing import Optional

def format_event_time(dt: Optional[datetime]) -> str:
    """
    Formats a UTC datetime into a human-friendly relative/calendar timestamp
    based on the system local timezone.
    Examples:
      - Less than 2 minutes: "Just now"
      - Under 60 minutes: "15m ago"
      - Today: "Today, 11:42 am"
      - Yesterday: "Yesterday, 4:22 pm"
      - Current year: "9 Sep, 4:22 pm"
      - Previous years: "9 Sep 2025, 4:22 pm"
    """
    if not dt:
        return "Just now"

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)

    local_dt = dt.astimezone()
    now = datetime.now(timezone.utc).astimezone()

    diff_sec = (now - local_dt).total_seconds()

    if diff_sec < 120:
        return "Just now"

    if diff_sec < 3600:
        mins = max(1, int(diff_sec // 60))
        return f"{mins}m ago"

    time_part = local_dt.strftime("%I:%M %p").lstrip("0").lower()

    if local_dt.date() == now.date():
        return f"Today, {time_part}"

    yesterday = (now - timedelta(days=1)).date()
    if local_dt.date() == yesterday:
        return f"Yesterday, {time_part}"

    day_month = f"{local_dt.day} {local_dt.strftime('%b')}"

    if local_dt.year == now.year:
        return f"{day_month}, {time_part}"
    return f"{day_month} {local_dt.year}, {time_part}"
