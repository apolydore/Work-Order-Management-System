document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('login');
    const getStartedBtn = document.getElementById('getStarted');
    const jobRequestBtn = document.getElementById('jobRequest');

    //contactus ajax elements which only exist on index.html
    const contactForm = document.getElementById('contactForm');
    const contactError = document.getElementById('contactError');
    const contactThankYou = document.getElementById('contactThankYou');

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
            window.location.href='/job-requests/new'; 
        }); 
    }

    //ajax submit for the contact us form
    if (contactForm){
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            //this is to reset the error
            if (contactError) {
                contactError.style.display = 'none';
                contactError.textContent = '';
            }

            try{
                const formData = new FormData(contactForm); 
                //had to look this up, no idea why it wouldn't work, but apparently this helps express parse it
                const params = new URLSearchParams(formData);

                const response = await fetch('/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: params.toString()
                });

                const data = await response.json();

                //if the backend has returned an error
                if (!response.ok || !data.success) {
                    if (contactError){
                        contactError.textContent = data.error || 'something went wrong.';
                        contactError.style.display = 'block';
                    }
                    return;
                }

                //if the form submit is successful, hide the form and then show the thank you message
                contactForm.style.display = 'none';

                if (contactThankYou){
                    contactThankYou.style.display = 'block';
                }
            } catch (e){
                if (contactError){
                    contactError.textContent = 'error, please try again';
                    contactError.style.display = 'block';
                }
            }
            
        });
    }
}); 