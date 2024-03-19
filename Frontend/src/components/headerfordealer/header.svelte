<script>
    import { dealerLoginStatus } from "../../store/store";

    const logoutHandler = async () => {
        try {
            const response = await fetch("https://project-backend-02xr.onrender.com/api/v1/dealerships/logout", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin'
            });

            // Clear cookies for access token and refresh token
            document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
            document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';

            // Update dealerLoginStatus store to indicate logout
            dealerLoginStatus.set(false);

            // Remove 'isLoggedIn' flag from localStorage
            localStorage.removeItem('isLoggedIn');

            // Redirect to home page or perform any other action after logout
            window.location.href = "/";

        } catch (error) {
            console.error(error);
            // Handle logout error
        }
    }
</script>

<nav class="flex bg-indigo-800 text-white min-h-24 justify-between px-3 items-center">
    <h1 class="md:text-3xl text-2xl">
        <a href="/">Project</a>
    </h1>
    <button>
        <i class="fa-solid fa-bars md:hidden text-2xl"></i>
    </button>
    <div class="hidden md:flex text-xl gap-8">
        <a href="/dealership/profile">dealership</a>
        <button on:click={logoutHandler}>logout</button>
    </div>
</nav>
