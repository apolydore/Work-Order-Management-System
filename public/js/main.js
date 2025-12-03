document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('login');

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href='/login';
        });
    }
}); 