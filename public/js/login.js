import { showAlert } from './alert.js'
const axios = require('axios');

const login = async (email, password) => {
        try {
        const res = await axios({
        method: 'POST',
        url: 'http://localhost:4001/api/v1/users/login',
        data: {
          email,
          password
        },
      });
      if (res.data.status === 'success') {
        showAlert('success', 'Logged in successfully!');
        window.setTimeout(() => {
          location.assign('/profile');
        }, 500);
      }
      
    } catch (err) {   
      console.log(err);
       
    }
  };

const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:4001/api/v1/users/logout'
    });
    if ((res.data.status = 'success')) location.reload(true);
  } catch (err) {
    console.log(err.response);
    showAlert('error', 'Error logging out! Try again.');
  }
};

const loginForm = document.querySelector(".form-container");
const logoutBt = document.getElementById("logout");

if (logoutBt)
  logoutBt.addEventListener('click', logout);

if (loginForm)
  loginForm.addEventListener("submit", e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  })

