## Checkpoint 1
I initially thought of using 'GET/dashboard' as an address, but a dashboard is only a screen than a resource. It should be split into resources such as '/courts', '/bookings', and '/users', because courts, bookings, and users are identifiable things that persist and can change independently.

## Checkpoint 2
For cancelling a booking, I would use POST /bookings/{id}/cancellation rather than POST /cancelBooking. The verb based address is worse because it treats the operation itself as the resource and doesn't clearly identify which booking is being changed.

## Checkpoint 3
Reading the available courts or an existing booking is safe to repeat because repeating the request doesn't create another resource. But creating a booking is different because retrying after a network failure could create another booking, so the booking operation needs protection using an idempotency key.
