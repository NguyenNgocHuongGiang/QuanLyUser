const express = require('express')
const { engine } = require('express-handlebars');
const session = require('express-session');
const flash = require('connect-flash');
const axios = require('axios')

const app = express()

app.set('view engine', 'handlebars')

app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'your-secret-key',
  resave: true,
  saveUninitialized: true
}));
app.use((req, res, next) => {
  res.locals.flashMessage = req.session.flashMessage;
  delete req.session.flashMessage;
  next();
});
app.use(express.static("./public"))
app.use(flash());

app.engine('handlebars', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  helpers: {
    eq: function (value1, value2) {
      return value1 === value2;
    },
  },
}));

const checkIsLoggedIn = (req, res, next) => {
  if (req.session && req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
};

/** HOME PAGE */
app.get('/', checkIsLoggedIn, async (req, res) => {
  const message = req.flash('message');
  let page = req.query.page;
  if (!page || isNaN(parseFloat(page)) || parseInt(page) < 1) {
    page = 1;
  }
  try {
    const response = await axios.get(`https://gorest.co.in/public-api/users?page=${page}&per_page=20`, {
      headers: {
        Authorization: 'Bearer 14229407605263371665e770388664291449c3d7468f5b18a9546ff54c9c7cc4',
        Accept: 'application/json',
      },
    });
    const responseData = response.data;

    if (responseData.code === 200) {
      let userList = responseData.data;
      let totalPage = Math.ceil(responseData.meta.pagination.total / responseData.meta.pagination.limit);

      page = parseInt(page);
      if (page > totalPage) {
        return res.redirect(301, `/?page=${totalPage}`);
      }
      let previousPage = page > 1 ? page - 1 : null;
      let nextPage = page < totalPage ? page + 1 : null;

      res.render('home', {
        userList: userList,
        page: page,
        totalPage: totalPage,
        previousPage: previousPage,
        nextPage: nextPage,
        message: message
      });
    }
  } catch (error) {
    if (error.response) {
      console.log('Request failed with status code:', error.response.status);
    } else {
      console.log('Request failed:', error.message);
    }
  };
});

/** LOGIN PAGE */
app.get('/login', (req, res) => {
  if (req.session && req.session.user) {
    res.redirect('/');
  } else {
    res.render('login');
  }
});

app.post('/login', (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  if (email === '') {
    res.render('login', { error: 'Vui lòng nhập email' });
  } else if (password === '') {
    res.render('login', { error: 'Vui lòng nhập password' });
  } else if (email === 'admin@gmail.com' && password === 'admin') {
    req.session.user = email;
    req.flash('message', 'Đăng nhập thành công');
    res.redirect('/');
  } else {
    res.render('login', { error: 'Sai email hoặc mật khẩu' });
  }
});

// /** ADD ITEM PAGE */
app.get('/add', (req, res) => {
  res.render('add');
});

app.post('/add', (req, res) => {
  let name = req.body.name;
  let gender = req.body.gender;
  let email = req.body.email;
  let status = req.body.status;

  if (name === '' || gender === '' || email === '' || status === '') {
    res.render('add', { error: 'Vui lòng nhập đầy đủ thông tin' });
  } else {
    axios.post('https://gorest.co.in/public-api/users', {
      name,
      gender,
      email,
      status
    }, {
      headers: {
        'Authorization': 'Bearer 14229407605263371665e770388664291449c3d7468f5b18a9546ff54c9c7cc4'
      }
    })
      .then(response => {
        req.flash('message', 'Thêm user thành công');
        res.redirect('/');
      })
      .catch(error => {
        res.status(500).send('Internal Server Error');
      });
  }
});

// /** UPDATE ITEM PAGE */
app.get('/edit/:id', (req, res) => {
  axios.get('https://gorest.co.in/public-api/users/' + req.params.id, {
    headers: {
      'Authorization': 'Bearer 14229407605263371665e770388664291449c3d7468f5b18a9546ff54c9c7cc4'
    }
  })
    .then(response => {
      const user = response.data.data;
      res.render('edit', { user });
    })
    .catch(error => {
      res.status(500).send('Internal Server Error');
    });
});

app.post('/edit/:id', (req, res) => {
  let name = req.body.name;
  let gender = req.body.gender;
  let email = req.body.email;
  let status = req.body.status;
  axios.put('https://gorest.co.in/public-api/users/' + req.params.id, {
    name,
    gender,
    email,
    status
  }, {
    headers: {
      'Authorization': 'Bearer 14229407605263371665e770388664291449c3d7468f5b18a9546ff54c9c7cc4'
    }
  })
    .then(response => {
      req.flash('message', 'Cập nhật thành công');
      res.redirect('/');
    })
    .catch(error => {
      res.status(500).send('Internal Server Error');
    });
});

/**DELETE */
app.post('/delete/:id', (req, res) => {
  axios.delete('https://gorest.co.in/public-api/users/' + req.params.id, {
    headers: {
      'Authorization': 'Bearer 14229407605263371665e770388664291449c3d7468f5b18a9546ff54c9c7cc4'
    }
  })
    .then(response => {
      req.flash('message', 'Xóa user thành công');
      res.redirect('/');
    })
    .catch(error => {
      res.status(500).send('Internal Server Error');
    });
});

// /**DETAIL */
app.get('/:id', (req, res) => {
  axios.get('https://gorest.co.in/public-api/users/' + req.params.id, {
    headers: {
      'Authorization': 'Bearer 14229407605263371665e770388664291449c3d7468f5b18a9546ff54c9c7cc4'
    }
  })
    .then(response => {
      const user = response.data.data;
      res.render('detail', { user });
    })
    .catch(error => {
      res.status(500).send('Internal Server Error');
    });
});

const port = 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
