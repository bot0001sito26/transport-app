from datetime import datetime
from zoneinfo import ZoneInfo


def ecuador_now():
    """Devuelve la fecha y hora exacta actual de Ecuador (UTC-5)"""
    return datetime.now(ZoneInfo("America/Guayaquil"))
