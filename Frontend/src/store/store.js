import { writable } from "svelte/store";

// Create a writable store with initial value `false`
export const dealerLoginStatus = writable(false);
