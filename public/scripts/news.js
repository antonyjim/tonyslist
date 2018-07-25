var save = (sub) => {
    var data = new FormData();
    var userInfo = document.querySelectorAll('.user-info');
    var images = document.querySelectorAll('.input');
    for (let m in userInfo) {
        data.append(userInfo[m].name, userInfo[m].value);
    }
    if (images.length > 0) {
        for (let m of images) {
            data.append(m.name, m.files[0]);
        }
    }
  
        data.append('pid', document.getElementById('pid').value);
    if (sub) {
        var url = '/news/add/?sub=true';
    } else {
        var url = '/news/add/';
    }
    
    var cb = () => {
        if (this.readyState == 4 && this.status == 200)  {
            window.href = ('/news/?pid=' + document.getElementById('pid').value)
        } else if (this.status == 500) {
            closeElement('mod-modal', 500);
        } else if (this.staus == 403) {
            window.href = ('/login');
        }else {
            console.log(this.status);
        }
    }

    postRequest(data, url, cb);

}

var postRequest = (data, url, cb) => {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = cb;
    xhr.open('POST', url, true);
    xhr.send(data);
}

var addInput = () => {
    document.getElementById('testplace').classList.remove('input');
    var all = document.querySelectorAll('.input'),
    input = document.createElement('input'),
    root = document.getElementById('inputCont'),
    id = 'img' + (all.length + 1);

    input.id = id;
    input.classList.add('input', 'user-info');
    input.setAttribute('type', 'file');
    input.setAttribute('name', id);
    
    root.insertBefore(input, all[0]);
}

var openModal = () => {
    document.getElementById('mod-modal').style.display = 'block';
}

var closeElement = (element, err) => {
    if (err) {
        document.getElementById('error-box')
            .style.display = 'block'
            .innerHTML = err;
    }
    document.getElementById(element).style.display = 'none';
}
