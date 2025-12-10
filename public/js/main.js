document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('login');
    const getStartedBtn = document.getElementById('getStarted');
    const jobRequestBtn = document.getElementById('jobRequest');

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href='/login';
        });
    }

    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', () => {
            window.location.href='/signup';
        });
    }

    if (jobRequestBtn) {
        jobRequestBtn.addEventListener('click', () => {
            window.location.href='#'; 
        }); 
    }
}); 