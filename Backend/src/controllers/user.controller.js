import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"

import {getDB} from "../db/index.js"
import {hashPassword,comparePassword} from "../utils/bcrypt.js"
import {generateAccessToken,generateRefreshToken} from "../utils/jwt.js"

import {faker} from "@faker-js/faker"
import { ObjectId } from "mongodb"

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const db = getDB()
        const user = await db.collection("users").findOne({_id: new ObjectId(userId)})

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = generateAccessToken(user)
        const refreshToken = generateRefreshToken(user)

        await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            { $set: { refreshToken: refreshToken } }
        );

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}


const registerUser = asyncHandler(async (req,res) =>{
    const db = getDB()

    let {email,password,location,userName,fullName} = req.body

    if (!userName || !fullName || !email || !location) {
        email = faker.internet.email();
        location = faker.location.city();
        fullName = faker.person.fullName();
        userName = faker.internet.userName();
    }


    if([email,password,location,userName,fullName].some((filed) => filed?.trim() === "")){
        throw new ApiError(400,"All fields are required")
    }


    const hashedPassword = await hashPassword(password)

    const existedUser = await db.collection("users").findOne({"userInfo.email":email})

    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")
    }

    const user = await db.collection("users").insertOne({
        email,
        password : hashedPassword,
        location,
        userInfo:{
            userName,
            fullName
        }
    })

    const createdUser = await db.collection("users").findOne({_id: user.insertedId},{projection:{password:0,refreshtoken:0}})

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )

})

const loginUser = asyncHandler(async (req,res) =>{

    const db = getDB()

    const {email,userName,password} = req.body

    if(!(userName || email)){throw new ApiError(400,"userName or email is required")}

const user = await db.collection("users").findOne({
    $or:[{"userInfo.userName":userName},{email}]
})

if (!user) {
    throw new ApiError(404, "User does not exist")
}

const isPasswordValid = await comparePassword(password,user.password)

if (!isPasswordValid) {
 throw new ApiError(401, "Invalid user credentials")
 }

 const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)


 const loggedInUser = await db.collection("users").findOne(
    { _id: user._id },
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
            user: loggedInUser, accessToken, refreshToken
        },
        "User logged In Successfully"
    )
)


})

const logoutUser = asyncHandler(async (req,res) =>{
    try {
        const db = getDB();

        await db.collection("users").updateOne(
            { _id: req.user._id },
            { $unset: { refreshToken: 1 } }
        );

        const options = {
            httpOnly: true,
            secure: true
        };
        res.clearCookie("accessToken", options);
        res.clearCookie("refreshToken", options);

        return res.status(200).json(new ApiResponse(200, {}, "User logged Out"));
    } 
    catch (error)
     {
        throw new ApiError(500, "Error logging out user");
    }
})

const buyVehicles = asyncHandler( async (req,res) =>{

    const db = getDB()
    let {carId,manufacturer} = req.body

    if(!manufacturer){
      manufacturer = faker.vehicle.manufacturer()
    }

    if([carId,manufacturer].some((filed) => filed?.trim() === "" || null)){
        throw new ApiError(400,"All fields are required")
    }

    const existedVehicle = await db.collection("soldvehicles").findOne({manufacturer})

    if(existedVehicle){
        throw new ApiError(409,"Vehicle already exists")
    }

    const car = await db.collection("cars").findOne({_id:new ObjectId(carId)})


    const vehicle = await db.collection("soldvehicles").insertOne({
        car,
        vehicleInfo :{
            manufacturer
        }
    })

    const createdVehicle = await db.collection("soldvehicles").findOne({_id: vehicle.insertedId})


    if(!createdVehicle){
        throw new ApiError(500,"Something went wrong while adding Vehicle")
    }

    await db.collection("users").updateOne(
        { _id: req.user._id },
        { $push: { vehicleInfo: createdVehicle } }
    );


    return res.status(201).json(
        new ApiResponse(200,createdVehicle,"deal added successfully")
    )


})

const getAllCars = asyncHandler(async(req, res) => {
    try {
        const db = getDB();
        
        const allCars = await db.collection("cars").find().toArray();

        return res.status(200).json(new ApiResponse(200, { cars: allCars }, "All cars fetched"));
    } catch (error) {
        throw new ApiError(500, "Error fetching cars");
    }
})

const getCarsInDealership = asyncHandler(async (req, res) => {
    try {
        const db = getDB()
        const { dealerId } = req.body

        const dealership = await db.collection("dealerships").findOne({ _id: new ObjectId(dealerId) })

        if (!dealership) {
            throw new ApiError(404, "Dealership not found");
        }

        const carsInDealership = dealership.cars || []

        return res.status(200).json(new ApiResponse(200, { cars: carsInDealership }, "Cars in dealership fetched"))
    } catch (error) {
        throw new ApiError(500, "Error fetching cars in dealership")
    }
})

const getDealsInDealership = asyncHandler(async (req, res) => {
    try {
        const db = getDB()
        const { dealerId } = req.body

        const dealership = await db.collection("dealerships").findOne({ _id: new ObjectId(dealerId) })

        if (!dealership) {
            throw new ApiError(404, "Dealership not found");
        }

        const dealsInDealership = dealership.deals || []

        return res.status(200).json(new ApiResponse(200, { deals: dealsInDealership }, "Deals in dealership fetched"))
    } catch (error) {
        throw new ApiError(500, "Error fetching deals in dealership")
    }
})


const getDealershipsByCar = asyncHandler(async (req, res) => {
    try {
        const db = getDB();
        const { carId } = req.body 

        const dealershipsWithCar = await db.collection("dealerships").find({ cars: { $elemMatch: { _id: new ObjectId(carId) } } },{projection:{_id:1,"dealerInfo.name":1}}).toArray();

        return res.status(200).json(new ApiResponse(200, { dealerships: dealershipsWithCar }, "Dealerships with the specified car fetched"));

    } catch (error) {
        throw new ApiError(500, "Error fetching dealerships with the specified car");
    }
})


const getDealsByCar = asyncHandler(async (req, res) => {
    try {
        const db = getDB();
        const { carId } = req.body;

        const dealsWithCar = await db.collection("deals").find(
            { "car._id": new ObjectId(carId) },
            { projection: { _id: 1,"dealInfo.dealName":1 } }
        ).toArray();

        return res.status(200).json(new ApiResponse(200, { deals: dealsWithCar }, "Deals related to the specified car fetched"));

    } catch (error) {
        throw new ApiError(500, "Error fetching deals related to the specified car");
    }
})

const getMyVehicles = asyncHandler(async (req, res) => {
    try {
        const db = getDB()
        
        const user = await db.collection("users").findOne({ _id: req.user._id })

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const userVehicles = user.vehicleInfo

        for (const vehicle of userVehicles) {
            const dealerships = await db.collection("dealerships").find({
                "soldVehicles._id": vehicle._id
            }, { projection: { _id: 1, "dealerInfo.name": 1, location: 1 } }).toArray()


            vehicle.dealerships = dealerships
        }

        return res.status(200).json(new ApiResponse(200, { userVehicles }, "User's vehicles fetched with dealership info"))

    } catch (error) {
        throw new ApiError(500, "Error fetching user's vehicles")
    }
});




export {
     registerUser,
     loginUser,
     logoutUser,
     buyVehicles,
     getAllCars,
     getCarsInDealership,
     getDealsInDealership,
     getDealershipsByCar,
     getDealsByCar,
     getMyVehicles
}