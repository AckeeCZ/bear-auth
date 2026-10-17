---
'@bear-auth/core': patch
'@bear-auth/react': patch
'@bear-auth/storage': patch
---

Keep `authInfo` when the access token is refreshed during session retrieval. Previously the refreshed session was built from the empty store, so `authInfo: null` was persisted and broadcast before `fetchAuthInfo` completed. An interrupted `fetchAuthInfo` (closed tab, reload, offline) then left the session without auth info for good.

`retrieveAuthSession` now calls `fetchAuthInfo` whenever the hook is set, even when the persisted session has no `authInfo`, so such sessions recover on the next retrieval.

Retrying a failed refresh of an active session no longer fails with `bear-auth/not-authenticated`. A retry reads the session from the store again, so it uses tokens another tab delivered while the refresh was in flight, and it stops when the session was destroyed in the meantime. A successful refresh keeps `authInfo` delivered by another tab while the refresh was in flight.
