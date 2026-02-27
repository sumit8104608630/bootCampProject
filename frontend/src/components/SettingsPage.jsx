import { useState, useRef } from 'react';
import { User, Camera, Trash2, Save, AlertTriangle, Check, Loader2, Eye, EyeOff, Shield, Database, LogOut } from 'lucide-react';
import { authStore } from '../store/userAuth.store';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';

export default function SettingsPage() {
  const { authUser, logout, deleteActiveUser, setAuthUser } = authStore();
  const navigate = useNavigate();

  // ── Profile Edit State ──
  const [name, setName] = useState(authUser?.name || '');
  const [profileImageError, setProfileImageError] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const fileInputRef = useRef();

  // ── Password State ──
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // ── Danger Zone State ──
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clearingData, setClearingData] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [dangerConfirmText, setDangerConfirmText] = useState('');

  // ── Handle photo select ──
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  // ── Save Profile ──
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileSuccess(false);
    try {
      const formData = new FormData();
      formData.append('name', name);
      if (photoFile) formData.append('profilePhoto', photoFile);

      const res = await axios.put('/user/update_profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.data) setAuthUser?.(res.data.data);
      setProfileSuccess(true);
      setPhotoFile(null);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Change Password ──
  const handleChangePassword = async () => {
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    setSavingPassword(true);
    try {
      await axios.put('/user/change_password', { currentPassword, newPassword });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(err?.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  // ── Clear All Data ──
  const handleClearData = async () => {
    if (dangerConfirmText !== 'CLEAR') return;
    setClearingData(true);
    try {
      await axios.delete('/user/clear_all_data');
      setShowClearConfirm(false);
      setDangerConfirmText('');
      alert('All study data cleared successfully');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to clear data');
    } finally {
      setClearingData(false);
    }
  };

  // ── Delete Account ──
  const handleDeleteAccount = async () => {
    if (dangerConfirmText !== 'DELETE') return;
    setDeletingAccount(true);
    try {
      await axios.delete('/user/delete_account');
      deleteActiveUser?.(authUser?._id);
      logout?.(navigate);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete account');
      setDeletingAccount(false);
    }
  };

  const currentPhoto = previewPhoto || (!profileImageError && authUser?.profilePhoto) || null;
  const initials = authUser?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Manage your account and preferences</p>
        </div>

        {/* ── Profile Card ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-white" />
              <h2 className="text-white font-bold text-lg">Profile Information</h2>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0">
                {currentPhoto ? (
                  <img
                    src={currentPhoto}
                    alt="Profile"
                    onError={() => setProfileImageError(true)}
                    className="w-20 h-20 rounded-2xl object-cover ring-4 ring-indigo-100"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center ring-4 ring-indigo-100">
                    <span className="text-white font-bold text-2xl">{initials}</span>
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center justify-center shadow-md transition-colors"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{authUser?.name || 'User'}</p>
                <p className="text-sm text-gray-500">{authUser?.email}</p>
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-1"
                >
                  Change photo
                </button>
              </div>
            </div>

            {/* Name field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={authUser?.email || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            {/* Save Profile Button */}
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile || profileSuccess}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              {savingProfile ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : profileSuccess ? (
                <><Check className="w-4 h-4" /> Saved!</>
              ) : (
                <><Save className="w-4 h-4" /> Save Profile</>
              )}
            </button>
          </div>
        </div>

        {/* ── Change Password Card ── */}

        {/* ── Danger Zone Card ── */}
        <div className="bg-white rounded-2xl border-2 border-red-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-white" />
              <h2 className="text-white font-bold text-lg">Danger Zone</h2>
            </div>
          </div>

          <div className="p-6 space-y-4">

            {/* Clear All Data */}
            <div className="border border-red-100 rounded-xl p-4 bg-red-50">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Database className="w-4 h-4 text-red-600" />
                    <h4 className="font-semibold text-gray-900 text-sm">Clear All Study Data</h4>
                  </div>
                  <p className="text-xs text-gray-500">Remove all subjects, daily plans, roadmaps, and weekly data. Your account remains active.</p>
                </div>
                <button
                  onClick={() => { setShowClearConfirm(!showClearConfirm); setShowDeleteConfirm(false); setDangerConfirmText(''); }}
                  className="flex-shrink-0 px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors"
                >
                  Clear Data
                </button>
              </div>

              {showClearConfirm && (
                <div className="mt-4 pt-4 border-t border-red-200 space-y-3">
                  <p className="text-xs text-red-700 font-medium">
                    Type <span className="font-bold bg-red-100 px-1 rounded">CLEAR</span> to confirm
                  </p>
                  <input
                    type="text"
                    value={dangerConfirmText}
                    onChange={(e) => setDangerConfirmText(e.target.value)}
                    placeholder="Type CLEAR"
                    className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleClearData}
                      disabled={dangerConfirmText !== 'CLEAR' || clearingData}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg text-xs font-semibold transition-colors"
                    >
                      {clearingData ? <><Loader2 className="w-3 h-3 animate-spin" /> Clearing...</> : 'Yes, Clear Everything'}
                    </button>
                    <button
                      onClick={() => { setShowClearConfirm(false); setDangerConfirmText(''); }}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Delete Account */}
            <div className="border border-red-200 rounded-xl p-4 bg-red-50">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <h4 className="font-semibold text-gray-900 text-sm">Delete Account</h4>
                  </div>
                  <p className="text-xs text-gray-500">Permanently delete your account and all associated data. This action cannot be undone.</p>
                </div>
                <button
                  onClick={() => { setShowDeleteConfirm(!showDeleteConfirm); setShowClearConfirm(false); setDangerConfirmText(''); }}
                  className="flex-shrink-0 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>

              {showDeleteConfirm && (
                <div className="mt-4 pt-4 border-t border-red-200 space-y-3">
                  <p className="text-xs text-red-700 font-medium">
                    Type <span className="font-bold bg-red-100 px-1 rounded">DELETE</span> to permanently delete your account
                  </p>
                  <input
                    type="text"
                    value={dangerConfirmText}
                    onChange={(e) => setDangerConfirmText(e.target.value)}
                    placeholder="Type DELETE"
                    className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={dangerConfirmText !== 'DELETE' || deletingAccount}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-red-700 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg text-xs font-semibold transition-colors"
                    >
                      {deletingAccount ? <><Loader2 className="w-3 h-3 animate-spin" /> Deleting...</> : 'Yes, Delete My Account'}
                    </button>
                    <button
                      onClick={() => { setShowDeleteConfirm(false); setDangerConfirmText(''); }}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}