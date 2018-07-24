var filterCat = () => {
    var checks = document.querySelectorAll('.category-sort');
    var categories = document.querySelectorAll('.category');
    var filters = [];
    for (let m of checks) {
        if (m.checked) {
            filters.push(m.value);
        }
    }
    for (let m of categories) {
        if (filters.indexOf(m.value) == -1) {
            m.parentElement.style.display = 'none';
        } else {
            m.parentElement.style.display = 'block';
        }
    }
}

var filterSearch = posts => {
    var post_pids = document.querySelectorAll('.post_pid');
    var post_arr = [];
    for (let m in posts) {
        post_arr.push(posts[m].post_pid);
    }
    if (posts) {
        console.log(posts[0].parentElement);
        for (let m of post_pids) {
            if (post_arr.indexOf(m.value) > -1) {
                console.log(m.parentElement)
                m.parentElement.style.display = 'block'
            } else {
                m.parentElement.style.display = 'none'
            }
        }
    }
  
    console.log(post_arr);
}

var search = () => {
    var searches = document.getElementById('search').value;
    var results = [];
    var query = new FormData();
    query.append('conditions', searches);
    xhr('POST', '/posts/search/', query).then(resolve => {
        var posts = JSON.parse(resolve);
        filterSearch(posts);
    }, reason => {
        console.log(reason);
    }).catch(err => {console.log(err)})
}