import {Router} from "express"
import {
    registerDealer,
    addCar,
    addDeal,
    loginDealer,
    logoutDealer,
    getSoldVehicles,
    getAllCars,
    getCarsInDealership,
    getDealsInDealership
} from "../controllers/dealership.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
import { dealershipVerify } from "../middlewares/dealrshipAuth.middleware.js"

const router = Router()

router.route("/register").post(upload.none(),registerDealer)

router.route("/login").post(upload.none(),loginDealer)

router.route("/logout").post(dealershipVerify,logoutDealer)

router.route("/addcar").post(upload.fields([{name:"image",maxCount:1}]),dealershipVerify,addCar)

router.route("/adddeal").post(upload.none(),dealershipVerify,addDeal)

router.route("/getsoldvehicles").get(dealershipVerify,getSoldVehicles)

router.route("/getallcars").get(dealershipVerify,getAllCars)

router.route("/getcarsindealership").get(upload.none(),dealershipVerify,getCarsInDealership)

router.route("/getdealsindealership").get(upload.none(),dealershipVerify,getDealsInDealership)


export default router