import bcrypt from "bcrypt"

const hashPassword = async(passwrod) =>{
    return await bcrypt.hash(passwrod,10)
}

const comparePassword = async(passwrod,hashedPassword) =>{
    return await bcrypt.compare(passwrod,hashedPassword)
}


export {hashPassword,comparePassword}

