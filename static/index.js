window.addEventListener('load', () => {
    console.log('loaded');

    setInterval(getMessages, 500);


});

const shopUrl = "http://localhost:80/";

const shopResources = {
    start : shopUrl + 'start',
    messages : shopUrl + 'messages',
}

function onUserFormClick(){
    console.log('onUserFormClick');
    let form = {
        response: document.getElementById('userform-response').checked
    }


    fetch(shopResources.start, {
        method: 'POST',
        body: JSON.stringify(form),
        headers: {
            'Content-type': 'application/json; charset=UTF-8'
        }
    })
    .then(response => response.json())
    .then(json => console.log(json));


}

function getMessages(){
    fetch(shopResources.messages)
    .then(response => response.json())
    .then(json => {
        let messages = document.getElementById('messages');
        messages.innerHTML = '';
        json.messages.forEach(m => {
            let newMessage = document.createElement('div');
            newMessage.innerHTML = `${m.when} : "${m.msg}"`;
            messages.appendChild(newMessage);
        })
    });
}