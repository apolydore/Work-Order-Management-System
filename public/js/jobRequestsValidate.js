const form = document.getElementById("reqForm");
const errorsDiv = document.getElementById("errorDiv");
const jobRequestError = document.getElementById("jobRequestError");
const thankYou = document.getElementById("jobRequestThankYou");
const jobRequestTitle = document.getElementById("jobRequestTitle");

const showErrors = (errors) => {
    if (!errorsDiv) return;

    if (!errors || errors.length === 0) {
        errorsDiv.innerHTML = "";
        //keeps the red error box from displaying if there are no errors
        errorsDiv.style.display = "none";
        return;
    }

    let html = "<ul>";
    for (const err of errors){
        html += `<li>${err}</li>`;
    }
    html += "</ul>";
    errorsDiv.innerHTML = html;
    errorsDiv.style.display = "block";
};

const checkString = (val, name) => {
    if (typeof val !== 'string') return `${name} must be a string`;
    const trimmed = val.trim();
    if (!trimmed) return `${name} cannot be empty`;
    
    //if there is no error, return null
    return null;
};

const checkPriority = (val) => {
    const baseErr = checkString(val, "priority");
    if (baseErr) return baseErr;

    const trimmed = val.trim().toLowerCase();
    const allowed = ['low', 'medium', 'high'];
    if (!allowed.includes(trimmed)) return 'priority must be low, medium, or high';

    return null;
};

const checkState = (val) => {
    const baseErr = checkString(val, 'state');
    if (baseErr) return baseErr;

    const trimmed = val.trim();
    if(!/^[A-Za-z]{2}$/.test(trimmed)) return 'state must be 2 letters';

    return null;
};

const checkZip = (val) => {
    if (typeof val !== 'string') return 'zipCode must be a string';

    const trimmed = val.trim();
    if (!trimmed) return 'zip code cannot be empty';
    if (!/^\d{5}$/.test(trimmed)) return 'zip code must be 5 digits';

    return null;
};

const checkAttachmentUrl = (val) => {
    if (val===undefined || val===null) return null;
    if (typeof val !== 'string') return "attachmentUrl must be a string";

    const trimmed = val.trim();
    if (!trimmed) return null;//it is fine if this field is blank bc it is optional

    if (!/^https?:\/\/.+/i.test(trimmed)) {
        return 'attachmentUrl must start with http:// or https://';
    }

    return null; 
};

if (form) {
    form.addEventListener("submit", async (e) => {
        const errors = [];

        const companyName = document.getElementById("companyName").value;
        const category = document.getElementById("category").value;
        const priority = document.getElementById("priority").value;
        const description = document.getElementById("description").value;
        const address = document.getElementById("address").value;
        const city = document.getElementById("city").value;
        const state = document.getElementById("state").value;
        const zipCode = document.getElementById("zipCode").value;
        const attachmentUrlEl = document.getElementById("attachmentUrl");
        const attachmentUrl = attachmentUrlEl ? attachmentUrlEl.value : "";

        let err;
        err = checkString(companyName, "companyName");
        if (err) errors.push(err);

        err = checkString(category, "category");
        if (err) errors.push(err);

        err = checkPriority(priority);
        if (err) errors.push(err);

        err = checkString(description, "description");
        if (err) errors.push(err);

        err = checkString(address, "address");
        if (err) errors.push(err);

        err = checkString(city, "city");
        if (err) errors.push(err);

        err = checkState(state);
        if (err) errors.push(err);

        err = checkZip(zipCode);
        if (err) errors.push(err);

        err = checkAttachmentUrl(attachmentUrl);
        if (err) errors.push(err);

        //normalizing the inputs
        if (!checkState(state)) {
            document.getElementById("state").value = state.trim().toUpperCase();
        }

        if (!checkPriority(priority)){
            document.getElementById("priority").value = priority.trim().toLowerCase();
        }

        if (errors.length > 0) {
            e.preventDefault();
            showErrors(errors);
            return; 
        }

        e.preventDefault();
        showErrors([]);

        try{
            const formData = new FormData(form);
            const params = new URLSearchParams(formData);

            //mentioned in the contactus ajax form submission, but I had to look this up because I had no idea what was going on
            const response = await fetch(form.action, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json"
                },
                body: params.toString()
            });

            const data = await response.json();

            if (!response.ok || !data.success){
                if (jobRequestError){
                    jobRequestError.textContent = data.error || 'something went wrong.';
                    jobRequestError.style.display = "block";
                }
                return;
            }

            //this is if the form succeeds in going through, show a thank you
            form.style.display = "none";

            if (jobRequestError){
                jobRequestError.style.display = "none";
            }

            //hides the header bc it looks weird with the thank you
            if (jobRequestTitle){
                jobRequestTitle.style.display = "none";
            }

            if (thankYou){
                thankYou.style.display = "block";
            }
        } catch (e){
            if (jobRequestError){
                jobRequestError.textContent = "error, please try again!";
                jobRequestError.style.display = "block"; 
            }
        }
    }); 
}