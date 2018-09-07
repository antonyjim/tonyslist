// import { submitForm } from './tonyslist'

var incorrectUsernameOrPassword = () => {

}

var processErr = (err) => {
    console.error(err)
}

var handleOnResponse = (response) => {
    /**
     * Status codes:
     * 0 = All Okay
     * 1 = Okay, but display a message
     * 2 = Okay, but redirect
     * 3 = Not okay, display a message
     * 4 = Incorrect Username or password
     * 5 = Internal server error
     */
    if(response.status === 0) {
        window.location.href = response.redirect
    } else if (response.status === 1) {
        openModal({message: response.message})
    } else if (response.status === 2) {
        window.location.href = response.redirect
    } else if (response.status === 3) {
        openModal({reason: response.reason})
    } else if (response.status === 4) {
        incorrectUsernameOrPassword()
    } else {
        openModal({reason: 'An unknown error occured, please try again later'})
    }
}

var handleOnLogonLoad = (): void => {
    console.log('Parsed Login')
    document.getElementById('submit').addEventListener('click', function() {
        //submitForm('/login', 'POST', '.login-info')
        submitForm({
            url: '/login',
            selector: '.login-input',
            method: 'POST'
        }).then ((response: {
            status: number,
            reason?: string,
            redirect?: string,
            message?: string,
            cookie?: string
        }) => {
            switch(response.status) {
                case 0 : {
                    // Apply cookie and redirect
                    document.cookie = `auth=${response.cookie}`
                    window.location.href = response.redirect
                } case 1 : {
                    // Apply cookie, open mod modal
                    document.cookie = `auth=${response.cookie}`
                    
                } case 2 : {
                    // Apply cookie and redirect
                } case 3 : {
                    // Incorrect Username or Password
                } default : {
                    // Please try again later, unknown error
                }
            }
        })
    })
}

if (document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', handleOnLogonLoad)
} else {
    handleOnLogonLoad()
}