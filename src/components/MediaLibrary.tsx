import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  FileUp,
  FileVideo,
  Film,
  HardDrive,
  Laptop,
  MonitorPlay,
  Play,
  Plus,
  Presentation,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Video,
  X,
} from 'lucide-react';
import { AuthUser, MediaCategory, MediaItem } from '../types';
import {
  deleteMediaFileLocally,
  detectFileDetails,
  downloadMediaFileToDevice,
  formatBytes,
  getLocalDeviceStorageStats,
  getMediaFileLocally,
  saveMediaFileLocally,
} from '../services/mediaStorage';

interface MediaLibraryProps {
  mediaItems: MediaItem[];
  currentUser: AuthUser;
  onSaveMediaItems: (items: MediaItem[]) => void;
}

const CATEGORY_TABS: Array<{
  id: MediaCategory | 'all' | 'device';
  label: string;
  icon: React.ReactNode;
}> = [
  { id: 'all', label: 'جميع الوسائط والعروض', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'device', label: 'محفوظ من الجهاز 💻', icon: <Laptop className="w-4 h-4" /> },
  { id: 'presentation', label: 'العروض التقديمية (PowerPoint / Canva)', icon: <Presentation className="w-4 h-4" /> },
  { id: 'video', label: 'فيديوهات المهارات الرياضية', icon: <Film className="w-4 h-4" /> },
  { id: 'lesson_plan', label: 'خطط ونماذج الحصص', icon: <FileText className="w-4 h-4" /> },
  { id: 'rules', label: 'قوانين وتحكيم الألعاب', icon: <MonitorPlay className="w-4 h-4" /> },
];

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  mediaItems,
  currentUser,
  onSaveMediaItems,
}) => {
  const canEdit = currentUser.permissions.includes('edit');
  const canDelete = currentUser.permissions.includes('delete');

  const [activeCategory, setActiveCategory] = useState<MediaCategory | 'all' | 'device'>('all');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'device' | 'url'>('device');

  // Preview Modal
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Download & Notification States
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [toastNotification, setToastNotification] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Device Storage Stats
  const [deviceStats, setDeviceStats] = useState<{
    count: number;
    totalSizeBytes: number;
    formattedSize: string;
  }>({ count: 0, totalSizeBytes: 0, formattedSize: '0 بايت' });

  // Form State for Adding Item
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MediaCategory>('presentation');
  const [gradeRange, setGradeRange] = useState('الصفوف 5–9');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refresh device stats on mount or when media items change
  const refreshStats = async () => {
    const stats = await getLocalDeviceStorageStats();
    setDeviceStats(stats);
  };

  useEffect(() => {
    refreshStats();
  }, [mediaItems]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastNotification({ text, type });
    setTimeout(() => {
      setToastNotification(null);
    }, 4500);
  };

  // Helper to clean file name into a polite title
  const cleanFileNameToTitle = (filename: string): string => {
    const withoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
    return withoutExt
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handleFilePicked = (file: File) => {
    setSelectedFile(file);
    const { fileType, suggestedCategory } = detectFileDetails(file);
    setCategory(suggestedCategory);

    // If title is empty or default, suggest one from file name
    if (!title || title.trim() === '') {
      setTitle(cleanFileNameToTitle(file.name));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilePicked(e.dataTransfer.files[0]);
    }
  };

  const detectFileType = (inputUrl: string): MediaItem['fileType'] => {
    const low = inputUrl.toLowerCase();
    if (low.includes('youtube.com') || low.includes('youtu.be')) return 'youtube';
    if (low.includes('drive.google.com')) return 'drive';
    if (low.includes('canva.com')) return 'canva';
    if (low.includes('docs.google.com/presentation') || low.includes('slides')) return 'slides';
    if (low.endsWith('.pptx') || low.endsWith('.ppt')) return 'powerpoint';
    if (low.endsWith('.pdf')) return 'pdf';
    if (low.endsWith('.mp4') || low.endsWith('.webm') || low.endsWith('.mov')) return 'video';
    if (low.endsWith('.docx') || low.endsWith('.doc')) return 'document';
    return 'link';
  };

  const getYouTubeEmbedUrl = (rawUrl: string): string | null => {
    try {
      if (rawUrl.includes('youtu.be/')) {
        const id = rawUrl.split('youtu.be/')[1]?.split('?')[0];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (rawUrl.includes('youtube.com/watch')) {
        const urlObj = new URL(rawUrl);
        const id = urlObj.searchParams.get('v');
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (rawUrl.includes('youtube.com/embed/')) {
        return rawUrl;
      }
    } catch {
      // ignore
    }
    return null;
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    if (addMode === 'device' && !selectedFile) {
      showToast('يُرجى اختيار ملف العرض أو الفيديو من جهازكِ أولاً.', 'error');
      return;
    }

    if (addMode === 'url' && !url.trim()) {
      showToast('يُرجى إدخال رابط العرض أو الفيديو.', 'error');
      return;
    }

    if (!title.trim()) {
      showToast('يُرجى إدخال عنوان للمورد الرياضي.', 'error');
      return;
    }

    setIsSubmitting(true);
    const itemId = `media-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];

    try {
      if (addMode === 'device' && selectedFile) {
        const { fileType } = detectFileDetails(selectedFile);
        const formattedSize = formatBytes(selectedFile.size);

        // Save binary file into IndexedDB
        await saveMediaFileLocally(
          itemId,
          selectedFile,
          selectedFile.name,
          selectedFile.type
        );

        const newItem: MediaItem = {
          id: itemId,
          title: title.trim(),
          category,
          gradeRange,
          url: '', // local device storage item
          description: description.trim(),
          fileType,
          createdAt: today,
          addedBy: currentUser.name,
          sourceType: 'device',
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileSizeFormatted: formattedSize,
          mimeType: selectedFile.type,
          deviceStorageKey: itemId,
        };

        onSaveMediaItems([newItem, ...mediaItems]);
        showToast(`تم حفظ الملف (${selectedFile.name}) بنجاح من جهازكِ وإضافته للمكتبة ✓`);
      } else {
        // Online URL Mode
        const newItem: MediaItem = {
          id: itemId,
          title: title.trim(),
          category,
          gradeRange,
          url: url.trim(),
          description: description.trim(),
          fileType: detectFileType(url.trim()),
          createdAt: today,
          addedBy: currentUser.name,
          sourceType: 'url',
        };

        onSaveMediaItems([newItem, ...mediaItems]);
        showToast('تمت إضافة الرابط الإلكتروني إلى المكتبة الرقمية بنجاح ✓');
      }

      // Reset modal form
      setTitle('');
      setUrl('');
      setDescription('');
      setSelectedFile(null);
      setShowAddModal(false);
      await refreshStats();
    } catch (err) {
      console.error('Error saving item:', err);
      showToast('حدث خطأ أثناء حفظ الملف، يرجى المحاولة مرة أخرى.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!canDelete) return;
    const item = mediaItems.find((i) => i.id === id);
    if (!item) return;

    // Remove from IndexedDB if stored locally
    if (item.sourceType === 'device' || item.deviceStorageKey) {
      await deleteMediaFileLocally(id);
    }
    onSaveMediaItems(mediaItems.filter((i) => i.id !== id));
    if (previewItem?.id === id) {
      handleClosePreview();
    }
    await refreshStats();
    showToast(`تم حذف المورد "${item.title}" بنجاح ✓`);
  };

  // Open Preview Modal
  const handleOpenPreview = async (item: MediaItem) => {
    setPreviewItem(item);
    setIsLoadingPreview(true);
    setPreviewBlobUrl(null);

    try {
      if (item.sourceType === 'device' || item.deviceStorageKey) {
        const record = await getMediaFileLocally(item.id);
        if (record && record.blob) {
          const blobUrl = URL.createObjectURL(record.blob);
          setPreviewBlobUrl(blobUrl);
        }
      }
    } catch (err) {
      console.warn('Could not load local blob preview:', err);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleClosePreview = () => {
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
    }
    setPreviewBlobUrl(null);
    setPreviewItem(null);
  };

  // Download item to device
  const handleDownloadToDevice = async (item: MediaItem) => {
    setDownloadingId(item.id);
    try {
      // If preview blob is already open for this item, pass it
      const currentBlob =
        previewItem?.id === item.id && previewBlobUrl ? null : undefined;
      const res = await downloadMediaFileToDevice(item, currentBlob);
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      console.error('Download error:', err);
      showToast('تعذر تنزيل الملف إلى جهازكِ.', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  // Export full media catalogue to JSON file on device
  const handleExportCatalogue = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(mediaItems, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute(
      'download',
      `سجل_الوسائط_والعروض_مدرسة_عائشة_${new Date().toISOString().split('T')[0]}.json`
    );
    dlAnchorElem.click();
    showToast('تم تصدير وحفظ سجل الوسائط على جهازكِ بنجاح ✓');
  };

  // Filter items
  const filteredItems = mediaItems.filter((item) => {
    if (activeCategory === 'device') {
      if (item.sourceType !== 'device') return false;
    } else if (activeCategory !== 'all' && item.category !== activeCategory) {
      return false;
    }

    if (selectedGradeFilter !== 'all' && item.gradeRange !== selectedGradeFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.fileName && item.fileName.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastNotification && (
        <div
          className={`fixed bottom-6 left-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-xs font-black transition-all animate-in fade-in duration-300 border ${
            toastNotification.type === 'success'
              ? 'bg-[#1C3A27] text-[#A7F3D0] border-[#059669]'
              : 'bg-[#4A1B1B] text-[#FECDD3] border-[#E11D48]'
          }`}
        >
          {toastNotification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[#FB7185]" />
          )}
          <span>{toastNotification.text}</span>
        </div>
      )}

      {/* Top Banner: Warm Espresso & Soft Beige */}
      <div className="bg-[#FAF5EC] rounded-2xl border border-[#DFCDB6] p-5 sm:p-6 shadow-[0_2px_8px_rgba(74,46,27,0.04)] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#DFCDB6] pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#4A2E1B] text-[#D4A76A] flex items-center justify-center shrink-0 border border-[#382012] shadow-xs">
              <Presentation className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-[#4A2E1B]">
                  المكتبة الرقمية: الفيديوهات والعروض التقديمية
                </h2>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] flex items-center gap-1">
                  <Laptop className="w-3 h-3" />
                  <span>خاصية الحفظ والرفع من الجهاز مفعّلة ✓</span>
                </span>
              </div>
              <p className="text-xs text-[#7D6752] mt-0.5">
                مستودع تفاعلي لحفظ وتشغيل وتنزيل عروض مادة الرياضة (PowerPoint، MP4، PDF، كانفا، ويوتيوب) لمدرسة عائشة بنت عثمان
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setAddMode('device');
                    setShowAddModal(true);
                  }}
                  className="px-4 py-2 bg-[#4A2E1B] hover:bg-[#382012] text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4 text-[#D4A76A]" />
                  <span>حفظ ملف من جهازي (فيديو / عرض)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAddMode('url');
                    setShowAddModal(true);
                  }}
                  className="px-3.5 py-2 bg-white hover:bg-[#FAF5EC] text-[#4A2E1B] border border-[#DFCDB6] text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#7C4E2E]" />
                  <span>إضافة رابط (كانفا / يوتيوب)</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleExportCatalogue}
              title="تنزيل نسخة احتياطية من سجل الوسائط على جهازكِ"
              className="px-3 py-2 bg-[#F5EFE6] hover:bg-[#EAE1D5] text-[#5A402D] border border-[#DFCDB6] text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5 text-[#7C4E2E]" />
              <span className="hidden sm:inline">تصدير إلى جهازي</span>
            </button>
          </div>
        </div>

        {/* Device Storage Status Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1.5 px-3 bg-[#F2EAE0] rounded-xl text-xs border border-[#E3D4C1]">
          <div className="flex items-center gap-2 text-[#5A402D]">
            <HardDrive className="w-4 h-4 text-[#7C4E2E]" />
            <span className="font-bold">التخزين المحلي على هذا الجهاز:</span>
            <span className="font-black text-[#4A2E1B] tabular-nums">
              {deviceStats.count} ملف مرفوع
            </span>
            <span className="text-[#8C7560]">({deviceStats.formattedSize})</span>
          </div>
          <div className="text-[11px] text-[#7D6752]">
            تُحفظ الفيديوهات والعروض في ذاكرة الجهاز وتعمل فورياً حتى بدون إنترنت
          </div>
        </div>

        {/* Filter Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {CATEGORY_TABS.map((tab) => {
            const count =
              tab.id === 'all'
                ? mediaItems.length
                : tab.id === 'device'
                ? mediaItems.filter((m) => m.sourceType === 'device').length
                : mediaItems.filter((m) => m.category === tab.id).length;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 border ${
                  activeCategory === tab.id
                    ? 'bg-[#4A2E1B] text-white border-[#4A2E1B] shadow-xs'
                    : 'bg-white text-[#5A402D] border-[#DFCDB6] hover:bg-[#FAF5EC]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full tabular-nums bg-black/10">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sub-Filters: Grade Range & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#DFCDB6]">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-[#5A402D]">تصفية حسب المرحلة:</span>
            <select
              value={selectedGradeFilter}
              onChange={(e) => setSelectedGradeFilter(e.target.value)}
              className="rounded-xl border border-[#DFCDB6] bg-white px-2.5 py-1 text-xs font-bold text-[#4A2E1B]"
            >
              <option value="all">جميع المراحل والصفوف</option>
              <option value="الصفوف 1–4">الحلقة الأولى (1–4)</option>
              <option value="الصفوف 5–9">الحلقة الثانية (5–9)</option>
              <option value="الصفوف 10–12">ما بعد الأساسي (10–12)</option>
              <option value="جميع الصفوف">شامل لجميع الصفوف</option>
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#8C7560] absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث باسم العرض، الفيديو أو الملف..."
              className="w-full rounded-xl border border-[#DFCDB6] bg-white pr-8.5 pl-3 py-1.5 text-xs text-[#2C1A11] focus:border-[#7C4E2E] focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Grid of Media Cards */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E8DDD0] p-12 text-center space-y-3 shadow-2xs">
          <Presentation className="w-12 h-12 text-[#C4B2A0] mx-auto" />
          <h3 className="text-base font-bold text-[#4A2E1B]">
            لا توجد عروض تقديمية أو فيديوهات تطابق اختياركِ
          </h3>
          <p className="text-xs text-[#7D6752] max-w-md mx-auto leading-relaxed">
            يمكنكِ الآن حفظ الفيديوهات والعروض التقديمية مباشرة من جهاز الكمبيوتر أو الهاتف (ملفات PowerPoint أو فيديوهات MP4 أو PDF)، أو إضافة روابط كانفا ويوتيوب.
          </p>
          {canEdit && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAddMode('device');
                  setShowAddModal(true);
                }}
                className="px-4 py-2 bg-[#4A2E1B] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#382012] flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4 text-[#D4A76A]" />
                <span>حفظ أول ملف من جهازي الآن</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const ytEmbed = item.url ? getYouTubeEmbedUrl(item.url) : null;
            const isLocal = item.sourceType === 'device';
            const isVideo = item.fileType === 'video' || (item.url && item.url.endsWith('.mp4'));
            const isPowerPoint = item.fileType === 'powerpoint';
            const isPdf = item.fileType === 'pdf';

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-[#E8DDD0] overflow-hidden shadow-[0_2px_8px_rgba(74,46,27,0.03)] hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header Media Preview Banner */}
                  <div className="h-44 bg-[#FAF5EC] border-b border-[#E8DDD0] relative flex items-center justify-center overflow-hidden">
                    {ytEmbed ? (
                      <iframe
                        src={ytEmbed}
                        title={item.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div
                        onClick={() => handleOpenPreview(item)}
                        className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-2 bg-gradient-to-br from-[#FAF5EC] to-[#F2E8DC] cursor-pointer group-hover:bg-[#EFE5D6] transition-colors relative"
                      >
                        <div className="w-13 h-13 rounded-2xl bg-[#4A2E1B] text-[#D4A76A] flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
                          {isVideo ? (
                            <Play className="w-6 h-6 fill-[#D4A76A]" />
                          ) : isPowerPoint ? (
                            <Presentation className="w-6 h-6" />
                          ) : isPdf ? (
                            <FileText className="w-6 h-6" />
                          ) : (
                            <MonitorPlay className="w-6 h-6" />
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-center">
                          <span className="text-[11px] font-black text-[#4A2E1B]">
                            {isVideo
                              ? 'فيديو مهاري (انقري للتشغيل)'
                              : isPowerPoint
                              ? 'عرض PowerPoint (انقري للمعاينة)'
                              : isPdf
                              ? 'مستند PDF (انقري للمعاينة)'
                              : item.fileType?.toUpperCase() || 'مورد رقمي'}
                          </span>
                        </div>

                        {item.fileSizeFormatted && (
                          <span className="text-[10px] text-[#7C4E2E] bg-white/70 px-2 py-0.5 rounded-md border border-[#DECFC0] tabular-nums font-bold">
                            الحجم: {item.fileSizeFormatted}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Source Badge: Saved from Device */}
                    {isLocal && (
                      <span className="absolute top-3 left-3 text-[10px] font-black px-2.5 py-1 rounded-lg bg-[#4A2E1B] text-[#D4A76A] shadow-xs flex items-center gap-1 border border-[#382012]">
                        <Laptop className="w-3 h-3" />
                        <span>من جهازكِ</span>
                      </span>
                    )}

                    {/* Category Pill Tag */}
                    <span className="absolute top-3 right-3 text-[10px] font-black px-2.5 py-1 rounded-lg bg-black/75 text-white backdrop-blur-xs">
                      {item.category === 'video'
                        ? 'فيديو مهاري'
                        : item.category === 'presentation'
                        ? 'عرض تقديمي'
                        : item.category === 'lesson_plan'
                        ? 'خطة درس'
                        : 'قوانين وتحكيم'}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-[#7D6752]">
                      <span className="font-bold text-[#4A2E1B] bg-[#FAF5EC] px-2 py-0.5 rounded-md border border-[#DFCDB6]">
                        {item.gradeRange}
                      </span>
                      <span className="tabular-nums">{item.createdAt}</span>
                    </div>

                    <h4
                      onClick={() => handleOpenPreview(item)}
                      className="text-sm font-black text-[#4A2E1B] line-clamp-2 leading-snug cursor-pointer hover:text-[#7C4E2E]"
                      title={item.title}
                    >
                      {item.title}
                    </h4>

                    {item.fileName && (
                      <p className="text-[11px] text-[#8C7560] font-mono line-clamp-1 bg-[#FAF7F2] px-2 py-1 rounded-md border border-[#EFE6D8]">
                        📁 {item.fileName}
                      </p>
                    )}

                    {item.description && (
                      <p className="text-xs text-[#7D6752] line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 pt-2 border-t border-[#F5ECE0] mt-1 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-1.5">
                    {/* Preview / Play Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenPreview(item)}
                      className="flex-1 py-1.5 px-3 bg-[#FAF5EC] hover:bg-[#F2E8DC] text-[#4A2E1B] border border-[#DFCDB6] text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#7C4E2E]" />
                      <span>{isVideo ? 'تشغيل الفيديو' : 'معاينة العرض'}</span>
                    </button>

                    {/* Download / Save to Device Button */}
                    <button
                      type="button"
                      onClick={() => handleDownloadToDevice(item)}
                      disabled={downloadingId === item.id}
                      className="flex-1 py-1.5 px-3 bg-[#4A2E1B] hover:bg-[#382012] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                      title="حفظ هذا الملف في مجلد التنزيلات على جهازكِ"
                    >
                      {downloadingId === item.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D4A76A]" />
                      ) : (
                        <Download className="w-3.5 h-3.5 text-[#D4A76A]" />
                      )}
                      <span>حفظ على جهازي</span>
                    </button>

                    {/* Delete Action */}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-[#A8422B] hover:bg-[#FAF1EC] rounded-lg transition-colors shrink-0"
                        title="حذف هذا المورد"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {item.url && item.url.startsWith('http') && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#7C4E2E] hover:underline flex items-center justify-center gap-1 py-0.5"
                    >
                      <span>فتح الرابط الأصلي</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Media Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#DFCDB6] p-6 max-w-xl w-full shadow-2xl space-y-5 animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#F0E4D2] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#4A2E1B] text-[#D4A76A] flex items-center justify-center">
                  {addMode === 'device' ? (
                    <Laptop className="w-4 h-4" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-[#4A2E1B]">
                    {addMode === 'device'
                      ? 'حفظ ورفع ملف من الجهاز (كمبيوتر / هاتف)'
                      : 'إضافة رابط إلكتروني (كانفا / يوتيوب)'}
                  </h3>
                  <p className="text-[11px] text-[#7D6752]">
                    مدرسة عائشة بنت عثمان للتعليم الأساسي
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#FAF5EC] rounded-xl border border-[#DFCDB6]">
              <button
                type="button"
                onClick={() => setAddMode('device')}
                className={`py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 ${
                  addMode === 'device'
                    ? 'bg-[#4A2E1B] text-white shadow-xs'
                    : 'text-[#5A402D] hover:bg-white/60'
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-[#D4A76A]" />
                <span>رفع وحفظ من جهازي 💻</span>
              </button>
              <button
                type="button"
                onClick={() => setAddMode('url')}
                className={`py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 ${
                  addMode === 'url'
                    ? 'bg-[#4A2E1B] text-white shadow-xs'
                    : 'text-[#5A402D] hover:bg-white/60'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#D4A76A]" />
                <span>رابط خارجي (كانفا / يوتيوب)</span>
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4 text-xs">
              {/* Device File Selection Area */}
              {addMode === 'device' && (
                <div className="space-y-2">
                  <label className="block font-bold text-[#5A402D]">
                    اختيار ملف العرض أو الفيديو من الجهاز *
                  </label>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer relative ${
                      isDragOver
                        ? 'border-[#4A2E1B] bg-[#FAF3E8]'
                        : selectedFile
                        ? 'border-[#059669] bg-[#ECFDF5]'
                        : 'border-[#DFCDB6] bg-[#FAF7F2] hover:bg-[#FAF3E8]'
                    }`}
                  >
                    <input
                      type="file"
                      id="media-file-input"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFilePicked(e.target.files[0]);
                        }
                      }}
                      accept=".mp4,.webm,.mov,.mkv,.avi,.pptx,.ppt,.pdf,.docx,.doc,.mp3,.wav"
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />

                    {selectedFile ? (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-[#065F46] text-[#A7F3D0] mx-auto flex items-center justify-center">
                          <FileCheck className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-black text-sm text-[#065F46] break-all">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-[#047857] mt-0.5 font-bold tabular-nums">
                            الحجم: {formatBytes(selectedFile.size)} | جاهز للحفظ على الجهاز
                          </p>
                        </div>
                        <p className="text-[11px] text-[#059669] underline">
                          انقري هنا لتغيير الملف المختار
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-[#4A2E1B] text-[#D4A76A] mx-auto flex items-center justify-center shadow-xs">
                          <FileUp className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-black text-sm text-[#4A2E1B]">
                            اسحبي وأفلتي ملف العرض أو الفيديو هنا
                          </p>
                          <p className="text-xs text-[#7D6752] mt-0.5">
                            أو انقري لتصفح واختيار الملف من حاسوبكِ أو هاتفكِ
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 flex-wrap pt-2 text-[10px] text-[#8C7560]">
                          <span className="bg-white px-2 py-0.5 rounded-md border border-[#DFCDB6] font-bold">
                            عروض: PowerPoint (.pptx, .ppt)
                          </span>
                          <span className="bg-white px-2 py-0.5 rounded-md border border-[#DFCDB6] font-bold">
                            فيديوهات: MP4, WebM, MOV
                          </span>
                          <span className="bg-white px-2 py-0.5 rounded-md border border-[#DFCDB6] font-bold">
                            مستندات: PDF, Word
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Title Input */}
              <div>
                <label className="block font-bold text-[#5A402D] mb-1">
                  عنوان العرض أو الفيديو الرياضي *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: عرض مهارة التمرير الصدري في كرة السلة للصف الخامس"
                  className="w-full rounded-xl border border-[#DFCDB6] bg-[#FAF7F2] px-3 py-2 font-bold text-[#2C1A11] focus:border-[#7C4E2E] focus:outline-hidden"
                />
              </div>

              {/* Category and Grade Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#5A402D] mb-1">نوع المورد *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MediaCategory)}
                    className="w-full rounded-xl border border-[#DFCDB6] bg-white px-3 py-2 font-bold text-[#4A2E1B]"
                  >
                    <option value="presentation">عرض تقديمي (PowerPoint / Canva / PDF)</option>
                    <option value="video">فيديو تعليمي / مهاري</option>
                    <option value="lesson_plan">خطة أو نموذج درس رياضي</option>
                    <option value="rules">قوانين وتحكيم الألعاب</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#5A402D] mb-1">المرحلة أو الصف المستهدف</label>
                  <select
                    value={gradeRange}
                    onChange={(e) => setGradeRange(e.target.value)}
                    className="w-full rounded-xl border border-[#DFCDB6] bg-white px-3 py-2 font-bold text-[#4A2E1B]"
                  >
                    <option value="الصفوف 5–9">الحلقة الثانية (الصفوف 5–9)</option>
                    <option value="الصفوف 1–4">الحلقة الأولى (الصفوف 1–4)</option>
                    <option value="الصفوف 10–12">ما بعد الأساسي (الصفوف 10–12)</option>
                    <option value="جميع الصفوف">جميع الصفوف (1–12)</option>
                  </select>
                </div>
              </div>

              {/* URL Input (URL Mode Only) */}
              {addMode === 'url' && (
                <div>
                  <label className="block font-bold text-[#5A402D] mb-1">
                    رابط المورد (Canva / YouTube / Google Drive / رابط مباشر) *
                  </label>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-[#DFCDB6] bg-[#FAF7F2] px-3 py-2 text-[#2C1A11] focus:border-[#7C4E2E] focus:outline-hidden font-mono"
                    dir="ltr"
                  />
                  <span className="text-[10px] text-[#7D6752] mt-0.5 block">
                    يمكنكِ وضع رابط مشاركة العرض من كانفا (Canva)، رابط جوجل درايف، أو فيديو يوتيوب.
                  </span>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block font-bold text-[#5A402D] mb-1">
                  وصف المحتوى والأهداف التعليمية (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="يشتمل على شرح الخطوات الفنية، التدريبات المهارية، والأخطاء الشائعة..."
                  className="w-full rounded-xl border border-[#DFCDB6] bg-white p-2.5 text-[#2C1A11] focus:border-[#7C4E2E] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0E4D2]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-[#7D6752] hover:bg-gray-100 rounded-xl transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#4A2E1B] hover:bg-[#382012] text-white text-xs font-black rounded-xl transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#D4A76A]" />
                      <span>جاري حفظ ومعالجة الملف...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-[#D4A76A]" />
                      <span>
                        {addMode === 'device'
                          ? 'حفظ الملف في المنصة والجهاز ✓'
                          : 'حفظ وتثبيت المورد'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview & Player Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#DFCDB6] p-5 sm:p-6 max-w-3xl w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#F0E4D2] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#4A2E1B] text-[#D4A76A] flex items-center justify-center">
                  {previewItem.category === 'video' ? (
                    <Film className="w-5 h-5" />
                  ) : (
                    <Presentation className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-[#4A2E1B] line-clamp-1">
                    {previewItem.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-[#7D6752]">
                    <span>{previewItem.gradeRange}</span>
                    <span>•</span>
                    <span>{previewItem.createdAt}</span>
                    {previewItem.sourceType === 'device' && (
                      <>
                        <span>•</span>
                        <span className="text-[#059669] font-bold">محفوظ على جهازكِ ✓</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClosePreview}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Viewer Media Body */}
            <div className="bg-[#FAF5EC] rounded-2xl border border-[#DFCDB6] overflow-hidden min-h-[300px] flex items-center justify-center relative">
              {isLoadingPreview ? (
                <div className="p-12 text-center space-y-2">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#7C4E2E] mx-auto" />
                  <p className="text-xs font-bold text-[#4A2E1B]">
                    جاري تحميل المورد من ذاكرة الجهاز...
                  </p>
                </div>
              ) : previewItem.fileType === 'video' && (previewBlobUrl || previewItem.url) ? (
                <video
                  src={previewBlobUrl || previewItem.url}
                  controls
                  autoPlay
                  className="w-full max-h-[60vh] rounded-xl bg-black"
                >
                  متصفحكِ لا يدعم تشغيل هذا الفيديو مباشرة.
                </video>
              ) : previewItem.url && getYouTubeEmbedUrl(previewItem.url) ? (
                <iframe
                  src={getYouTubeEmbedUrl(previewItem.url)!}
                  title={previewItem.title}
                  className="w-full h-[60vh] border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : previewItem.fileType === 'pdf' && (previewBlobUrl || previewItem.url) ? (
                <iframe
                  src={previewBlobUrl || previewItem.url}
                  title={previewItem.title}
                  className="w-full h-[60vh] border-0 rounded-xl"
                />
              ) : (
                /* Presentation & Generic Document Card */
                <div className="p-8 text-center space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-[#4A2E1B] text-[#D4A76A] flex items-center justify-center mx-auto shadow-md">
                    <Presentation className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-[#4A2E1B]">
                      {previewItem.fileName || previewItem.title}
                    </h4>
                    <p className="text-xs text-[#7D6752] mt-1">
                      {previewItem.fileType === 'powerpoint'
                        ? 'عرض تقديمي بتنسيق Microsoft PowerPoint'
                        : previewItem.fileType === 'canva'
                        ? 'عرض تقديمي عبر منصة كانفا التعليمية (Canva)'
                        : 'ملف تعليمي لمادة الرياضة المدرسية'}
                    </p>
                    {previewItem.fileSizeFormatted && (
                      <p className="text-xs font-bold text-[#7C4E2E] mt-1 tabular-nums">
                        حجم الملف: {previewItem.fileSizeFormatted}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleDownloadToDevice(previewItem)}
                      className="w-full sm:w-auto px-5 py-2.5 bg-[#4A2E1B] hover:bg-[#382012] text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4 text-[#D4A76A]" />
                      <span>حفظ وتحميل الملف إلى جهازي</span>
                    </button>

                    {previewItem.url && previewItem.url.startsWith('http') && (
                      <a
                        href={previewItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-[#FAF5EC] text-[#4A2E1B] border border-[#DFCDB6] text-xs font-black rounded-xl transition-all shadow-2xs flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4 text-[#7C4E2E]" />
                        <span>فتح الرابط في صفحة جديدة</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Description & Action Bar */}
            {previewItem.description && (
              <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#DFCDB6] text-xs text-[#5A402D] leading-relaxed">
                <span className="font-bold text-[#4A2E1B] block mb-1">وصف الحصة والمحتوى:</span>
                {previewItem.description}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#F0E4D2]">
              <div className="text-[11px] text-[#7D6752]">
                أضيف بواسطة: <strong className="text-[#4A2E1B]">{previewItem.addedBy}</strong>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleDownloadToDevice(previewItem)}
                  disabled={downloadingId === previewItem.id}
                  className="flex-1 sm:flex-none px-4 py-2 bg-[#4A2E1B] hover:bg-[#382012] text-white text-xs font-black rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4 text-[#D4A76A]" />
                  <span>حفظ وتحميل على جهازي</span>
                </button>

                <button
                  type="button"
                  onClick={handleClosePreview}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
