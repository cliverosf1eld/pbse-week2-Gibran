## Checkpoint 1
I initially thought of using 'GET/dashboard' as an address, but a dashboard is only a screen than a resource. It should be split into resources such as '/courts', '/bookings', and '/users', because courts, bookings, and users are identifiable things that persist and can change independently.

## Checkpoint 2
For cancelling a booking, I would use POST /bookings/{id}/cancellation rather than POST /cancelBooking. The verb based address is worse because it treats the operation itself as the resource and doesn't clearly identify which booking is being changed.

## Checkpoint 3
Reading the available courts or an existing booking is safe to repeat because repeating the request doesn't create another resource. But creating a booking is different because retrying after a network failure could create another booking, so the booking operation needs protection using an idempotency key.

## Part 4: Self-Check

### Question 1
I would reject `POST /v1/orders/{id}/markReady` because `markReady` is a verb in the URI rather than a resource represented by a noun. It also hides the state transition inside an action name instead of representing the transition as a resource. I would use a noun-based address such as `POST /v1/orders/{id}/readiness`.

### Question 2
No, `PUT /v1/menu-items/itm_3Bn` is not read-only because it changes or replaces the resource. Yes, it is safe to repeat because PUT is idempotent, so sending the same complete representation again should result in the same final state.

### Question 3
A sold-out item is a `409 Conflict`, which is a domain/business-rule failure. Using `500` is wrong because the server has not failed; the request was understood but cannot be fulfilled because of the current business state. Using `200` is wrong because the requested operation was not successfully completed, so the client could incorrectly interpret it as a successful purchase.

### Question 4
The dangerous operation in my system is `POST /bookings`, represented by the `createBooking` operation in my `openapi.yaml`. Creating a booking must not happen twice because a network failure and retry could otherwise result in the same badminton court being booked multiple times. The operation requires the `Idempotency-Key` header, which the client must reuse when retrying the same booking intent. Reusing the same key with a different request body returns `409 idempotency-key-reuse`.

### Question 5
I am still unsure about how the idempotency key should actually be stored and checked by the backend when the same booking request is retried.

## Where I Stand

### Result: PASS

I believe I meet the PASS criteria because my OpenAPI specification lints successfully, and I saved the successful mock responses and the missing-header refusal in the `spec/evidence` directory. My consequential operation is `POST /bookings`, and it requires the `Idempotency-Key` header. The specification was committed before any service code, so I believe I meet the five lab conditions for PASS.
