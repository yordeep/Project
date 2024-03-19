<script>
  import "../app.css";
  import Footer from "../components/footer/footer.svelte";
  import Header from "../components/header/header.svelte";
  import Headerfordealer from "../components/headerfordealer/header.svelte";
  import { dealerLoginStatus } from "../store/store";

  let dealerLoggedIn = dealerLoginStatus;

  console.log($dealerLoggedIn);

</script>

{#if $dealerLoggedIn}
  <Headerfordealer/>
{:else}
  <Header/>
{/if}

<slot />
<Footer/>
