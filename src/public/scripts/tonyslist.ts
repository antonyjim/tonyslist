var handleOnLoad = (): void => {
    console.log('Parsed Core')
    let close = document.getElementById('close');
    close.addEventListener('click', closeModal)
}

var submitForm = ({
    url,
    method,
    selector
}: {
    url: string,
    method: string,
    selector: string
}) => {
    return new Promise((resolve, reject) => {
        let info: NodeListOf<HTMLInputElement> = document.querySelectorAll(selector)
        let form: FormData = new FormData
        info.forEach(function(field) {
            form.append(field.name, field.value)
            console.log(field.name, ' ', field.value)
        }) 
        
        window.fetch(url, {
            method: method,
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
           resolve(JSON.parse(responseJson))
        })
        .catch ((err) => {
            throw err
        })
    })
}

let openModal = ({
    message,
    reason,
    layout
    }: {
    message?: string,
    reason?: string,
    layout?: string
    }): void => {
        let modal = document.getElementById('mod-modal')
        let modalInnerText = document.getElementById('mod-message')
        if (reason) {
            modal.classList.add('modal-error')
        }
        modalInnerText.innerHTML = message || reason
        modal.style.display = 'block'
}

let closeModal = (): void => {
    document.getElementById('mod-modal').style.display = 'none'
}

if (document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', handleOnLoad)
} else {
    handleOnLoad()
}