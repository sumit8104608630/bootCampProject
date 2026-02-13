import { asyncHandler } from "../util/asyncHandler.js";
import {apiResponse} from "../util/apiResponse.js"
import {apiError} from "../util/apiError.js"
import User from "../models/user.model.js"
import {uploadFile} from "../util/cloudinary.js"
import redis from "redis";
import crypto from "crypto";
import nodemailer from "nodemailer"
import { fileURLToPath } from "url"; // Import to define __dirname
// Define __dirname manually in ES module
import { Resend } from 'resend'; 
const resend = new Resend(process.env.RESEND_API_KEY); 
console.log("SMTP_USERNAME:", process.env.SMTP_USERNAME);
console.log(
  "SMTP_PASSWORD:",
  process.env.SMTP_PASSWORD ? "FOUND" : "MISSING"
);

const client = redis.createClient({
  url: process.env.REDIS_URL , // Adjust the URL based on your Redis setup
});

client.on('error', (err) => console.log('Redis Client Error', err));
client.connect();


import path from "path" 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);// user registration controller
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

const user_login=asyncHandler(async(req,res)=>{
    try {
        const {email,password}=req.body;
        if([email,password].some(item=>item=="")){
            return res.status(400).json(new apiResponse(400,{},"please fill all the field"));
        }
        const user=await User.findOne({email});
        if(!user){
            return res.status(400).json(new apiResponse(400,{},"Invalid email"));
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





// email verification code ....

const generateOtp = asyncHandler(async (req, res) => {
  
  const { email } = req.body;
  if (!email) {
    throw new apiError('Please fill all the field', 400);
  }

  // Generate a more secure OTP
  const OTP = crypto.randomInt(1000, 9999);
  const expireTime = 1 * 60; // 1 minute expiration time (in seconds)

  const otpData = {
    otp: OTP.toString(),
    expiresAt: Date.now() + expireTime * 1000,
  };

  // Store OTP in Redis with email as the key and expiration time
  try {
    if (!client.isOpen) {
      await client.connect();
    }
    await client.set(email, JSON.stringify(otpData), { EX: expireTime });
  } catch (redisError) {
    console.error('Redis Error:', redisError);
    // If Redis fails, we might want to continue or fail. 
    // For now, let's throw an error to be safe.
    throw new apiError('Internal Server Error (Redis)', 500);
  }

  // Send OTP to email
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
    rejectUnauthorized: false,
  },
  });


const mailOptions = {
  from: process.env.SMTP_USERNAME,
  to: email,
  subject: 'Your OTP Code - Study Manager',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      
      <h2 style="text-align: center; color: #4f46e5;">Study Manager - OTP Verification</h2>

      <p style="color: #6b7280; font-size: 16px;">Dear User,</p>

      <p style="color: #6b7280; font-size: 16px;">
        Your One-Time Password (OTP) for verification is:
      </p>

      <div style="text-align: center; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; color: #4f46e5; border: 2px dashed #4f46e5; padding: 10px 20px; display: inline-block; border-radius: 4px;">
          ${OTP}
        </span>
      </div>

      <p style="color: #6b7280; font-size: 16px;">
        This OTP will expire in <strong style="color: #4f46e5;">1 minute</strong>. Please do not share it with anyone.
      </p>

      <p style="text-align: center; font-size: 14px; color: #6b7280; margin-top: 20px;">
        Thank you for using Study Manager!
      </p>
    </div>
  `,
};



  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json(new apiResponse(200, '', 'OTP sent successfully'));
  } catch (err) {
    console.log(err);
    res.status(500).json(new apiError('Error sending email', 500));
  }
});



const verify_otp = asyncHandler(async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      throw new apiError('Please fill all the fields', 400);
    }

    // Get OTP from Redis 
    if (!client.isOpen) {
      await client.connect();
    }
    const storedOtpData = await client.get(email);
    if (!storedOtpData) {
      return res.status(404).json(new apiResponse(404, '', 'OTP not found or expired'));
    }

    const { otp: storedOtp, expiresAt } = JSON.parse(storedOtpData);

    // Check if OTP is expired (extra validation)
    if (Date.now() > expiresAt) {
      await client.del(email); // Clean up expired OTP
      throw new apiError('OTP has expired', 400);
    }

    if (storedOtp !== otp) {
      return res.status(400).json(new apiResponse(400, '', 'OTP is Invalid'));
    }

    // OTP is correct, clear OTP from Redis
    await client.del(email);

    res.status(200).json(new apiResponse(200, '', 'Email verified successfully'));
  } catch (error) {
    console.log(error);
    res.status(500).json(new apiError('Internal Server Error', 500));
  }
});


const changePassword = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if ([email, password].some(item => !item || item === "")) {
      return res
        .status(400)
        .json(new apiResponse(400, "", "Missing required fields"));
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json(new apiResponse(404, "", "User not found"));
    }

    // Set new password (bcrypt handled in pre-save)
    user.password = password;

    await user.save(); // 🔐 bcrypt runs here automatically

    return res
      .status(200)
      .json(new apiResponse(200, "", "Password changed successfully"));

  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new apiResponse(500, "", "Internal server error"));
  }
});



export {
    userRegistration,
    user_login,
    user_logout,
   getUserInfo,
   generateOtp,
   verify_otp,
   changePassword
}