if (document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', handleOnLoad);
}
else {
    handleOnLoad();
}
var handleOnLoad = function () {
    document.getElementById('submit').addEventListener('click', function () {
        submitForm('/login', 'POST', 'login-info');
    });
};
var submitForm = function (url, method, selector) {
    var info = document.querySelectorAll(selector);
    var form = new FormData;
    info.forEach(function (field) {
        form.append(field.name, field.value);
    });
    fetch('/login', {
        method: 'POST',
        headers: {
            'content-type': 'multipart/form-data'
        },
        credentials: 'include',
        body: form
    })
        .then(function (response) {
        handleOnResponse(response);
    })["catch"](function (err) {
        processErr(500);
    });
};
var processErr = function (errCode) {
};
var handleOnResponse = function (res) {
    if (res.status >= 200 && res.status < 300) {
    }
    else {
        var error = new Error(res.statusText);
        throw error;
    }
};
