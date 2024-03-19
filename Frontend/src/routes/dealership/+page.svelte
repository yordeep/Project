<script>
    import { navigate } from 'svelte-routing';
    import { dealerLoginStatus } from "../../store/store";

    // Check if dealer is logged in on component initialization
    if (localStorage.getItem('isLoggedIn') === 'true') {
        dealerLoginStatus.set(true);
    }

    const handleLogin = async () => {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        const email = emailInput.value;
        const password = passwordInput.value;

        try {
            const response = await fetch("https://project-backend-02xr.onrender.com/api/v1/dealerships/login", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                }),
                credentials: 'same-origin'
            });

            const result = await response.json();

            // Set dealerLoginStatus to true
            dealerLoginStatus.set(true);

            // Set isLoggedIn to true in localStorage
            localStorage.setItem('isLoggedIn', 'true');

            // Navigate to home page
            navigate('/');

        } catch (error) {
            console.error(error);
            // Handle login error
        }

        // Clear input fields
        emailInput.value = "";
        passwordInput.value = "";
    }
</script>

{#if !$dealerLoginStatus}
<div class="flex items-center justify-center h-screen">
    <div class="flex flex-col gap-4 items-center justify-center w-[25vmax] h-[30vmax] border-2 rounded-md">
        <form class="bg-green-0 flex flex-col gap-2">
            <label for="email">Email</label>
            <input type="text" id="email" class="bg-red-0 border-2">
            <label for="password">Password</label>
            <input type="password" id="password" class="border-2">
            <button on:click={handleLogin} class="bg-indigo-500 py-1 text-xl text-white">Login</button>
        </form>
        <p>Don't have an account? <a href="/dealership/register" class="text-indigo-500">Register</a></p>
    </div>
</div>
{:else}

{/if}
