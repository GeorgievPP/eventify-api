import jwt from 'jsonwebtoken';

const generateToken = (user) => {
    const payload = {
        id: user._id,
        role: user.role,
        email: user.email,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    });

    return token;
};

export default generateToken;
