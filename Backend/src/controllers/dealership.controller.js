import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"

import {getDB} from "../db/index.js"
import {hashPassword,comparePassword} from "../utils/bcrypt.js"
import {generateAccessToken,generateRefreshToken} from "../utils/jwt.js"
 

import {faker} from "@faker-js/faker"

import {uploadOnCloudinary} from "../utils/cloudinary.js"

import {ObjectId} from "mongodb"


const generateAccessAndRefereshTokens = async(dealerId) =>{
    try {
        const db = getDB()
        const dealer = await db.collection("dealerships").findOne({_id: new ObjectId(dealerId)})

        if (!dealer) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = generateAccessToken(dealer)
        const refreshToken = generateRefreshToken(dealer)

        await db.collection("dealerships").updateOne(
            { _id: new ObjectId(dealerId) },
            { $set: { refreshToken: refreshToken } }
        );

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerDealer = asyncHandler(async (req,res) =>{
    const db = getDB()

    let {email,password,location,name} = req.body

    if (!name || !email || !location) {
        email = faker.internet.email();
        location = faker.location.city();
        name = faker.internet.userName();
    }


    if([email,password,location,name].some((filed) => filed?.trim() === "")){
        throw new ApiError(400,"All fields are required")
    }

    console.log(email,password,location,name);


    const hashedPassword = await hashPassword(password)

    const existedDealer = await db.collection("dealerships").findOne({email})

    if(existedDealer){
        throw new ApiError(409,"User with email or username already exists")
    }

    const dealer = await db.collection("dealerships").insertOne({
        email,
        password : hashedPassword,
        location,
        dealerInfo:{
            name
        }
    })

    const createdDealer = await db.collection("dealerships").findOne({_id: dealer.insertedId},{projection:{password:0,refreshtoken:0}})

    if(!createdDealer){
        throw new ApiError(500,"Something went wrong while registering Dealer")
    }

    return res.status(201).json(
        new ApiResponse(200,createdDealer,"Dealer registered successfully")
    )

})


const loginDealer = asyncHandler(async (req,res) =>{

    const db = getDB()

    const {email,name,password} = req.body

    if(!(email || name)){throw new ApiError(400,"name or email is required")}

const dealer = await db.collection("dealerships").findOne({
    $or:[{"dealerInfo.name":name},{email}]
})

if (!dealer) {
    throw new ApiError(404, "Dealer does not exist")
}

const isPasswordValid = await comparePassword(password,dealer.password)

if (!isPasswordValid) {
 throw new ApiError(401, "Invalid Dealer credentials")
 }

 const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(dealer._id)


 const loggedInDealer = await db.collection("dealerships").findOne(
    { _id: dealer._id },
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
            dealer: loggedInDealer, accessToken, refreshToken
        },
        "Dealer logged In Successfully"
    )
)


})

const logoutDealer = asyncHandler(async (req,res) =>{
    try {
        const db = getDB();

        await db.collection("dealerships").updateOne(
            { _id: req.dealer._id },
            { $unset: { refreshToken: 1 } }
        );

        const options = {
            httpOnly: true,
            secure: true
        };
        res.clearCookie("accessToken", options);
        res.clearCookie("refreshToken", options);

        return res.status(200).json(new ApiResponse(200, {}, "Dealer logged Out"));
    } 
    catch (error)
     {
        throw new ApiError(500, "Error logging out user");
    }
})

const addCar = asyncHandler(async (req,res) =>{

    const db = getDB()

    let {type,name,model,color,fuel,price,image} =  req.body

    const ImageLocalPath = req.files?.image[0]?.path

    if (!ImageLocalPath) {
        const dummyImage = faker.image.url()
        image = { url: dummyImage}
    }
    else{
        image = await uploadOnCloudinary(ImageLocalPath)
    }

    if (!color || !price || !type || !name || !model || !fuel){
        name = faker.vehicle.vehicle()
        type = faker.vehicle.type()
        model = faker.vehicle.model()
        color = faker.vehicle.color()
        fuel = faker.vehicle.fuel()
        price = faker.commerce.price()
    }




    if([type,name,model,color,fuel,price].some((filed) => filed?.trim() === "" || null)){
        throw new ApiError(400,"All fields are required")
    }



    const existedCar = await db.collection("cars").findOne({
        $or:[{name},{model}]
    })

    if(existedCar){
        throw new ApiError(409,"Car with name or model already exists")
    }


    const car = await db.collection("cars").insertOne({
        name,
        type,
        model,
        carInfo:{
            color,
            fuel,
            price,
            image: image.url
        }
    })

    const createdCar = await db.collection("cars").findOne({_id: car.insertedId})

    if(!createdCar){
        throw new ApiError(500,"Something went wrong while adding car")
    }

    await db.collection("dealerships").updateOne(
        { _id: req.dealer._id },
        { $push: { cars: createdCar } }
    );

    return res.status(201).json(
        new ApiResponse(200,createdCar,"Car added successfully")
    )

})

const addDeal = asyncHandler(async (req,res) =>{

    const db = getDB()

    let {dealName,dealStatus,carId} =  req.body

    dealStatus = "available"

    if (!dealName) {
        dealName = faker.commerce.productName()
    }

    if([dealName,dealStatus,carId].some((filed) => filed?.trim() === "")){
        throw new ApiError(400,"All fields are required")
    }

    const existedDeal = await db.collection("deals").findOne({"dealInfo.dealName" : dealName})

    if(existedDeal){
        throw new ApiError(409,"deal already exists")
    }
    const car = await db.collection("cars").findOne({_id:new ObjectId(carId)})

    const deal = await db.collection("deals").insertOne({
        car,
        dealInfo:{
            dealName,
            dealStatus
        }
    })

    const createdDeal = await db.collection("deals").findOne({_id: deal.insertedId})

    if(!createdDeal){
        throw new ApiError(500,"Something went wrong while adding Deal")
    }

    await db.collection("dealerships").updateOne(
        { _id: req.dealer._id },
        { $push: { deals: createdDeal } }
    );


    return res.status(201).json(
        new ApiResponse(200,createdDeal,"deal added successfully")
    )

})

const getSoldVehicles = asyncHandler(async (req, res) => {
    try {
        const db = getDB();

        const carIds = req.dealer.cars.map(car => car._id);

        const soldVehicles = await db.collection("soldvehicles").find({
            "car._id": { $in: carIds }
        }).toArray();

        for (const soldVehicle of soldVehicles) {

            const users = await db.collection("users").find({
                "vehicleInfo._id": soldVehicle._id
            }, { projection: { _id: 1, email: 1,"userInfo.fullName":1 } }).toArray();

            soldVehicle.users = users;
        }

        for (const soldVehicle of soldVehicles) {
            const soldVehicleExists = req.dealer.soldVehicles.some(existingSoldVehicle => existingSoldVehicle._id.equals(soldVehicle._id));

            if (!soldVehicleExists) {
                await db.collection("dealerships").updateOne(
                    { _id: req.dealer._id },
                    { $addToSet: { soldVehicles: soldVehicle } }
                );
            }
        }

        return res.status(200).json(new ApiResponse(200, { soldVehicles }, "Sold cars fetched"));

    } catch (error) {
        throw new ApiError(500, "Error fetching sold cars");
    }
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


 


export { 
    registerDealer,
    addCar,
    addDeal,
    loginDealer,
    logoutDealer,
    getSoldVehicles,
    getAllCars,
    getCarsInDealership,
    getDealsInDealership
}