import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"

import {getDB} from "../db/index.js"
import {hashPassword,comparePassword} from "../utils/bcrypt.js"
import {generateAccessToken,generateRefreshToken} from "../utils/jwt.js"
import { ObjectId } from "mongodb"


const generateAccessAndRefereshTokens = async(adminId) =>{
    try {
        const db = getDB()
        const admin = await db.collection("admins").findOne({_id: new ObjectId(adminId)})

        if (!admin) {
            throw new ApiError(404, "Admin not found");
        }

        const accessToken = generateAccessToken(admin)
        const refreshToken = generateRefreshToken(admin)

        await db.collection("admins").updateOne(
            { _id: new ObjectId(adminId) },
            { $set: { refreshToken: refreshToken } }
        );

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerAdmin = asyncHandler(async (req,res) =>{

    const db = getDB()
    const {password} = req.body

    if(password === ""){
        throw new ApiError(400,"password is required")
    }

    const hashedPassword = await hashPassword(password)

    const admin = await db.collection("admins").insertOne({
        password : hashedPassword
     })

     const createdAdmin = await db.collection("admins").findOne({_id: admin.insertedId},{projection:{password:0,refreshtoken:0}})

     if(!createdAdmin){
         throw new ApiError(500,"Something went wrong while registering Admin")
     }
 
     return res.status(201).json(
         new ApiResponse(200,createdAdmin,"Admin registered successfully")
     )

})

const loginAdmin = asyncHandler(async (req,res) =>{

    const db = getDB()

    const {id,password} = req.body

    if(!id){throw new ApiError(400,"id is required")}

const admin = await db.collection("admins").findOne({_id: new ObjectId(id)})

if (!admin) {
    throw new ApiError(404, "Admin does not exist")
}

const isPasswordValid = await comparePassword(password,admin.password)

if (!isPasswordValid) {
 throw new ApiError(401, "Invalid admin credentials")
 }

 const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(admin._id)


 const loggedInUser = await db.collection("admins").findOne(
    { _id: admin._id },
    { projection: { password: 0, refreshToken: 0 } }
);

 const options = {
    httpOnly: true,
    secure: true
}

return res
.status(200)
.cookie("accessToken", accessToken, options)
.cookie("refreshToken", refreshToken, options)
.json(
    new ApiResponse(
        200, 
        {
            admin: loggedInUser, accessToken, refreshToken
        },
        "Admin logged In Successfully"
    )
)


})

const logoutUser = asyncHandler(async (req,res) =>{
    try {
        const db = getDB();

        await db.collection("admins").updateOne(
            { _id: req.admin._id },
            { $unset: { refreshToken: 1 } }
        );

        const options = {
            httpOnly: true,
            secure: true
        };
        res.clearCookie("accessToken", options);
        res.clearCookie("refreshToken", options);

        return res.status(200).json(new ApiResponse(200, {}, "Admin logged Out"));
    } 
    catch (error)
     {
        throw new ApiError(500, "Error logging out Admin");
    }
})

export { 
    registerAdmin,
    loginAdmin,
    logoutUser
}