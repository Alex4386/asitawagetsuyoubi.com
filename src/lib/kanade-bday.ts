import { createDateInTimeZone, getDatePartsInTimeZone } from '@/lib/timezone';

// https://www.youtube.com/live/eytPidhJ6cI?t=7m19s
const KANADE_BIRTHDAY_MONTH = 4;
const KANADE_BIRTHDAY_DAY = 20;
const KANADE_BIRTHDAY_TIMEZONE = 'Asia/Tokyo';
const KANADE_BDAY_RANGE_DAYS = 7;
export const KANADE_CHANNEL_LINK = 'https://youtube.com/@OtonoseKanade';

function getKanadeBirthdayForYear(year: number) {
  return createDateInTimeZone({
    day: KANADE_BIRTHDAY_DAY,
    hour: 0,
    minute: 0,
    month: KANADE_BIRTHDAY_MONTH,
    second: 0,
    timeZone: KANADE_BIRTHDAY_TIMEZONE,
    year,
  });
}

// get current year's birthday in Japan time
export function getThisYearKanadeBirthday() {
  const now = new Date();
  const { year } = getDatePartsInTimeZone(now, KANADE_BIRTHDAY_TIMEZONE);
  return getKanadeBirthdayForYear(year);
}

export function getNextKanadeBirthday() {
  const thisYearBirthday = getThisYearKanadeBirthday();
  const now = new Date();

  if (now < thisYearBirthday) {
    return thisYearBirthday;
  }

  const { year } = getDatePartsInTimeZone(now, KANADE_BIRTHDAY_TIMEZONE);
  return getKanadeBirthdayForYear(year + 1);
}

export function isKanadeBirthdayRange() {
  const birthday = getNextKanadeBirthday();
  const now = new Date();
  const diffTime = birthday.getTime() - now.getTime();
  const diffDays = Math.abs(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays < KANADE_BDAY_RANGE_DAYS;
}

export function isKanadeBirthdayPassed() {
  const birthday = getThisYearKanadeBirthday();
  const now = new Date();
  return now.getTime() > birthday.getTime();
}
