// The state holder for the booking form (Meeting 9), written as a React hook.
// Events go up (onEvent); one state value comes down.
import { useState } from 'react';
import { BookingRefused, type BookingRepository } from '../data/bookings';

export type BookingField = 'date' | 'start' | 'end';
type Fields = Record<BookingField, string>;

export type BookingFormState = Fields & (
  | { kind: 'editing'; error: string | null }
  | { kind: 'submitting' }
);

export type BookingFormEvent =
  | { type: 'FieldChanged'; field: BookingField; value: string }
  | { type: 'ConfirmTapped' };

const pad = (n: number) => String(n).padStart(2, '0');

function initialFields(): Fields {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;
  return { date, start: '19:00', end: '20:00' };
}

// null when the text is not a real local date and time, such as 2026-02-31 or 25:00.
function toDate(date: string, time: string): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!d || !t) return null;
  const value = new Date(+d[1], +d[2] - 1, +d[3], +t[1], +t[2]);
  const real = value.getMonth() === +d[2] - 1 && value.getDate() === +d[3]
    && value.getHours() === +t[1] && value.getMinutes() === +t[2];
  return real ? value : null;
}

export function useBookingFormScreen(repo: BookingRepository, courtId: string, onBooked: () => void) {
  const [state, setState] = useState<BookingFormState>(
    () => ({ kind: 'editing', error: null, ...initialFields() }));

  const confirm = async (fields: Fields) => {
    const start = toDate(fields.date, fields.start);
    const end = toDate(fields.date, fields.end);
    if (!start || !end) {
      setState({ ...fields, kind: 'editing', error: 'Enter the date as YYYY-MM-DD and times as HH:MM.' });
      return;
    }
    if (end <= start) {
      setState({ ...fields, kind: 'editing', error: 'The end time must be after the start time.' });
      return;
    }

    setState({ ...fields, kind: 'submitting' });
    try {
      await repo.create({ courtId, startTime: start.toISOString(), endTime: end.toISOString() });
      onBooked();
    } catch (e) {
      const error = e instanceof BookingRefused
        ? e.message
        : 'We could not reach the server. Please try again.';
      setState({ ...fields, kind: 'editing', error });
    }
  };

  const onEvent = (e: BookingFormEvent) => {
    if (state.kind !== 'editing') return;
    const { date, start, end } = state;
    if (e.type === 'FieldChanged') {
      setState({ date, start, end, kind: 'editing', error: null, [e.field]: e.value });
    } else {
      confirm({ date, start, end });
    }
  };

  return { state, onEvent };
}
