import {MongoClient} from "mongodb"
import {DB_NAME} from "../constants.js"

let dbConnection

const connectDB = (cb) => {
    MongoClient.connect(process.env.MONGODB_URI)
    .then((client) => {
        dbConnection =  client.db(DB_NAME)
        return dbConnection.admin().listDatabases()
    })
    .then((databaseList) =>{
        if(databaseList.databases.some(db => db.name === DB_NAME)){
            console.log(`Database ${DB_NAME} aleady exits.`)
            return cb()
        }
        else{
            console.log(`Database ${DB_NAME} created.`)
            return cb()
        }
    })
    .catch(error =>{
        console.log("Error : ",error)
        return cb(error)
    })
}

const getDB = () => dbConnection



export {connectDB,getDB}