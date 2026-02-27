 import mongoose from "mongoose"

 const aiRoadMapSchema=new mongoose.Schema({
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
          index:true
        },
        subject:{
            type:String,
            required: true,
        },
        roadmap:{
           type : String ,
             required: true,
        }
 },
    {timestamps:true}
 )

 const aiRoadMap =mongoose.model("aiRoadMap",aiRoadMapSchema);

 export default aiRoadMap;