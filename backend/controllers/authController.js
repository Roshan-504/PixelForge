import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwtToken.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 1. Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password'
      });
    }

    // 2. Check if user exists && password is correct
    const user = await User.findOne({ email });

     // for first time login someone with new mongoDB URL
    if(email == "admin@gmail.com" && password == "admin" && !user) {
        const user = {
            name: "Admin",
            email: "admin@gmail.com:",
            role: "admin",
        }
        const token = generateToken(user);
        res.status(200).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password'
      });
    }

    if (!user ) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password'
      });
    }

    // 3. If everything ok, send token to client
    const token = generateToken(user);

    // 4. Remove password from output
    user.password = undefined;

    // 5. Send response with token
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user
      }
    });

  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong! Please try again later.'
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = req.user; // User is set by the authenticate middleware

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    // Remove password from output
    user.password = undefined;

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong! Please try again later.'
    });
  }
}
