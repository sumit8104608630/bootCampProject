import { asyncHandler } from "../util/asyncHandler.js";
import {apiResponse} from "../util/apiResponse.js"
import User from "../models/user.model.js"
import {uploadFile} from "../util/cloudinary.js"
import { fileURLToPath } from "url"; // Import to define __dirname
// Define __dirname manually in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


import path from "path" 
// user registration controller
// user registration controller (name, email, password, profile photo)

const userRegistration = asyncHandler(async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate all fields
        if ([name, email, password].some(item => item === "")) {
            return res.status(400).json(new apiResponse(400, "", "Please fill all the details"));
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json(new apiResponse(400, {}, "Email already exists"));
        }

        // Validate profile photo
        if (!req.file || !req.file.filename) {
            return res.status(400).json(new apiResponse(400, "", "Please upload your profile photo"));
        }

        // Local temp path for uploaded file
        const localPath = path.join(__dirname, `../public/temp/${req.file.filename}`);

        // Upload to Cloudinary
        const uploadedImage = await uploadFile(localPath);

        // Create user object
        const user = {
            name,
            email,
            password,  // Make sure password is hashed in the model
            profilePhoto: uploadedImage.secure_url
        };

        // Save user in database
        await User.create(user);

        return res.status(201).json(
            new apiResponse(201, "User created successfully")
        );

    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, {}, "Internal Server Error"));
    }
});



// user login functionality
// user login functionality (Email + Password)

const user_login=asyncHandler(async(req,res)=>{
    try {
        const {email,password}=req.body;
        if([email,password].some(item=>item=="")){
            return res.status(400).json(new apiResponse(400,{},"please fill all the field"));
        }
        const user=await User.findOne({email});
        if(!user){
            return res.status(400).json(new apiResponse(400,{},"Invalid phone number"));
        }
       const token=await User.matchPasswordGenerateToken(email,password)
       if(token.success){
        return res.status(400).json(new apiResponse(400,{},token.message))
       }    
       
      return res.status(200).cookie('accessToken',token.token,{
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None':'Lax'
    }).cookie("refresh_token",token.refresh_token,{
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None':'Lax'
    }).json(new apiResponse(
        200,user,"user logged in successfully"
    ))
    } catch (error) {
     console.log(error) 
             return res.status(500).json(new apiResponse(500, {}, "Internal Server Error"));
       
    }
})


// user Logout
const user_logout=asyncHandler(async(req,res)=>{
    try {
        const {id}=req.user;
        await User.findByIdAndUpdate(id,{$set:{refreshToken:undefined,lastSeen:Date.now()}});
       return res.status(200).clearCookie('accessToken',{
            httpOnly:true,
            secure:true,
            sameSite: "None" // Cross-origin 

        }).clearCookie('refresh_token',{
                httpOnly:true,
                secure:true,
                sameSite: "None" // Cross-origin 

                
        }).json(new  apiResponse(200,"logout successfully"));

    } catch (error) {
        console.log(error)
                return res.status(500).json(new apiResponse(500, {}, "Internal Server Error"));
        
    }
});

const getUserInfo=asyncHandler(async(req,res)=>{
    try {
        const {id}=req.user;
        const user=await User.findById(id).select("-contacts -password -refreshToken -salt");
        if(!user){
            return res.status(400).json(new apiResponse(400,{},"unauthorized"))
        }
        return res.status(200).json(new apiResponse(200,{user}, "User info "));
    } catch (error) {
        console.log(error)
    }
})




export {
    userRegistration,
    user_login,
    user_logout,
   getUserInfo
}