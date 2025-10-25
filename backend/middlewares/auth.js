import { verifyToken } from "../utils/jwtToken.js";

// Token verification middleware
export const authenticate = (req, res, next) => {
  // Get token from Authorization header instead of cookies
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ 
      error: 'Authentication required' 
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ 
      error: 'Invalid or expired token' 
    });
  }
  
  req.user = decoded.user;
  next();
};

// authorize role before preceding request
export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
}