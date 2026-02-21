'use strict';

const FMT = 'YYYY-MM-DD HH:mm:ss';

/**
 * Parse timestamp string to Date. Accepts "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DD HH:mm".
 * @param {string} s
 * @returns {{ ok: boolean, date?: Date, error?: string }}
 */
function parseTimestamp(s) {
  if (typeof s !== 'string' || s.length === 0) {
    return { ok: false, error: 'Invalid timestamp type or empty' };
  }
  const trimmed = s.trim();
  const withSeconds = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  const withoutSeconds = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
  let dateStr = trimmed;
  if (withoutSeconds.test(trimmed)) {
    dateStr = trimmed + ':00';
  } else if (!withSeconds.test(trimmed)) {
    return { ok: false, error: 'Timestamp must match YYYY-MM-DD HH:mm:ss' };
  }
  const date = new Date(dateStr.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: 'Invalid date value' };
  }
  return { ok: true, date };
}

/**
 * Format Date to "YYYY-MM-DD HH:mm:ss".
 * @param {Date} d
 * @returns {string}
 */
function formatTimestamp(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const sec = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}:${sec}`;
}

/**
 * Check if date is within [start, end] inclusive (by time).
 * @param {Date} date
 * @param {Date} start
 * @param {Date} end
 * @returns {boolean}
 */
function inRangeInclusive(date, start, end) {
  const t = date.getTime();
  return t >= start.getTime() && t <= end.getTime();
}

module.exports = {
  FMT,
  parseTimestamp,
  formatTimestamp,
  inRangeInclusive,
};
