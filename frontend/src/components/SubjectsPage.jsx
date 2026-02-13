import { Plus, X, Edit2, Trash2, Paperclip, File, Image, FileText, Download, Upload, Loader2, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { subjectStore } from '../store/subjectAuth.store';

// Utility function to get completion status
const getCompletionStatus = (percentage) => {
  if (percentage === 0) {
    return {
      color: '#EF4444',
      bgColor: '#FEE2E2',
      textColor: '#991B1B',
      borderColor: '#FCA5A5',
      label: 'Not Started',
      showCheckIcon: false
    };
  } else if (percentage < 25) {
    return {
      color: '#F97316',
      bgColor: '#FFEDD5',
      textColor: '#9A3412',
      borderColor: '#FDBA74',
      label: 'Just Started',
      showCheckIcon: false
    };
  } else if (percentage < 50) {
    return {
      color: '#F59E0B',
      bgColor: '#FEF3C7',
      textColor: '#92400E',
      borderColor: '#FCD34D',
      label: 'In Progress',
      showCheckIcon: false
    };
  } else if (percentage < 100) {
    return {
      color: '#22C55E',
      bgColor: '#DCFCE7',
      textColor: '#14532D',
      borderColor: '#86EFAC',
      label: 'Good Progress',
      showCheckIcon: false
    };
  } else {
    return {
      color: '#10B981',
      bgColor: '#D1FAE5',
      textColor: '#065F46',
      borderColor: '#6EE7B7',
      label: 'Completed',
      showCheckIcon: true
    };
  }
};

// Calculate weekly hours from daily hours
const calculateWeeklyHours = (hoursPerDay) => {
  return (hoursPerDay * 7).toFixed(1);
};

export default function SubjectsPage() {
  const { addingSubject, allSubjects, fetchingSubjects, getAllSubjects, addingLoad } = subjectStore();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showAttachments, setShowAttachments] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    subjectName: '',
    hoursPerDay: '',
    hoursPerWeek: '',
    completionDate: '',
    color: '#6366f1',
    attachments: []
  });

  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
    '#3b82f6', '#ef4444', '#14b8a6', '#f97316', '#a855f7'
  ];

  // Load subjects from API on mount
  useEffect(() => {
    getAllSubjects();
  }, []);

  // Auto-calculate weekly hours when daily hours change
  useEffect(() => {
    if (formData.hoursPerDay) {
      const weeklyHours = calculateWeeklyHours(formData.hoursPerDay);
      setFormData(prev => ({
        ...prev,
        hoursPerWeek: weeklyHours
      }));
    }
  }, [formData.hoursPerDay]);

  // Close form with Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showAttachments) {
          setShowAttachments(null);
        } else if (showAddForm) {
          handleCancel();
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showAttachments, showAddForm]);

  // Prevent body scroll when attachments modal is open
  useEffect(() => {
    if (showAttachments) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAttachments]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);

    try {
      const newAttachments = await Promise.all(
        files.map(file => {
          return new Promise((resolve, reject) => {
            if (file.size > 5 * 1024 * 1024) {
              alert(`${file.name} is too large. Maximum size is 5MB.`);
              reject(new Error('File too large'));
              return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
              resolve({
                id: Date.now() + Math.random(),
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                fileData: event.target.result,
                uploadedAt: new Date().toISOString()
              });
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
          });
        })
      );

      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...newAttachments]
      }));
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeAttachment = (attachmentId) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(att => att.id !== attachmentId)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.subjectName || !formData.hoursPerDay || !formData.completionDate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Call the API
      await addingSubject(formData);
      
      // Refresh subjects list after successful addition
      await getAllSubjects();
      
      // Reset form
      setFormData({
        subjectName: '',
        hoursPerDay: '',
        hoursPerWeek: '',
        completionDate: '',
        color: '#6366f1',
        attachments: []
      });
      setShowAddForm(false);
      setEditingId(null);
    } catch (error) {
      console.error('Error submitting subject:', error);
      alert('Failed to add subject. Please try again.');
    }
  };

  const handleCancel = () => {
    setFormData({
      subjectName: '',
      hoursPerDay: '',
      hoursPerWeek: '',
      completionDate: '',
      color: '#6366f1',
      attachments: []
    });
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleEdit = (subject) => {
    setFormData({
      subjectName: subject.subjectName,
      hoursPerDay: subject.hoursPerDay || '',
      hoursPerWeek: subject.hoursPerWeek || '',
      completionDate: subject.completionDate,
      color: subject.color,
      attachments: subject.attachments || []
    });
    setEditingId(subject._id || subject.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this subject?')) {
      // TODO: Call delete API
      // await deleteSubject(id);
      // await getAllSubjects();
      console.log('Delete subject:', id);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (fileType === 'application/pdf') return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const downloadFile = (attachment) => {
    if (attachment.fileURL) {
      // If it's a Cloudinary URL, open it
      window.open(attachment.fileURL, '_blank');
    } else if (attachment.fileData) {
      // If it's base64 data, download it
      const link = document.createElement('a');
      link.href = attachment.fileData;
      link.download = attachment.fileName;
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Subjects</h1>
            <p className="text-sm sm:text-base text-gray-500">Manage your study subjects and time allocations</p>
          </div>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full sm:w-auto bg-indigo-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Subject
            </button>
          )}
        </div>

        {/* Loading State */}
        {fetchingSubjects && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="ml-3 text-gray-600">Loading subjects...</span>
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-6">
            {/* Header with Close Button */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Subject' : 'Add New Subject'}
              </h2>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close form"
                disabled={addingLoad}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
                {/* Subject Name */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2 sm:mb-3 text-sm sm:text-base">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    value={formData.subjectName}
                    onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                    placeholder="e.g., Mathematics"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
                    disabled={addingLoad}
                  />
                </div>

                {/* Completion Date - MOVED TO SECOND POSITION */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2 sm:mb-3 text-sm sm:text-base">
                    Target Completion Date
                  </label>
                  <input
                    type="date"
                    value={formData.completionDate}
                    onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
                    required
                    disabled={addingLoad}
                  />
                </div>

                {/* Hours per Day - NOW THIRD, PRIMARY INPUT */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2 sm:mb-3 text-sm sm:text-base">
                    Hours per Day
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.hoursPerDay}
                    onChange={(e) => setFormData({ ...formData, hoursPerDay: e.target.value })}
                    placeholder="1.5"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
                    min="0.5"
                    disabled={addingLoad}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How many hours you'll study this subject daily
                  </p>
                </div>

                {/* Hours per Week - NOW AUTO-CALCULATED AND READ-ONLY */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2 sm:mb-3 text-sm sm:text-base">
                    Hours per Week
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.hoursPerWeek || (formData.hoursPerDay ? calculateWeeklyHours(formData.hoursPerDay) : '')}
                      placeholder="Auto-calculated"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-700 text-sm sm:text-base cursor-not-allowed"
                      disabled
                      readOnly
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.hoursPerDay 
                      ? `Automatically calculated: ${formData.hoursPerDay}h/day × 7 days`
                      : 'Will be calculated based on daily hours'
                    }
                  </p>
                </div>

                {/* Color */}
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-medium mb-2 sm:mb-3 text-sm sm:text-base">
                    Color
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl transition-all ${
                          formData.color === color
                            ? 'ring-4 ring-gray-900 ring-offset-2 scale-110'
                            : 'hover:scale-105'
                        } ${addingLoad ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={{ backgroundColor: color }}
                        disabled={addingLoad}
                      />
                    ))}
                  </div>
                </div>

                {/* Study Materials */}
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-medium mb-2 sm:mb-3 text-sm sm:text-base">
                    Study Materials ({formData.attachments.length} file{formData.attachments.length !== 1 ? 's' : ''})
                  </label>
                  <div className="space-y-3">
                    <label className={`flex items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-xl transition-colors ${
                      uploading || addingLoad
                        ? 'border-indigo-400 bg-indigo-50 cursor-not-allowed' 
                        : 'border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer'
                    }`}>
                      <div className="text-center">
                        {uploading ? (
                          <>
                            <Upload className="w-8 h-8 mx-auto text-indigo-500 mb-2 animate-pulse" />
                            <span className="text-sm text-indigo-600 font-medium">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Paperclip className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                            <span className="text-sm text-gray-600 font-medium">Click to upload study materials</span>
                            <span className="text-xs text-gray-400 block mt-1">PDF, PNG, JPG, JPEG (max 5MB each)</span>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        multiple
                        accept="application/pdf,image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploading || addingLoad}
                      />
                    </label>

                    {/* Attached Files List */}
                    {formData.attachments.length > 0 && (
                      <div className="space-y-2 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500 font-medium px-2 py-1">
                          {formData.attachments.length} file{formData.attachments.length !== 1 ? 's' : ''} attached
                        </p>
                        {formData.attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-200 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="text-gray-600">
                                {getFileIcon(attachment.fileType)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {attachment.fileName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(attachment.fileSize)}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => removeAttachment(attachment.id)}
                              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors ml-2"
                              title="Remove file"
                              disabled={addingLoad}
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={handleSubmit}
                  disabled={uploading || addingLoad}
                  className="flex-1 bg-indigo-600 text-white py-2.5 sm:py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base flex items-center justify-center gap-2"
                >
                  {addingLoad ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {editingId ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    editingId ? 'Update Subject' : 'Add Subject'
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={addingLoad}
                  className="sm:px-8 py-2.5 sm:py-3 text-gray-700 font-semibold hover:bg-gray-100 rounded-xl transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Attachments Viewer Modal */}
        {showAttachments && (
          <>
            <div 
              className="fixed inset-0 bg-gray-100 bg-opacity-50 z-40"
              onClick={() => setShowAttachments(null)}
            />
            
            <div 
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-3xl z-50 max-h-[85vh] overflow-y-auto bg-white rounded-2xl border border-gray-200 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Study Materials - {showAttachments.subjectName}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {showAttachments.attachments?.length || 0} file{showAttachments.attachments?.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => setShowAttachments(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {showAttachments.attachments && showAttachments.attachments.length > 0 ? (
                <div className="space-y-3">
                  {showAttachments.attachments.map((attachment, index) => (
                    <div
                      key={attachment._id || attachment.id || index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="text-gray-600">
                          {getFileIcon(attachment.fileType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {attachment.fileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(attachment.fileSize)}
                            {attachment.uploadedAt && ` • ${new Date(attachment.uploadedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadFile(attachment)}
                        className="p-2 hover:bg-indigo-100 rounded-lg transition-colors ml-2 opacity-0 group-hover:opacity-100"
                        title="Download"
                      >
                        <Download className="w-4 h-4 text-indigo-600" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Paperclip className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No study materials attached</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Subjects List or Empty State */}
        {!fetchingSubjects && allSubjects.length === 0 && !showAddForm && (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-8 sm:p-16 text-center">
            <p className="text-gray-500 text-base sm:text-lg">
              No subjects added yet. Click the button above to add your first subject.
            </p>
          </div>
        )}

        {/* Subjects Grid */}
        {!fetchingSubjects && allSubjects.length > 0 && !showAddForm && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {allSubjects.map((subject) => {
              const status = getCompletionStatus(subject.completionPercentage || 0);
              const dailyHours = subject.hoursPerDay || (subject.hoursPerWeek / 7).toFixed(1);
              
              return (
                <div
                  key={subject._id || subject.id}
                  className="bg-white rounded-2xl border-2 overflow-hidden hover:shadow-lg transition-all"
                  style={{ borderColor: status.borderColor }}
                >
                  {/* Color bar at top */}
                  <div 
                    className="h-2"
                    style={{ backgroundColor: subject.color }}
                  />
                  
                  <div className="p-5 sm:p-6">
                    {/* Header with edit/delete buttons */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">{subject.subjectName}</h3>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(subject)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          aria-label="Edit subject"
                        >
                          <Edit2 className="w-4 h-4 text-gray-500 hover:text-indigo-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(subject._id || subject.id)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          aria-label="Delete subject"
                        >
                          <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Completion Status Badge */}
                    <div 
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3"
                      style={{ 
                        backgroundColor: status.bgColor,
                        color: status.textColor
                      }}
                    >
                      {status.showCheckIcon && (
                        <Check className="w-4 h-4" />
                      )}
                      <span className="text-sm font-semibold">
                        {subject.completionPercentage || 0}%
                      </span>
                      <span className="text-xs">
                        • {status.label}
                      </span>
                    </div>
                    
                    {/* Subject details */}
                    <div className="space-y-1.5 text-sm text-gray-600 mb-4">
                      <p className="font-medium">Daily: {dailyHours}h</p>
                      <p>
                        Weekly: {subject.hoursPerWeek}h
                        {!subject.hoursPerDay && (
                          <span className="text-xs text-gray-500 ml-1">(auto)</span>
                        )}
                      </p>
                      <p>Studied: {subject.totalHoursStudied || 0}h</p>
                      {subject.completionDate && (
                        <div 
                          className="mt-3 p-2 rounded-lg border"
                          style={{ 
                            backgroundColor: status.bgColor,
                            borderColor: status.borderColor,
                            color: status.textColor
                          }}
                        >
                          <p className="text-xs font-semibold">
                            📅 Target: {new Date(subject.completionDate).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Attachments Button */}
                    {subject.attachments && subject.attachments.length > 0 && (
                      <button
                        onClick={() => setShowAttachments(subject)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors text-sm font-medium"
                      >
                        <Paperclip className="w-4 h-4" />
                        {subject.attachments.length} Study Material{subject.attachments.length !== 1 ? 's' : ''}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}