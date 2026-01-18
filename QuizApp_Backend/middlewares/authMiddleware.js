import jwt from 'jsonwebtoken'; // Make sure this line is present
import User from '../models/Student.js';

export const protect = async (req, res, next) => {
    let token;

    // Check for token in cookies
    if (req.cookies.token) {
        token = req.cookies.token;
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, "divyansh");
            
            // const user = await User.findById(decoded.id).select('-password');
            // if(user.role == "teacher"){
            //     req.user
            // next();
            req.user = await User.findById(decoded.id).select('-password');
            next();
            // }else{
            //     res.status(401).json({
            //         success: false,
            //         message: 'Not authorized, token failed student',
            //         data: null
            //     });
            // }
            
        } catch (error) {
            console.error('Token verification error:', error); // Log the error
            res.status(401).json({
                success: false,
                message: 'Not authorized, token failed',
                data: null
            });
        }
    } else {
        res.status(401).json({ 
            success: false,
            message: 'Not authorized, no token' ,
            data: null
        });
    }
};
