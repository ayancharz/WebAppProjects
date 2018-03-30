var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');

var booksJson = {
    "books": [
        {
            "id": "1",
            "name": "The Image-Guided Surgical Toolkit",
            "price": "0.99",
            "url": "http://www.igstk.org/IGSTK/help/documentation.html"
        },
        {
            "id": "2",
            "name": "Abraham Lincoln",
            "price": "19.95",
            "url": "http://www.learnlibrary.com/abraham-lincoln/lincoln.htm"
        },
        {
            "id": "3",
            "name": "Adventures of Tom Sawyer",
            "price": "10.50",
            "url": "http://www.pagebypagebooks.com/Mark_Twain/Tom_Sawyer/"
        },
        {
            "id": "4",
            "name": "Catcher in the Rye",
            "price": "22.95",
            "url": "https://www.goodreads.com/book/show/5107.The_Catcher_in_the_Rye"
        },
        {
            "id": "5",
            "name": "The Legend of Sleepy Hollow",
            "price": "15.99",
            "url": "http://www.learnlibrary.com/sleepy-hollow/sleepy-hollow.htm"
        },
        {
            "id": "6",
            "name": "Moby Dick",
            "price": "24.45",
            "url": "https://www.amazon.com/Moby-Dick-Herman-Melville/dp/1503280780"
        },
        {
            "id": "7",
            "name": "Java Programming 101",
            "price": "12.95",
            "url": "https://www.javaworld.com/blog/java-101/"
        },
        {
            "id": "8",
            "name": "Robinson Crusoe",
            "price": "11.99",
            "url": "http://www.learnlibrary.com/rob-crusoe/"
        },
        {
            "id": "9",
            "name": "The Odyssey",
            "price": "32.00",
            "url": "http://classics.mit.edu/Homer/odyssey.html"
        }
    ]

};

var booksData = JSON.parse(JSON.stringify(booksJson));

var app = express();

//add publiv library
app.use(express.static(path.join(__dirname, 'public')));

//add view engine and body parser
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

app.use(session({
    secret: 'Gotcha',
    resave: true,
    saveUninitialized: true
}));


app.listen(8080);




//handle get request
app.get('/landing', function (req, res) {
    res.render('landingEC', {books: booksData.books});
});


//Handle login request
app.post('/login', function (req, res) {

    var error = 'Login failed! Please try again!';
    var password = '';
    var nameError = '';
    req.session.name = req.body.name;
    console.log(req.session.name);
    if (req.body.name === "") {
        nameError = 'Please enter name';
        res.render('loginFailed', {error: error, password: password, nameError: nameError});
    }
    else if (req.body.pwd === "") {
        password = 'Please enter password';
        res.render('loginFailed', {error: error, password: password, nameError: nameError});
    } else if (req.body.name !== req.body.pwd) {
        password = 'Incorrect password';
        res.render('loginFailed', {error: error, password: password, nameError: nameError});
    }
    else {
        req.session.authenticated = true;
        res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
        res.render('loginSuccess', {name: req.session.name});
    }
});

app.get('/list', function (req, res) {
    if (req.session.authenticated) {
        res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
        res.render('list', {books: booksData.books, name: req.session.name, qtyError: '', bookError: ''});
    } else {
        req.session.destroy();
        res.redirect('/landing');
    }
});

app.post('/purchase', function (req, res) {
    var qtyError = '';
    var bookError = '';
    if (!req.body.Quantity) {
        qtyError = 'Select some amount';
        res.render('list', {books: booksData.books, name: req.session.name, qtyError: qtyError, bookError: bookError});
    } else if ((parseInt(req.body.Quantity)).toString() === 'NaN') {
        qtyError = 'Amount must be a number';
        res.render('list', {books: booksData.books, name: req.session.name, qtyError: qtyError, bookError: bookError});
    } else if (!req.body.Books) {
        bookError = 'Please select a book';
        res.render('list', {books: booksData.books, name: req.session.name, qtyError: qtyError, bookError: bookError});
    }
    else {
        var booksRequested = getBooksRequested(req, req.body.Books, req.body.Quantity);
        res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
        res.render('purchase', {
            name: req.session.name,
            books: booksRequested,
            quantity: req.body.Quantity,
            totalcost: req.session.totalcost
        });
    }
});

app.post('/confirm', function (req, res) {
    var yesOrNo = 'No';
    req.session.cardNumber = req.body.Cardnumber;
    req.session.cardType = req.body.CreditCard;
    if (req.body.expressdelivery) {
        yesOrNo = 'Yes'
    }
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.render('confirm', {
        name: req.session.name,
        totalcost: req.session.totalcost,
        yesOrNo: yesOrNo,
        cardNumber: req.session.cardNumber,
        cardType: req.session.cardType
    });
});

app.get('/logout', function (req, res) {
    req.session.destroy();
    res.redirect('/landing');
});


app.get('/login', function (req, res) {
    req.session.destroy();
    res.redirect('/login.html')
});
app.get('/purchase', function (req, res) {
    req.session.destroy();
    res.redirect('/landing')
});
app.get('/confirm', function (req, res) {
    req.session.destroy();
    res.redirect('/landing')
});


//Admin Login part
app.post('/adminLogin', function (req, res) {

    var error = 'Login failed! Please try again!';
    var password = '';
    var nameError = '';
    req.session.name = req.body.name;
    console.log(req.session.name);
    if (req.body.name === "") {
        nameError = 'Please enter name';
        res.render('adminLogin', {error: error, password: password, nameError: nameError});
    }
    else if (req.body.pwd === "") {
        password = 'Please enter password';
        res.render('adminLogin', {error: error, password: password, nameError: nameError});
    }
    else if (req.body.name !== 'admin') {
        nameError = 'Incorrect username It is: admin';
        res.render('adminLogin', {error: error, password: password, nameError: nameError});
    }
    else if (req.body.name !== req.body.pwd) {
        password = 'Incorrect password';
        res.render('adminLogin', {error: error, password: password, nameError: nameError});
    }
    else {
        req.session.authenticated = true;
        res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
        res.render('adminManage', {
            bookNameError: '',
            bookPriceError: '',
            status: '',
            books: booksData.books,
            bookError: ''
        });
    }
});


app.post('/adminManage', function (req, res) {
    var length = booksData.books.length;
    console.log('id - ' + booksData.books[length - 1]);
    var newBookId = "" + parseInt(booksData.books[booksData.books.length - 1].id) + 1;
    var booksToRemove = 0;
    var bookIndex = 0;

    if (req.body.Submit === 'Add') {
        if (req.body.bookName === "" || req.body.bookPrice === "") {
            res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
            res.render('adminManage', {
                bookNameError: 'Required Field',
                bookPriceError: 'Required Field',
                status: '',
                books: booksData.books,
                bookError: ''
            });
        } else if ((parseInt(req.body.bookPrice)).toString() === 'NaN') {
            res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
            res.render('adminManage', {
                bookNameError: 'Required Field',
                bookPriceError: 'Required Field - Must be a number',
                status: '',
                books: booksData.books,
                bookError: ''
            });
        }
        else {
            booksData.books.push({
                "id": newBookId,
                "name": req.body.bookName,
                "price": req.body.bookPrice,
                "url": req.body.bookUrl
            });
            res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
            res.render('adminManage', {
                bookNameError: '',
                bookPriceError: '',
                status: 'Book Added',
                books: booksData.books,
                bookError: ''
            });
        }
    }
    if (req.body.Submit === 'Delete') {

        if(!req.body.Books){
            res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
            res.render('adminManage', {
                bookNameError: '',
                bookPriceError: '',
                status: '',
                books: booksData.books,
                bookError: 'Please Select at least one book to delete'
            });
        }
        else {

            booksToRemove = req.body.Books.length;
            while(booksToRemove !== 0)
            {
                for (var k = 0; k<booksData.books.length;k++){
                    if(booksData.books[k].id === req.body.Books[booksToRemove-1]){
                        bookIndex = k;
                    }
                }
                booksData.books.splice(bookIndex,1);
                booksToRemove--;
            }
            res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
            res.render('adminManage', {
                bookNameError: '',
                bookPriceError: '',
                status: 'Book/s Deleted',
                books: booksData.books,
                bookError: ''
            });
        }

    }


});


function getBooksRequested(req, requested, quantity) {
    var i = 0;
    var booksToSend = [];
    req.session.totalcost = 0;
    var temp = 0;

    if ((typeof requested) !== "string") {
        booksData.books.forEach(function (book) {
            if (book.id === requested[i]) {
                booksToSend.push({
                    "name": book.name,
                    "price": book.price
                });
                temp += book.price * quantity;
                // console.log(book.price*quantity);
                // console.log(temp.toFixed(2));
                i++;
            }

        });
    } else {
        booksData.books.forEach(function (book) {
            if (book.id === requested) {
                booksToSend.push({
                    "name": book.name,
                    "price": book.price
                });
                temp += book.price * quantity;
                // console.log(book.price*quantity);
                // console.log(temp.toFixed(2));
                i++;
            }

        });
    }

    req.session.totalcost = temp.toFixed(2);

    return booksToSend;
}


app.use('/', function (req, res, next){
        if (req.method !== "get" && req.method !== "post"){
            res.send("HTTP Status 404 – Not Found")
        }
        else if (res.status(400)){
            res.send('Error 400' +
                '\nBad Request- The request could not be understood by the server due to malformed syntax.')
        }
        else if (res.status(401)){
            res.send('Error 401' +
                '\nUnauthorized - The request requires user authorization but the authorization codes sent were invalid or the user was not recognized in the system. ')
        }
        else if (res.status(402)){
            res.send('Error 402' +
                '\nPayment Required- This HTTP status code is not used but is reserved for future use.')
        }
        else if (res.status(403)){
            res.send('Error 403' +
                '\nForbidden- The server understood the request but refuses to fulfill it. Authorization, in this case, doesn\'t matter.')
        }
        next();
    }
);
