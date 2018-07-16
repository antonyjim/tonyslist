var decodeCat = (category) => {
    var value;

    var post = [
        'boats', 'cars', 'hussapp', 'electronic'
    ]

    var key = [
        'boats and watercraft', 'cars and trucks', 'household appliances', 'electronics'
    ]

    for (let m in post) {
        if (post[m] == category) {
            value = key[m];
            break;
        }
    }

    return value;
}