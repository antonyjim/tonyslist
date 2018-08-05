var mod = (file) => {
    var f = makeRequest(file);

    f.then(resolved => {
        openModal();
        var suc = JSON.parse(resolved);
        populateFields(suc);
    } , reason => {
        closeModal(reason);
    }).catch(err => {
        console.log(err);
    }) 

}

var advertmod = () => {
    console.log('advert called ');
}

//Format JSON data into actual inputs. Refer to /public/layouts/*.json 
//to see what I'm working with here
var populateFields = fields => {
    document.getElementById('mod-modal-title').innerHTML = fields.title;
    var root = document.getElementById('mod-body');
    while (root.firstChild) {
        root.removeChild(root.firstChild);
    }
    var cont = document.createElement('div');
    cont.id = 'mod-body-cont';

    for (let m in fields.inputs) {
        let i = document.createElement('div');
        let input = document.createElement('input');
        let label = document.createElement('label');
        let labelText = document.createTextNode(fields.inputs[m].label);

        i.classList.add('edit-field');

        input.type = fields.inputs[m].type;
        input.name = fields.inputs[m].name;
        input.id = fields.inputs[m].id;
        input.classList.add('user-info');
        input.classList.add('newInfo');

        if (fields.inputs[m].otherAttr) {
            input.setAttribute(fields.inputs[m].otherAttr, fields.inputs[m].otherAct);
        }

        label.for = fields.inputs[m].id;
        label.id = fields.inputs[m].id + 'Label';

        label.appendChild(labelText);
        i.appendChild(label);
        i.appendChild(input);
        cont.appendChild(i);
    }

    var submit = document.createElement('button');

    submit.setAttribute('onclick', 'subReq()')
    submit.type = 'button',
    submit.classList.add('user-submit');
    submit.innerHTML = 'save changes';

    cont.appendChild(submit);
    root.appendChild(cont);
}

var openModal = () => {
    var modal = document.getElementById('mod-modal');
    modal.style.display = "block";
    document.getElementById('mod-error').style.display = 'none';
}

//Close any element, bind to spans with .close class
var closeElement = (element, err) => {
    if (err) {
        var errorBox = document.getElementById('error-box');
        errorBox.innerHTML = err;
    }
    document.getElementById(element).style.display = 'none';
}

var showErr = (id, status) => {
    if (status == 404) {
        var label = document.getElementById(id + 'Label');
        label.classList.add('input-error-label');
    }
}

//Dynamically load the form to change data
function makeRequest(layout) {
    return new Promise((res, rej) => {
        var xhr = new XMLHttpRequest();
        var url = '/public/layouts/' + layout + ".json";
        xhr.onload = function() {
            console.log(this.status);
            if (this.status == 200) {
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

var verPass = () => {
    var newPass = document.getElementById('newPass');
    var verNewPass = document.getElementById('verNewPass');
    var errorBox = document.getElementById('passwd-match-err');

    if (newPass.value != verNewPass.value) {
        if (!errorBox) {
            var div = document.createElement('div');
            div.innerHTML = 'Passwords must match!';
            div.id = 'passwd-match-err';
    
            verNewPass.parentNode.insertBefore(div, verNewPass.nextSibling);
        } else if (errorBox.style.display == 'none') {
            errBox.style.display = 'block'
        }
    } else if (newPass.value == verNewPass.value) {
        document.getElementById('passwd-match-err').style.display = 'none';
    }
}

//At least 3 hours getting this to work at all, it works okay right now,
//But there is definitely room to improve on both sides of the table.
var subReq = () => {
    var xhr = new XMLHttpRequest();
    var data = new FormData();
    var inputs = document.getElementById('mod-body-cont').getElementsByTagName('input');
    var id = document.getElementById('pid');
    data.append('pid', id.value);
    for (let m of inputs) {
        data.append(m.name, m.value);
    }
    xhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            closeModal();
            document.getElementById('success-message').style.display = 'block';
            document.getElementById('success-message').innerHTML = 'Info Successfully Changed'
        } else if (this.readyState == 4 && this.status == 500) {
            console.log(this.responseText);
            console.log(this.status);
        } else if (this.readyState == 4 && this.status == 465) {
            document.getElementById('mod-error').innerHTML = 'eMail Address already taken';
        } else if (this.readyState == 4 && this.status == 466) {
            document.getElementById('mod-error').innerHTML = 'This is your current email address';
        } else {
            console.log(this.status);
        }
    };
    xhr.open('POST', '/account/update/', true);
    xhr.send(data);
}