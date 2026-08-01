export const messages = {
  fa: {
    focus: 'تمرکز',
    shortBreak: 'استراحت کوتاه',
    longBreak: 'استراحت بلند',
    idle: 'آماده',
    running: 'در حال اجرا',
    paused: 'متوقف',
  },
  en: {
    focus: 'Focus',
    shortBreak: 'Short Break',
    longBreak: 'Long Break',
    idle: 'Idle',
    running: 'Running',
    paused: 'Paused',
  },
} as const;

export type Lang = keyof typeof messages;
export type TKey = keyof (typeof messages)['fa'];
