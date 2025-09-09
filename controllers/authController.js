const authController = {
  login: (req, res) => {
    const { username, password } = req.body;

    // Ejemplo simple de validación
    if (username === 'admin' && password === 'admin') {
      req.session = { user: username };
      return res.redirect('/dashboard');
    }

    res.status(401).render('login', { title: 'Iniciar Sesión', error: 'Credenciales inválidas' });
  },

  logout: (req, res) => {
    req.session = null;
    res.redirect('/');
  }
};

module.exports = authController;
