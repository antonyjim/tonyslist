var incorrectUsernameOrPassword = function () {
};
var processErr = function (err) {
    console.error(err);
};
var handleOnResponse = function (response) {
    if (response.status === 0) {
        window.location.href = response.redirect;
    }
    else if (response.status === 1) {
        openModal({ message: response.message });
    }
    else if (response.status === 2) {
        window.location.href = response.redirect;
    }
    else if (response.status === 3) {
        openModal({ reason: response.reason });
    }
    else if (response.status === 4) {
        incorrectUsernameOrPassword();
    }
    else {
        openModal({ reason: 'An unknown error occured, please try again later' });
    }
};
var handleOnLogonLoad = function () {
    console.log('Parsed Login');
    document.getElementById('submit').addEventListener('click', function () {
        submitForm({
            url: '/login',
            selector: '.login-input',
            method: 'POST'
        }).then(function (response) {
            switch (response.status) {
                case 0: {
                    document.cookie = "auth=" + response.cookie;
                    window.location.href = response.redirect;
                }
                case 1: {
                    document.cookie = "auth=" + response.cookie;
                }
                case 2: {
                }
                case 3: {
                }
                default: {
                }
            }
        });
    });
};
if (document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', handleOnLogonLoad);
}
else {
    handleOnLogonLoad();
}
