import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import {getDB} from "../db/index.js"
import {ObjectId} from "mongodb" 

export const adminVerify = asyncHandler(async(req, _, next) => {
    try {

        const db = getDB()
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)


        if (!decodedToken || !decodedToken._id) {
            throw new ApiError(401, "Invalid Access Token");
        }
    
        const admin = await db.collection("admins").findOne({_id: new ObjectId(decodedToken._id)})
    
        if (!admin) {
            
            throw new ApiError(401, "Admin not found")
        }
    
        req.admin = admin;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
    
})