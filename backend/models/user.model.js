import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { setUser, fun_refreshToken } from "../services/authenticate.service.js";

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    salt: { type: String },
    avatar: { type: String },
    profilePhoto: { type: String, default: "https://res.cloudinary.com/dcsmp3yjk/image/upload/v1747290044/8742495_fqugdm.png" },
    refreshToken: { type: String },
    subjects: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Subject" }
    ]
}, { timestamps: true });

// Hash password before saving
UserSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    const salt = await bcrypt.genSalt(10);
    this.salt = salt;
    this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.static("matchPasswordGenerateToken",async function(email,password){
try {
    const user=await this.findOne({email:email})
    if(!user){
        throw new Error("User not found");
    }
    const salt=user.salt;
    const hashedPassword=await bcrypt.hash(password,salt);
    if(hashedPassword!==user.password){
        return ({ success: true, message: "Invalid password" });
    }
    const token=await setUser(user);
    const refresh_token=await fun_refreshToken(user);
    return {token,refresh_token};
} catch (error) {
    console.log(error)
    throw new Error(error.message);
}
})

const User = mongoose.model("User", UserSchema);
export default User;
