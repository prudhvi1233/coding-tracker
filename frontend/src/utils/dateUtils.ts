import { format } from 'date-fns';

export const safeFormatDate = (val: any, formatStr: string, fallback: string = 'N/A'): string => {
  if (!val) return fallback;
  let d: Date;
  if (typeof val === 'number') {
    d = new Date(val);
  } else if (typeof val === 'string' && !isNaN(Number(val)) && !val.includes('-') && !val.includes(':')) {
    d = new Date(Number(val));
  } else {
    d = new Date(val);
  }
  if (isNaN(d.getTime())) return fallback;
  try {
    return format(d, formatStr);
  } catch (e) {
    return fallback;
  }
};
