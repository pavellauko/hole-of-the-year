const User = require("../models/user");
const { validationResult } = require("express-validator");
const emailTemplate = require("../data/email");
const mailjet = require("node-mailjet").connect(
  process.env.MJ_APIKEY_PUBLIC,
  process.env.MJ_APIKEY_PRIVATE
);

module.exports.showRegisterForm = (req, res) => {
  res.render("users/register", {
    pageTitle: "Registrace - Jamka Roku 2021",
    errors: [],
    username: null,
    email: null,
    path: "/users/register",
  });
};

module.exports.registerNewUser = async (req, res) => {
  // Check if any validation errors exist, if so redirect user back to register page
  const { email, username, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render("users/register", {
      pageTitle: "Registrace - Jamka Roku 2021",
      errors: errors.array(),
      username: username,
      email: email,
      path: "/users/register",
    });
  }

  try {
    const user = new User({ email, username });
    const registeredUser = await User.register(user, password);
    const request = mailjet.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: process.env.EMAIL,
            Name: "Jamka Roku 2021",
          },
          To: [
            {
              Email: registeredUser.email,
              Name: registeredUser.username,
            },
          ],
          Subject: emailTemplate.subject,
          HTMLPart: emailTemplate.HTMLPart,
        },
      ],
    });
    request
      .then((result) => {
        console.log(result.body);
      })
      .catch((err) => {
        console.log(err.statusCode);
      });
    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash(
        "success",
        "Byli jste úspěšně zaregistrování. Můžete nominovat své oblíbené jamky!"
      );
      return res.redirect("/courses");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/users/register");
  }
};

module.exports.showLoginForm = (req, res) => {
  res.render("users/login", {
    pageTitle: "Přihlášení - Jamka Roku 2021",
    path: "/users/login",
  });
};

module.exports.login = (req, res) => {
  req.flash("success", "Byli jste úspěšně přihlášeni.");
  res.redirect("/courses");
};

module.exports.logout = (req, res) => {
  req.logout();
  req.flash("success", "Byli jste úspěšně odhlášeni.");
  res.redirect("/courses");
};
