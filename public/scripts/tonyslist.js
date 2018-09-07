var handleOnLoad = function () {
    console.log('Parsed Core');
    var close = document.getElementById('close');
    close.addEventListener('click', closeModal);
};
var submitForm = function (_a) {
    var url = _a.url, method = _a.method, selector = _a.selector;
    return new Promise(function (resolve, reject) {
        var loginRes;
        var info = document.querySelectorAll(selector);
        var form = new FormData;
        info.forEach(function (field) {
            form.append(field.name, field.value);
            console.log(field.name, ' ', field.value);
        });
        window.fetch(url, {
            method: method,
            credentials: 'include',
            body: form
        })
            .then(function (response) {
            if (response.status >= 200 && response.status < 300) {
                return response.json();
            }
            else {
                var error = new Error(response.statusText);
                throw error;
            }
        })
            .then(function (responseJson) {
            resolve(JSON.parse(responseJson));
        })["catch"](function (err) {
            throw err;
        });
    });
};
var openModal = function (_a) {
    var message = _a.message, reason = _a.reason, layout = _a.layout;
    var modal = document.getElementById('mod-modal');
    var modalInnerText = document.getElementById('mod-message');
    if (reason) {
        modal.classList.add('modal-error');
    }
    modalInnerText.innerHTML = message || reason;
    modal.style.display = 'block';
};
var closeModal = function () {
    document.getElementById('mod-modal').style.display = 'none';
};
if (document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', handleOnLoad);
}
else {
    handleOnLoad();
}
