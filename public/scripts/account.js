var ress = null;
function closeModal(err) {
    if (err) {
        var errorBox = document.getElementById('error-box');
        errorBox.innerHTML = err;
    }
    console.log('closed');
    var modal = document.getElementById('mod-modal');
    modal.style.display = "none";
}

function passwdmod() {
    var f = makeRequest("passwdmod");

    f.then(resolved => {
        openModal();
        var suc = JSON.parse(resolved);
        populateFields(suc);
    } , reason => {
        console.log(reason);
        closeModal(reason);
    }).catch(err => {
        console.log('There was an error');
    }) 

}

function emailmod() {
    console.log('email called');
}

function advertmod() {
    console.log('advert called ');
}

function deletemod() {
    console.log('delete called');
}

function populateFields(fields) {
    console.log(fields);
    var root = document.getElementById('mod-body');
    var cont = document.createElement('div');
    console.log(cont);

    for (let m in fields.inputs) {
        let i = document.createElement('div');
        let j = document.createElement('input');
        let k = document.createElement('label');
        let l = document.createTextNode(fields.inputs[m].label);

        i.classList.add('edit-field');

        j.type = fields.inputs[m].type;
        j.name = fields.inputs[m].name;
        j.id = fields.inputs[m].id;

        k.for = fields.inputs[m].id;

        k.appendChild(l);
        i.appendChild(j);
        i.insertBefore(k);
        cont.insertBefore(i);
    }

    var submit = document.createElement('button');

    submit.type = 'button',
    submit.action = 'subReq(' + fields.action + ');';
    submit.value = 'save changes';

    cont.appendChild(submit);
    root.appendChild(cont);

}

function openModal() {
    var modal = document.getElementById('mod-modal');
    modal.style.display = "block";
    console.log(modal);
}

function makeRequest(layout) {
    console.log(layout);
    return new Promise((res, rej) => {
        var xhr = new XMLHttpRequest();
        var url = '/public/layouts/' + layout + ".json";

        xhr.onreadystatechange = function() {
            console.log(this.status);
            if (this.status == 200 || this.status == 304) {
                res(this.responseText);
            } else if (this.status == 500) {
                rej(500);
            } else {
                rej(this.status);
            }
        }

        xhr.open("GET", url, true);
        xhr.send();
    }) 
}