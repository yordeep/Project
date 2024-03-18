import {Router} from "express"
import {
     registerUser,
     loginUser,
     logoutUser,
     buyVehicles,
     getCarsInDealership,
     getAllCars,
     getDealsInDealership,
     getDealershipsByCar,
     getDealsByCar,
     getMyVehicles
    } from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
import {userVerify} from "../middlewares/userAuth.middleware.js"

const router = Router()

router.route("/register").post(upload.none(),registerUser)

router.route("/login").post(upload.none(),loginUser)

router.route("/logout").post(userVerify,logoutUser)

router.route("/buyvehicle").post(upload.none(),userVerify,buyVehicles)

router.route("/getallcars").get(userVerify,getAllCars)

router.route("/getcarsindealership").get(upload.none(),userVerify,getCarsInDealership)

router.route("/getdealsindealership").get(upload.none(),userVerify,getDealsInDealership)

router.route("/getdealershipbycar").get(upload.none(),userVerify,getDealershipsByCar)

router.route("/getdealsbycar").get(upload.none(),userVerify,getDealsByCar)

router.route("/getmyvehicles").get(userVerify,getMyVehicles)



export default router