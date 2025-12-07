import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
const API_URL = import.meta.env.VITE_DATA_BASE_LINK; // Your backend URL

export const subjectStore = create((set, get) => ({
  addingLoad: false,
  fetchingSubjects:false,
  dash_board_data:null,
  dashLoading:false,
  allSubjects:[],
  addingSubject:async(formData)=>{
        set({addingLoad:false})
    try {
            
            const data=await axiosInstance.post("/subject/add_subject", formData,{ withCredentials: true });
           return (data.data);
    } catch (error) {
        console.log(error)
    }
    finally{
                    set({addingLoad:false})

    }
  },

  getAllSubjects:async()=>{
        set({fetchingSubjects:true})
    try {
                  const data=await axiosInstance.get("/subject/get_subjects",{ withCredentials: true });

        set({allSubjects:data.data.data.subjects})
      console.log(data.data)
    } catch (error) {
      console.log(error)
    }
    finally{
              set({fetchingSubjects:false})

    }

  },

  get_dash_board_data:async()=>{
    set({dashLoading:true})
    try {
        const data=await axiosInstance.get("/subject/dash_board_data",{withCredentials:true})
        set({dash_board_data:data.data.data.dashboardData[0]})
    } catch (error) {
      console.log(error)
    }
  
  finally{
        set({dashLoading:false})
  }
  }


}));
