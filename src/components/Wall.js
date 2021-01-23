import React, { useState, useEffect } from 'react';
import axios from 'axios'; // npm install axios
import Moment from 'react-moment'; // npm install react-moment
import 'moment-timezone'; // npm moment-timezone

import './Wall.css';
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormGroup,
  Label,
  Input,
} from 'reactstrap'; // npm i reactstrap
// styling sheet for reactstrap is in the index.css file

const Wall = () => {
  // *** STATE
  const [load, setLoad] = useState(0); // to manually trigger useEffect to reload this component

  // *** USER(S) STATE
  const [user, setUser] = useState({}); // user object to create account
  const [logInUser, setLogInUser] = useState({
    username: '',
    password: '',
  }); // user object for logging in
  let sessionUserId = '';
  let sessionUsername = localStorage.getItem('username');
  const [confirm, setConfirm] = useState(''); // this is for confirm Password field, separated from the user object, since the db doesn't need it

  // *** AUTH STATE
  const [auth, setAuth] = useState(false); // to toggle which buttons show
  const [disabled, setDisabled] = useState(true); // to toggle state of message input box and button
  const [errors, setErrors] = useState({
    password: {
      active: false,
      passwordMatch: '',
    },
    message: {
      active: false,
      messageLength: '',
    },
    username: {
      active: false,
      isNotUnique: '',
    },
    login: {
      active: false,
      credentials: '',
    },
  });

  // *** MESSAGE(S) STATE
  const [message, setMessage] = useState({
    owner: '', // sessionUserId
    message: '', // string input
    poster: '', // sessionUsername
  });
  const [messages, setMessages] = useState([]); // array of all messages from db

  // *** MODAL STATE
  const [modal, setModal] = useState(false);
  const [logInModal, setLogInModal] = useState(false);

  // *** USE EFFECT
  useEffect(() => {
    // runs on page load or when "load" state value is changed
    let isMounted = true;
    let authorizedToken = localStorage.getItem('authToken');
    console.log(authorizedToken);

    if (authorizedToken !== '') {
      // i.e., there IS a token
      setDisabled(false); // enables use of message input box
      setAuth(true); // // authorizes the user
    }
    axios
      .get('http://127.0.0.1:8000/api/users/') // get an array of all users and compare to username in local storage to retrieve user Id, needed for owner field of message object
      .then(response => {
        let username = localStorage.getItem('username');
        let allUsers = response.data;
        let sessionUser = allUsers.filter(x => x.username === username);

        console.log(allUsers);

        console.log(sessionUser);
        console.log(sessionUser[0].id);
        sessionUserId = sessionUser[0].id;
        localStorage.setItem('userId', sessionUserId);
      })
      .catch(error => {
        console.log(error);
      });
    // fetch('http://127.0.0.1:8000/api/messages/', {
    //   method: 'GET',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: 'Token ' + localStorage.getItem('authToken'),
    //   },
    //   body: JSON.stringify(user),
    // });
    axios
      .get('http://127.0.0.1:8000/api/messages/')
      .then(response => {
        console.log(response.data);
        setMessages(response.data);
      })
      .catch(error => {
        console.log(error);
      });
    return () => (isMounted = false);
  }, [load]);

  // *** MODAL TOGGLERS
  const toggleSignUp = () => setModal(!modal);
  const toggleLogIn = () => setLogInModal(!logInModal);

  // *** CHANGE HANDLERS
  const handleChangeUser = e => {
    setUser({
      ...user,
      [e.target.name]: e.target.value,
    });
  };

  const handleChangeLogInUser = e => {
    setLogInUser({
      ...logInUser,
      [e.target.name]: e.target.value,
    });
  };

  const handleChangeMessage = e => {
    setMessage({
      ...message,
      owner: localStorage.getItem('userId'),
      message: e.target.value,
      poster: sessionUsername,
    });
  };

  // *** // SUBMIT HANDLERS
  const handleSubmitUser = e => {
    errors.username.active = false;
    // Password match validation check
    if (user.password !== confirm) {
      setErrors({
        ...errors,
        password: {
          active: true,
          passwordMatch: 'Passwords do not match.',
        },
      });
      setUser({
        ...user,
        password: '',
        confirmPassword: setConfirm(''),
      });
      return;
    }
    // If passwords match, send the user object to the database. Note: use 127.0.0.1 instead of 'localhost' in url for cookies to work properly
    fetch('http://127.0.0.1:8000/api/users/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    })
      .then(res => console.log(res))
      .then(res => res.json())
      .then(res => {
        console.log(res);
        if (res.username !== user.username) {
          setErrors({
            ...errors,
            username: {
              active: true,
              isNotUnique:
                'Username exists. Please choose another username or sign in.',
            },
          });
          console.log(user);
          return;
        }
        if (errors.username.active === false) {
          setAuth(true);
          setDisabled(false);
          authorizeUser(user);
          setUser({
            username: '',
            email: '',
            password: '',
          });
          setConfirm('');
          toggleSignUp();
        }
      })
      .catch(error => console.log(error));
  };

  const authorizeUser = userObj => {
    // Send logInUser object to database
    fetch('http://127.0.0.1:8000/auth/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userObj),
    })
      .then(data => data.json())
      .then(data => {
        console.log('*****DATA RETURNED FROM AUTH******');
        console.log(data);
        setAuth(true);
        setDisabled(false);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('username', userObj.username);
        load === 1 ? setLoad(0) : setLoad(1);
      })
      .catch(error => console.log(error));
  };

  const handleLogInUser = () => {
    errors.login.active = false;
    // Send logInUser object to database
    fetch('http://127.0.0.1:8000/auth/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logInUser),
    })
      .then(data => data.json())
      .then(data => {
        if (data.token) {
          console.log('*****DATA RETURNED FROM LOGIN ******');
          console.log(data.token);
          setAuth(true);
          setDisabled(false);
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('username', logInUser.username);
          setLogInUser({
            username: '',
            password: '',
          });
          toggleLogIn();
          load === 1 ? setLoad(0) : setLoad(1);
        } else {
          setErrors({
            ...errors,
            login: {
              active: true,
              credentials: data.non_field_errors,
            },
          });
          setLogInUser({
            username: '',
            password: '',
          });
        }
      })
      .catch(error => console.log(error));
  };

  const logout = () => {
    console.log('logging user out...');
    localStorage.setItem('username', '');
    localStorage.setItem('authToken', '');
    localStorage.setItem('userId', '');
    setMessage({
      owner: '',
      message: '',
      poster: '',
    });
    setAuth(false);
    setDisabled(true);
    load === 1 ? setLoad(0) : setLoad(1);
  };
  const handleSubmitMessage = () => {
    // Validation check for message length < 300 characters
    if (message.length > 300) {
      setErrors({
        ...errors,
        message: {
          active: true,
          messageLength: 'Message must be 300 characters or less',
        },
      });
      return;
    }
    console.log(message);
    fetch('http://localhost:8000/api/messages/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Token ' + localStorage.getItem('authToken'),
      },
      body: JSON.stringify(message),
    })
      .then(data => {
        data.json();
        console.log(data);
      })
      .catch(error => {
        console.log(error);
      });
    setMessage({
      owner: '',
      message: '',
      poster: '',
    });
    load === 1 ? setLoad(0) : setLoad(1);
  };

  return (
    <div className='wall'>
      <div className='wall__header'>
        <h3>Wall App</h3>
      </div>
      <div className='wall__body'>
        <div className='column-1'></div>
        <div className='column-2'>
          <div className='inner'>
            {/* #MESSAGES MAPPED */}
            {messages.map((msg, i) => (
              <div className='border rounded pl-2 pr-2' key={i}>
                <small style={{ fontSize: 10 }} className='float-left'>
                  {msg.poster}
                </small>
                <small style={{ fontSize: 10 }} className='float-right'>
                  <Moment format='lll'>{msg.created_at}</Moment>
                </small>
                <p className='mt-3'>{msg.message}</p>
              </div>
            ))}
          </div>
          {/* #MESSAGE INPUT */}
          <div>
            <Input
              disabled={disabled}
              type='textarea'
              name='message'
              id='message'
              value={message.message}
              onChange={handleChangeMessage}
            />
            {errors.message.active ? (
              <span>{errors.message.messageLength}</span>
            ) : null}
            <Button
              size='sm'
              disabled={disabled}
              outline
              color='primary'
              className='float-right mt-3'
              onClick={handleSubmitMessage}
            >
              Post
            </Button>
          </div>

          {/* SIGN-UP AND LOG-IN || LOGOUT #BUTTONS */}
          {auth === false ? (
            <div className='wall__buttons text-center'>
              <Button
                className='mr-3'
                color='primary'
                size='sm'
                onClick={toggleSignUp}
              >
                Sign-Up
              </Button>
              <Button
                className='ml-3'
                color='primary'
                size='sm'
                onClick={toggleLogIn}
              >
                Log-In
              </Button>
              &nbsp;
              <div>
                <small className='text-info'>
                  You must be logged in to post a message.
                </small>
              </div>
            </div>
          ) : (
            <div className='wall__buttons text-center'>
              <Button
                size='sm'
                color='danger'
                outline
                className='btn btn-outline-danger'
                onClick={logout}
              >
                Logout
              </Button>
            </div>
          )}
        </div>
        <div className='column-3'></div>
      </div>
      {/* #SIGNUP_MODAL */}
      <div>
        <Modal isOpen={modal} toggle={toggleSignUp}>
          <ModalHeader toggle={toggleSignUp}>Sign Up</ModalHeader>
          <ModalBody>
            <FormGroup>
              <Label for='username'>Username</Label>
              <Input
                type='text'
                name='username'
                value={user.username}
                onChange={handleChangeUser}
              />
            </FormGroup>
            {errors.username.active ? (
              <small className='text-danger'>
                {errors.username.isNotUnique}
              </small>
            ) : null}
            <FormGroup>
              <Label for='email'>Email</Label>
              <Input
                type='text'
                name='email'
                value={user.email}
                onChange={handleChangeUser}
              />
            </FormGroup>
            <FormGroup>
              <Label for='password'>Password</Label>
              <Input
                type='password'
                name='password'
                value={user.password}
                onChange={handleChangeUser}
              />
            </FormGroup>
            <FormGroup>
              <Label for='confirmPassword'>Confirm Password</Label>
              <Input
                type='password'
                name='confirmPassword'
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
              />
            </FormGroup>
            {errors.password.active ? (
              <small className='text-danger'>
                {errors.password.passwordMatch}
              </small>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button color='primary' size='sm' onClick={handleSubmitUser}>
              Submit
            </Button>
            <Button color='secondary' size='sm' onClick={toggleSignUp}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      </div>
      {/* END SIGNUP_MODAL */}

      {/* #LOGIN_MODAL */}
      <div>
        <Modal isOpen={logInModal} toggle={toggleLogIn}>
          <ModalHeader toggle={toggleLogIn}>Log In</ModalHeader>
          <ModalBody>
            <FormGroup>
              <Label for='username'>Username</Label>
              <Input
                type='text'
                name='username'
                value={logInUser.username}
                onChange={handleChangeLogInUser}
              />
            </FormGroup>
            <FormGroup>
              <Label for='password'>Password</Label>
              <Input
                type='password'
                name='password'
                value={logInUser.password}
                onChange={handleChangeLogInUser}
              />
            </FormGroup>
            {errors.login.active ? (
              <span className='text-danger'>{errors.login.credentials}</span>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button color='primary' size='sm' onClick={handleLogInUser}>
              Submit
            </Button>
            <Button color='secondary' size='sm' onClick={toggleLogIn}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      </div>
      {/* END LOGIN_MODAL */}
    </div>
  );
};

export default Wall;

// {
//   "emmet.includeLanguages": {
//      "javascript": "javascriptreact"
//   }
// }
