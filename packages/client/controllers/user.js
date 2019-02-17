const API = require('../utils/api');

class User {
  constructor() {
    this.renderSignup = this.renderSignup.bind(this);
    this.signup = this.signup.bind(this);
    this.renderSignin = this.renderSignin.bind(this);
    this.signin = this.signin.bind(this);
    this.renderForgetPass = this.renderForgetPass.bind(this);
    this.forgetPass = this.forgetPass.bind(this);
  }

  async getCaptchaUrl(req) {
    const data = await API.getCaptcha({
      height: 34
    });

    req.app.locals.captcha = {
      token: data.token,
      expired: Date.now() + 1000 * 60 * 10
    };

    return data.url;
  }

  async renderSignup(req, res) {
    const url = await this.getCaptchaUrl(req);

    res.render('pages/user/signup', {
      title: '注册',
      url
    });
  }

  // 注册
  async signup(req, res) {
    const { nickname, email, password, captcha } = req.body;
    const data = req.app.locals.captcha || {};
    const url = await this.getCaptchaUrl(req);

    if (captcha.toUpperCase() !== data.token) {
      return res.render('pages/user/signin', {
        title: '登录',
        error: '图形验证码错误',
        url
      });
    } else if (Date.now() > data.expired) {
      return res.render('pages/user/signin', {
        title: '登录',
        error: '图形验证码已经失效了，请重新获取',
        url
      });
    }

    try {
      await API.signup({ nickname, email, password });
      return res.render('pages/transform', {
        title: '注册成功',
        type: 'success',
        message: '注册成功'
      });
    } catch(err) {
      return res.render('pages/user/signup', {
        title: '注册',
        error: err.error,
        picUrl: url
      });
    }
  }

  async renderSignin(req, res) {
    const url = await this.getCaptchaUrl(req);

    res.render('pages/user/signin', {
      title: '登录',
      url
    });
  }

  // 登录
  async signin(req, res) {
    const { email, password, captcha } = req.body;
    const data = req.app.locals.captcha || {};
    const url = await this.getCaptchaUrl(req);

    if (captcha.toUpperCase() !== data.token) {
      return res.render('pages/user/signin', {
        title: '登录',
        error: '图形验证码错误',
        url
      });
    } else if (Date.now() > data.expired) {
      return res.render('pages/user/signin', {
        title: '登录',
        error: '图形验证码已经失效了，请重新获取',
        url
      });
    }

    try {
      const jwt = await API.signin({ email, password });

      global.token = jwt;

      return res.render('pages/transform', {
        title: '登录成功',
        type: 'success',
        message: '登录成功'
      });
    } catch(err) {
      return res.render('pages/user/signin', {
        title: '登录',
        error: err.error,
        url
      });
    }
  }

  // 忘记密码页
  async renderForgetPass(req, res) {
    const url = await this.getCaptchaUrl(req);

    return res.render('pages/user/forget_pass', {
      title: '忘记密码',
      url
    });
  }

  // 忘记密码
  async forgetPass(req, res) {
    const { email, captcha } = req.body;
    const data = req.app.locals.captcha || {};
    const url = await this.getCaptchaUrl(req);

    if (captcha.toUpperCase() !== data.token) {
      return res.render('pages/user/signin', {
        title: '登录',
        error: '图形验证码错误',
        url
      });
    } else if (Date.now() > data.expired) {
      return res.render('pages/user/signin', {
        title: '登录',
        error: '图形验证码已经失效了，请重新获取',
        url
      });
    }

    try {
      await API.forgetPass({ email });

      return res.render('pages/transform', {
        title: '找回密码成功',
        type: 'success',
        message: '找回密码成功'
      });
    } catch(err) {
      return res.render('pages/user/forget_pass', {
        title: '忘记密码',
        error: err.error,
        picUrl: url
      });
    }
  }

  // 登出
  async signout(req, res) {
    global.token = '';
    return res.render('pages/transform', {
      title: '退出成功',
      type: 'success',
      message: '退出成功'
    });
  }

  // 积分榜前一百
  async renderUsersTop100(req, res) {
    const top100 = await API.getUsersTop({ count: 100 });

    return res.render('pages/user/top100', {
      title: '积分榜前一百',
      top100
    });
  }


  // 个人信息页
  async renderUserInfo(req, res) {
    const { uid } = req.params;

    const info = await API.getUserById(uid);
    const data = await API.getUserAction(uid);

    return res.render('pages/user/info', {
      title: '动态 - 用户信息',
      type: 'action',
      info,
      data,
    });
  }

  // 用户专栏页
  async renderUserCreate(req, res) {
    const { uid } = req.params;

    const info = await API.getUserById(uid);
    const data = await API.getUserCreate(uid);

    return res.render('pages/user/info', {
      title: '专栏 - 用户信息',
      type: 'create',
      info,
      data,
    });
  }

  // 用户喜欢页
  async renderUserLike(req, res) {
    const { uid } = req.params;

    const info = await API.getUserById(uid);
    const data = await API.getUserLike(uid);

    return res.render('pages/user/info', {
      title: '喜欢 - 用户信息',
      type: 'like',
      info,
      data,
    });
  }

  // 用户收藏页
  async renderUserCollect(req, res) {
    const { uid } = req.params;

    const info = await API.getUserById(uid);
    const data = await API.getUserCollect(uid);

    return res.render('pages/user/info', {
      title: '收藏 - 用户信息',
      type: 'collect',
      info,
      data,
    });
  }

  // 用户粉丝页
  async renderUserFollower(req, res) {
    const { uid } = req.params;

    const info = await API.getUserById(uid);
    const data = await API.getUserFollower(uid);

    return res.render('pages/user/info', {
      title: '粉丝 - 用户信息',
      type: 'follower',
      info,
      data,
    });
  }

  // 用户关注页
  async renderUserFollowing(req, res) {
    const { uid } = req.params;

    const info = await API.getUserById(uid);
    const data = await API.getUserFollowing(uid);

    return res.render('pages/user/info', {
      title: '关注 - 用户信息',
      type: 'following',
      info,
      data,
    });
  }
}

module.exports = new User();