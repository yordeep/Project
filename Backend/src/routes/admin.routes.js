import {Router} from "express"
import {loginAdmin, logoutUser, registerAdmin} from "../controllers/admin.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
import {adminVerify} from "../middlewares/adminAuth.middleware.js"

const router = Router()

// router.route("/register").post(upload.none(),registerAdmin)

router.route("/login").post(upload.none(),loginAdmin)

router.route("/logout").post(adminVerify,logoutUser)

export default router