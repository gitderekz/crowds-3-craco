const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models');

// Helper function to generate tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
  
  const refreshToken = jwt.sign(
    { id: user.id }, 
    process.env.REFRESH_TOKEN_SECRET, 
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
};


// exports.register = async (req, res) => {
//   const { username, password, role } = req.body;
//   const hashedPassword = await bcrypt.hash(password, 10);
//   const user = await db.user.create({ username, password: hashedPassword, role });
//   res.status(201).json({ message: 'User registered', user });
// };
exports.registerClient = async (req, res) => {
  const { username, email, password, role } = req.body;

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Create the user in the database
    const user = await db.user.create({ username, email, password: hashedPassword, role });

    // // Generate a JWT token
    // const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });

    // Return the token, role, and userId in the response
    res.status(201).json({
      message: 'User registered', 
      // token, 
      // role: user.role, 
      // userId: user.id 
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Error registering user', error });
  }
};

// exports.register = async (req, res) => {
// const { username, email, password, role } = req.body;

// // Hash the password
// const hashedPassword = await bcrypt.hash(password, 10);

// try {
//   // Create the user in the database
//   const user = await db.user.create({ username, email, password: hashedPassword, role });

//   // Generate a JWT token
//   const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });

//   // Return the token, role, and userId in the response
//   res.status(201).json({ 
//     message: 'User registered', 
//     accessToken, 
//     user, 
//     role: user.role, 
//     userId: user.id 
//   });
// } catch (error) {
//   console.error('Error during registration:', error);
//   res.status(500).json({ message: 'Error registering user', error });
// }
// };

// exports.login = async (req, res) => {
//   console.log('Request Body:', req.body);    
//   const { username, password } = req.body;    

//   // Check if username and password are provided
//   if (!username || !password) {
//     return res.status(400).json({ message: 'Username and password are required', data:req.body });
//   }

//   try {
//     const user = await db.user.findOne(
//       { 
//         where: {
//           [db.Sequelize.Op.or]: [
//             { username: username },
//             { email: username }
//           ]
//         } 
//       }
//     );

//     if (!user || !(await bcrypt.compare(password, user.password))) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
//     res.json({ accessToken, user, role: user.role, userId:user.id });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: 'Something went wrong' });
//   }
// };

// exports.validate = async (req, res) => {
//   try {
//     // The middleware already validated the token
//     // If we reach here, the token is valid
//     const user = req.user;
    
//     // You might want to fetch fresh user data from DB
//     // const freshUserData = await User.findById(user.id);
    
//     res.status(200).json({ 
//       valid: true,
//       user: {
//         id: user.id,
//         username: user.username,
//         role: user.role
//         // Add other necessary user data
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       message: 'Validation error',
//       error: error.message 
//     });
//   }
// }


exports.register = async (req, res) => {
  const { username, email, password, role } = req.body;
  console.log('req.body',req.body);
  // res.status(500).json({k:"V"});

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    // Prepare user data
    const userData = {
      username,
      email,
      password: hashedPassword,
      role
    };
    // Add avatar path if file was uploaded
    if (req.file) {
      userData.avatar = `/uploads/avatar/${req.file.filename}`;
    }
    // Create user
    // const user = await db.user.create({ username, email, password: hashedPassword, role });
    const user = await db.user.create(userData);
    
    const { accessToken, refreshToken } = generateTokens(user);

    res.status(201).json({ 
      message: 'User registered', 
      accessToken, 
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user', error });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;  
  console.log('req.body',req.body);  

  try {
    const user = await db.user.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          { username: username },
          { email: username }
        ]
      } 
    });

    console.log('userfound',user);
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    res.json({ 
      accessToken, 
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error });
  }
};

exports.validate = async (req, res) => {
  try {
    // Get fresh user data from DB
    const user = await db.user.findByPk(req.user.id, {
      attributes: ['id', 'username', 'role', 'email', 'lastSeen','avatar','online']
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ 
      valid: true,
      user 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Validation error',
      error: error.message 
    });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const user = await db.user.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    
    res.json({ 
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Token refresh failed' });
  }
};

exports.logout = async (req, res) => {
  try {
    // In a real application, you might want to:
    // 1. Add the token to a blacklist
    // 2. Delete the refresh token from DB if you're storing them
    // 3. Perform other cleanup
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
};
  
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const db = require('../models');

// // Helper function to generate tokens
// const generateTokens = (user) => {
//   const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' }); // Short-lived access token
//   const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' }); // Long-lived refresh token
//   return { accessToken, refreshToken };
// };

// // Register a new user
// exports.register = async (req, res) => {
//   const { username, password, role } = req.body;

//   try {
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = await db.user.create({ username, password: hashedPassword, role });

//     // Generate tokens
//     const { accessToken, refreshToken } = generateTokens(user);

//     // Save the refresh token in the database
//     await db.refresh_token.create({ token: refreshToken, userId: user.id });

//     res.status(201).json({
//       message: 'User registered',
//       accessToken,
//       refreshToken,
//       user,
//       role: user.role,
//       userId: user.id,
//     });
//   } catch (error) {
//     console.error('Error during registration:', error);
//     res.status(500).json({ message: 'Error registering user', error });
//   }
// };
  
// // Login a user
// exports.login = async (req, res) => {
//   const { username, password } = req.body;

//   // Check if username and password are provided
//   if (!username || !password) {
//     return res.status(400).json({ message: 'Username and password are required', data:req.body });
//   }

//   try {
//     const user = await db.user.findOne({ where: { username } });

//     if (!user || !(await bcrypt.compare(password, user.password))) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     // Generate tokens
//     const { accessToken, refreshToken } = generateTokens(user);

//     // Save the refresh token in the database
//     await db.refresh_token.create({ token: refreshToken, userId: user.id });

//     res.json({
//       accessToken,
//       refreshToken,
//       user,
//       role: user.role,
//       userId: user.id,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Something went wrong' });
//   }
// };

// // Refresh access token
// exports.refreshToken = async (req, res) => {
//   const { refreshToken } = req.body;

//   if (!refreshToken) {
//     return res.status(401).json({ message: 'Refresh token is required' });
//   }

//   try {
//     // Verify the refresh token
//     const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

//     // Check if the refresh token exists in the database
//     const storedToken = await db.refresh_token.findOne({
//       where: { token: refreshToken, userId: decoded.id },
//     });

//     if (!storedToken) {
//       return res.status(403).json({ message: 'Invalid refresh token' });
//     }

//     // Generate a new access token
//     const user = await db.user.findByPk(decoded.id);
//     const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });

//     res.json({ accessToken });
//   } catch (error) {
//     console.error(error);
//     res.status(403).json({ message: 'Invalid refresh token' });
//   }
// };

// exports.registerClient = async (req, res) => {
//   const { username, password, role } = req.body;

//   // Hash the password
//   const hashedPassword = await bcrypt.hash(password, 10);

//   try {
//     // Create the user in the database
//     const user = await db.user.create({ username, password: hashedPassword, role });

//     // // Generate a JWT token
//     // const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });

//     // Return the token, role, and userId in the response
//     res.status(201).json({
//       message: 'User registered', 
//       // token, 
//       // role: user.role, 
//       // userId: user.id 
//     });
//   } catch (error) {
//     console.error('Error during registration:', error);
//     res.status(500).json({ message: 'Error registering user', error });
//   }
// };

// exports.logout = async (req, res) => {
//   const { refreshToken } = req.body;

//   try {
//     // Delete the refresh token from the database
//     await db.refresh_token.destroy({ where: { token: refreshToken } });

//     res.status(200).json({ message: 'Logged out successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error logging out' });
//   }
// };