// import dotenv from "dotenv"
// dotenv.config({path:"./.env"})
// dotenv.config();

// import server from "./app.js"
// import {connectio_to_data_base} from "../connection/connect.js"

// connectio_to_data_base().then(()=>{
//     server.on("error",(error)=>{
//         console.error(error) 
//     }),
//     server.listen(process.env.PORT||6000,()=>{
//         console.log(`server is running on port ${process.env.PORT}`)
//     })   , console.log("mongoDB is connected successfully ");

// }).catch((error)=>{console.log({message:`error ${error}`})})

  

import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";

// ── Local development only ────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 6000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

// ── Vercel needs the app exported ─────────────────────────────────────────────
export default app;