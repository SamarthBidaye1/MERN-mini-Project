const cookieParser = require("cookie-parser");
const express = require("express");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
const cookieparesr = require("cookie-parser")
app.use(cookieParser());
const bcrypt = require('bcrypt');
const path = require("path");
app.use(express.static(path.join(__dirname, 'public')));

const usermodal = require('./modals/user');
const postmodal = require('./modals/posts');

const crypto = require("crypto");

const jwt = require("jsonwebtoken");
const multer = require("multer");
// const upload = multer({ dest: 'uploads/' })


const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, 'public/images/photos'))
    },
    filename: function(req, file, cb) {
        crypto.randomBytes(10, (err, bytes) => {
            const fn = bytes.toString('hex') + path.extname(file.originalname);
            cb(null, fn)
        })
    }
})

const upload = multer({ storage: storage })

const skey = 'data';

app.get('/', (req, res) => {
    res.send('This is Default Page !!');
})

app.get('/register', (req, res) => {
    res.render("index")
})

app.get('/upload', upload.single('name'), (req, res) => { // in multer req.body is for text doc
    console.log(req.file);
    res.render("test")
})
app.post('/upload', upload.single('name'), (req, res) => { // in multer req.body is for text doc
    console.log(req.file);
    res.render("test")
})

app.get('/profile', isLoggedin, async(req, res) => {
    let user = await usermodal.findOne({ email: req.user.email }).populate('posts');
    res.render("profile", { user, posts: user.posts });
})

//we have to post when user is logged in  so for that we need to use middleware
app.post('/post', isLoggedin, async(req, res) => {
    let user = await usermodal.findOne({ email: req.user.email });
    let { content } = req.body;
    let post = await postmodal.create({
        user: user._id,
        content: content
    })
    user.posts.push(post._id);
    user.save();
    res.redirect('/profile')
})

app.get('/likes/:id', isLoggedin, async(req, res) => {
    let posts = await postmodal.findOne({ _id: req.params.id }).populate("user");
    console.log(posts);
    posts.likes.push(req.user.userid);
    await posts.save();
    res.redirect('/profile')
})

app.post('/register', async(req, res) => {
    const { username, name, age, email, password } = req.body;

    let user = await usermodal.findOne({ email });
    if (user) {
        return res.status(200).send('User Already Exists !!');
    }


    //new user
    bcrypt.hash(password, 5, async(error, hash) => {
        if (error) return res.status(500).send('Invalid Password');

        let create = await usermodal.create({
            username,
            name,
            email,
            password: hash,
            age
        })
        let token = jwt.sign({ email: email, userid: create._id }, skey, (error, result) => {
            res.cookie('token', token);
            console.log(token)
            res.json("Register");
        })
    })
})

app.get('/login', (req, res) => {
    res.render("login");
})

app.post('/login', async(req, res) => {
    const { email, password } = req.body;
    let user = await usermodal.findOne({ email });
    if (!user) return res.status(400).send('Invalid Email Address');

    const verifypass = await bcrypt.compare(req.body.password, user.password);
    if (!verifypass) {
        return res.status(400).send('Invalid Password');
    }

    const token = jwt.sign({ email: user.email, userid: user._id }, skey);
    res.cookie('token', token);

    res.redirect('/profile')
})

app.get('/logout', (req, res) => {
    res.cookie('token', '');
    res.redirect('/login');
})

//middle-ware
function isLoggedin(req, res, next) {
    if (req.cookies.token === '') {
        return res.redirect('/login')
    } else {
        let data = jwt.verify(req.cookies.token, skey);
        // verified email will be marked and the user from mongodb will be allocated with the particular email object stored in db. so we do (req.user) updates data
        req.user = data
        next();
    }
}

app.listen(3000, () => {
    console.log('Server On...');
})