var save = () => {
    
}

var submit = () => {

}



var addInput = () => {
    let m = document.getElementById('testplace').classList.remove('input');
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