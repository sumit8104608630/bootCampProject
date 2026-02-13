import { create } from "zustand";
import axios from "../../utils/axios";
const API_URL = import.meta.env.VITE_DATA_BASE_LINK; // Your backend URL

export const authStore = create((set, get) => ({
  loginError: null,
  authUser: null,
  isSigningUp: false,
  isLoginIng: false,
  isCheckingAuth: true,

  // Check if user is authenticated
  checkAuth: async () => {
    try {
      const response = await axios.get("/user/userInfo", { withCredentials: true });
      set({ authUser: response.data.data.user });
    } catch (error) {
      console.log(error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // User login (email + password)
  login: async (formData) => {
    try {
      set({ isLoginIng: true, loginError: null });
      const response = await axios.post("/user/login", formData, { withCredentials: true });

      if (response.data.statusCode === 200) {
        set({ authUser: response.data.data });
      } else {
        set({ loginError: response.data.message });
      }
    } catch (error) {
      set({ loginError: error?.response?.data?.message || "Login failed" });
    } finally {
      set({ isLoginIng: false });
    }
  },

  // User logout
  logout: async (navigate) => {
    try {
      const response = await axios.get("/user/logout", { withCredentials: true });
      if (response.data.statusCode === 200) {
        set({ authUser: null });
        navigate("/login");
      }
    } catch (error) {
      console.log("Logout error:", error);
    }
  },

  // User registration (name, email, password, profilePhoto)
  signUp: async (formData, navigate) => {
    try {
      const uploadData = new FormData();
      uploadData.append("name", formData.name);
      uploadData.append("email", formData.email);
      uploadData.append("password", formData.password);
      if (formData.profilePhoto) {
        uploadData.append("profilePhoto", formData.profilePhoto);
      }

      set({ isSigningUp: true });
      const response = await axios.post("/user/register", uploadData, { withCredentials: true });

      if (response.data.statusCode === 201) {
        set({ isSigningUp: false });
        navigate("/login");
      }
    } catch (error) {
      set({ isSigningUp: false });
      console.log("Sign up error:", error);
    }
  },

deleteActiveUser: async(userIdObj) => {
  if (!userIdObj || !userIdObj.authUserId || !userIdObj.selectedId) {
    console.error('Invalid user object for deletion', userIdObj);
   return
  }
  const {socket} = get();
  socket.emit('delete_active_user', userIdObj);
},

delete_authUserMatchId:async(userId)=>{
      const {socket}=get();
      socket.emit('delete_authUserMatchId',userId);
    },




}));
