if (document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', handleOnLoad)
} else {
    handleOnLoad()
}

var handleOnLoad = (): void => {
    document.getElementById('submit').addEventListener('click', function() {
        submitForm('/login', 'POST', 'login-info')
    })
}

var submitForm = (url: string, method: string, selector: string) => {
    let info: NodeListOf<HTMLInputElement> = document.querySelectorAll(selector)
    let form: FormData = new FormData

    info.forEach(function(field) {
        form.append(field.name, field.value)
    })

    fetch('/login', {
        method: 'POST',
        headers: {
            'content-type': 'multipart/form-data'
        },
        credentials: 'include',
        body: form
    })
    .then((response) => {
        if (response.status >= 200 && response.status < 300) {
            return response.json()
        } else {
            let error = new Error(response.statusText)
            throw error
        }
    })
    .then ((responseJson) => {
        let loginRes = JSON.parse(responseJson)
        
    })
    .catch ((err) => {
        processErr(err)
    })
}

var processErr = (err) => {
    console.error(err)
}

var handleOnResponse = (response) => {
    if (response.status >= 200 && response.status < 300) {
        JSON.parse(response.response)
    } else {
        let error = new Error(response.statusText)
        throw error
    }
}