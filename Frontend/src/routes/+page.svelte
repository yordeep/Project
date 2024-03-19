<script>
    import {dealerLoginStatus} from "../store/store"
    $: dealerLoggedIn = $dealerLoginStatus;
</script>

{#if dealerLoggedIn}
    <h1>dealer logged in</h1>
    {:else}
    <h1>this is home page</h1>
{/if}