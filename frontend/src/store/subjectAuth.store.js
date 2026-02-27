import { create } from "zustand";
import axios from "../../utils/axios";

export const subjectStore = create((set, get) => ({
  addingLoad: false,
  fetchingSubjects: false,
  deletingId: null,       // tracks which subject is being deleted
  dash_board_data: null,
  dashLoading: false,
  allSubjects: [],

  addingSubject: async (formData) => {
    set({ addingLoad: true }); // ✅ true — not false
    try {
      const data = await axios.post("/subject/add_subject", formData, {
        withCredentials: true,
      });
      return data.data;
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      set({ addingLoad: false });
    }
  },

  deleteSubject: async (subjectId) => {
    set({ deletingId: subjectId });
    try {
      await axios.delete(`/subject/delete_subject/${subjectId}`, {
        withCredentials: true,
      });
      // Optimistically remove from local state immediately
      set((state) => ({
        allSubjects: state.allSubjects.filter(
          (s) => (s._id || s.id) !== subjectId
        ),
      }));
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      set({ deletingId: null });
    }
  },

  getAllSubjects: async () => {
    set({ fetchingSubjects: true });
    try {
      const data = await axios.get("/subject/get_subjects", {
        withCredentials: true,
      });
      set({ allSubjects: data.data.data.subjects });
    } catch (error) {
      console.log(error);
    } finally {
      set({ fetchingSubjects: false });
    }
  },

  get_dash_board_data: async () => {
    set({ dashLoading: true });
    try {
      const data = await axios.get("/subject/dash_board_data", {
        withCredentials: true,
      });
      set({ dash_board_data: data.data.data.dashboardData[0] });
    } catch (error) {
      console.log(error);
    } finally {
      set({ dashLoading: false });
    }
  },
}));