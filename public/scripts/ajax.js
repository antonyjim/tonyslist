var xhr = function (method, url, data) {
    return new Promise((res, rej) => {
        var xmlhr = new XMLHttpRequest();
        var counter = 0;
        xmlhr.onreadystatechange = function() {
            if (this.readyState != 4) {
                counter++
            } else if (counter > 5) {
                rej(this.readyState)
            } else {
                if (this.readyState == '4' && this.status == 200) {
                    res(this.responseText);
                } else {
                    rej(this.status);
                }
            }
        };
        xmlhr.open(method, url);
        xmlhr.send(data);
    })
}