import dotenv from "dotenv"
import {connectDB,getDB} from "./db/index.js"
import {app} from "./app.js"

dotenv.config({
    path:'./.env'
})

let db

connectDB((error) =>{
    if(!error){
        app.listen(process.env.PORT || 3000, () => {
            console.log(`Server is running at port : ${process.env.PORT}`)
        })

        db = getDB()
    }
})