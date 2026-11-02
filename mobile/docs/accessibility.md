# Accessibility checks: book a badminton court

Screens checked: the three screens in [screen-flow.png](screen-flow.png), plus sign-in.

- Tested by: _name_
- Date: _date_
- Phone and OS version: _phone, Android or iOS version_

## The four checks

| Check | How to run it | It fails when | Result | Fix |
| --- | --- | --- | --- | --- |
| Screen reader | Turn on TalkBack or VoiceOver; complete the task without looking | A control is read as "button, unlabelled" | _Pass or fail, and what was read_ | _See below; add anything found on the phone_ |
| Largest font | Set the system font to its maximum | Text is cut off or overlaps | _Pass or fail, and on which screen_ | _See below; add anything found on the phone_ |
| Greyscale | Switch the display to greyscale | Two different states look the same | _Pass or fail, and which states_ | _See below; add anything found on the phone_ |
| One hand, walking | Hold a bottle in the other hand, and walk | The primary action needs the second hand | _Pass or fail, and on which screen_ | _See below; add anything found on the phone_ |

## Evidence

- Screenshot at the largest font: _file name_
- A label TalkBack reads: _exact words, for example from the Confirm booking button_

## Changes made before the phone checks

These were made while building the screens. The results above still have to come from a real phone.

### Screen reader

- Every button has a role and a label naming its action, such as "Confirm booking for Court 1" and "Retry loading the courts".
- A court card reads as one radio control with its name, location, type, status and availability.
- Each form field's label includes the expected format, such as "Date (YYYY-MM-DD)".
- Errors on the booking form and sign-in screen are announced when they appear.

### Largest font

- No text container has a fixed height, and buttons grow with their text.
- Every screen's main content scrolls, so large text is not cut off.

### Greyscale

- Availability and booking status are words: "Available", "Unavailable", "✓ Selected", "✓ Confirmed", "✕ Cancelled".
- A selected court also has a thicker border.
- Errors on the booking form and sign-in screen start with "⚠" and are bold.
- A disabled button changes its words as well as its colour.
- The button colour changed from `#aa3bff` to `#8124d6`, because white text on the old colour had 4.39:1 contrast, below the 4.5:1 minimum. It now has 6.65:1.

### One hand, walking

- Each screen's primary action is at the bottom, within thumb reach.
- Touch targets are at least 48 dp high.
- The booking form moves Confirm above the keyboard.
- The form's fields are already filled in, so the usual booking needs no typing.
