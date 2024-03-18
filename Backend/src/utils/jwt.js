import Jwt  from "jsonwebtoken";

const generateAccessToken = (user) =>{
    return Jwt.sign(
        {
            _id: user._id,
            email: user.email,
            username: user.username,
            fullName: user.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

const generateRefreshToken = (user) =>{
    return Jwt.sign({
        _id: user._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
    )
}

export {generateAccessToken,generateRefreshToken}