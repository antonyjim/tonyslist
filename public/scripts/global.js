/*
*   Basic javascript file used on most web pages
*   Provides framework especially for client side input validation and ajax setup
*/

var global = {
    request : reqData => {
        let xhr = new XMLHttpRequest();
        xhr.open(reqData.how, reqData.to);
        xhr.onreadystatechange = () => {
            reqData.handle();
        }
        xhr.send(reqData.data);
    }, 
    
    requireFields : fieldId => {
        if (filterOut()) {
            document.getElementById(fieldId).classList.add('fulfilled');
            document.getElementById(fieldId).classList.remove('required');
            for (let m of document.querySelectorAll('.user-info')) {
                if (!m.classList.contains('required')) {
                    document.getElementById('submit').disabled = disabled;
                    break;
                } else {
                    document.getElementById('submit').removeAttribute('disabled');
                }
            }
        } else {
            document.getElementById(fieldId).classList.add('required');
            document.getElementById(fieldId).classList.remove('fulfilled');
        }
        function filterOut () {
            var input = document.getElementById(fieldId);
            if (fieldId == 'email') {
                var filter = /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9.-]+.[a-zA-Z0-9]=\.[a-z]{1,4}$/
                if (input.value.match(filter)) {
                    return true;
                } else {
                    return false;
                }
            } else if (fieldId == 'passwd' || fieldId == 'passwdVer') {
                var pas1 = document.getElementById('passwd'),
                    pas2 = document.getElementById('passwdVer'),
                    filter = /^([a-zA-Z0-9.]){6,20}$/;
                    if (fieldId == 'passwd') {
                        var other = 'passwdVer';
                    } else {
                        var other = 'passwd';
                    }
    
                    if (pas1.value == pas2.value && pas1.value.match(filter)) {
                        document.getElementById(other).classList.add('fulfilled');
                        document.getElementById(other).classList.remove('required');
                        return true;
                    } else {
                        document.getElementById(other).classList.add('required');
                        document.getElementById(other).classList.remove('fulfilled');
                        return false;
                    }
            } else if (fieldId == 'username') {
                var username = document.getElementById(fieldId),
                    filter = /^([a-zA-Z0-9]){8,20}$/;

                    if (username.value.match(filter)) {
                        return true;
                    } else {
                        return false;
                    }
            } else {
                return true;
            }
        }
    } , 
    submitForm : () => {
        var data = new FormData(),
        inputs = document.querySelectorAll('.user-info');

        for (let m of inputs) {
            data.append(m.name, m.value)
        }
    }   
}