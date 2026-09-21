"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Camera,
  Upload,
  User,
  Briefcase,
  Phone,
  Mail,
  Check,
  Sparkles,
  Trash2,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { updateUserProfileAction } from "@/app/actions/profile";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: any;
  onProfileUpdated?: (updatedUser: any) => void;
}

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80",
];

export function EditProfileModal({
  open,
  onClose,
  user,
  onProfileUpdated,
}: EditProfileModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || "Ahmad Aziz");
  const [designation, setDesignation] = useState(
    user?.designation || user?.occupation || "Senior Sales Lead"
  );
  const [phone, setPhone] = useState(user?.phone || "");
  const [image, setImage] = useState(user?.image || "");
  const [customUrlInput, setCustomUrlInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Synchronize when modal opens or user prop updates
  useEffect(() => {
    if (open && user) {
      setName(user.name || "Ahmad Aziz");
      setDesignation(user.designation || user.occupation || "Senior Sales Lead");
      setPhone(user.phone || "");
      setImage(user.image || "");
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [open, user]);

  if (!open) return null;

  // Handle local image file upload with intelligent client-side canvas compression
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Image size exceeds 10MB limit. Please choose a smaller photo.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const rawResult = reader.result as string;
      try {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_DIM = 320;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_DIM) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimized = canvas.toDataURL("image/jpeg", 0.85);
            setImage(optimized);
            setErrorMsg(null);
          } else {
            setImage(rawResult);
          }
        };
        img.onerror = () => {
          setImage(rawResult);
        };
        img.src = rawResult;
      } catch (err) {
        setImage(rawResult);
      }
    };
    reader.readAsDataURL(file);
  }

  // Handle submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }

    setIsPending(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await updateUserProfileAction({
      name: name.trim(),
      designation: designation.trim(),
      phone: phone.trim() || undefined,
      image: image.trim() || undefined,
    });

    setIsPending(false);

    if (res.success && res.user) {
      setSuccessMsg("Profile updated successfully!");
      if (onProfileUpdated) {
        onProfileUpdated(res.user);
      }
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setErrorMsg(res.error || "Failed to update profile.");
    }
  }

  const initials = (name || user?.email || "U")
    .split(" ")
    .map((p: string) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-[28px] border border-white/[0.14] bg-[#0f1019]/95 p-6 sm:p-7 shadow-[0_24px_80px_rgba(0,0,0,0.8)] backdrop-blur-3xl text-slate-100 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 shadow-sm">
              <User size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>Edit Profile</span>
                <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30">
                  Account
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Change your name, designation, and avatar photo.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/15 p-3 text-xs font-medium text-rose-200">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/15 p-3 text-xs font-medium text-emerald-200 flex items-center gap-2">
            <Check size={14} className="text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* PHOTO SECTION */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            {/* Avatar Preview */}
            <div className="relative group shrink-0">
              <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-tr from-amber-500/30 to-indigo-500/30 border-2 border-white/20 shadow-lg overflow-hidden flex items-center justify-center">
                {image ? (
                  <img
                    src={image}
                    alt={name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-white">{initials}</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all cursor-pointer hover:scale-110"
                title="Upload Photo"
              >
                <Camera size={13} />
              </button>
            </div>

            {/* Photo Controls */}
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Profile Photo
              </span>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] px-3 py-1.5 text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  <Upload size={12} />
                  <span>Upload File</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCustomUrlInput(!customUrlInput)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  <ImageIcon size={12} />
                  <span>URL</span>
                </button>

                {image && (
                  <button
                    type="button"
                    onClick={() => setImage("")}
                    className="inline-flex items-center gap-1 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-1.5 text-xs font-medium text-rose-300 transition-all cursor-pointer"
                    title="Remove Photo"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>

              {/* URL Input dropdown */}
              {customUrlInput && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="flex-1 rounded-xl border border-white/15 bg-white/[0.05] px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (imageUrl.trim()) {
                        setImage(imageUrl.trim());
                        setImageUrl("");
                        setCustomUrlInput(false);
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400"
                  >
                    Set
                  </button>
                </div>
              )}

              {/* Quick Presets */}
              <div className="pt-1">
                <span className="block text-[10px] text-slate-400 mb-1">
                  Or select executive avatar:
                </span>
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  {PRESET_AVATARS.map((avatarUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setImage(avatarUrl)}
                      className={`h-7 w-7 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                        image === avatarUrl
                          ? "border-amber-400 ring-2 ring-amber-400/40 scale-110"
                          : "border-white/15 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={avatarUrl}
                        alt={`Preset ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* NAME & DESIGNATION INPUTS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ahmad Aziz"
                  className="w-full rounded-2xl border border-white/15 bg-white/[0.06] py-2.5 pl-9 pr-4 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Designation / Title *
              </label>
              <div className="relative">
                <Briefcase size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Senior Sales Lead, VP Growth"
                  className="w-full rounded-2xl border border-white/15 bg-white/[0.06] py-2.5 pl-9 pr-4 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all"
                />
              </div>
            </div>
          </div>

          {/* PHONE & EMAIL INPUTS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+966 50 123 4567"
                  className="w-full rounded-2xl border border-white/15 bg-white/[0.06] py-2.5 pl-9 pr-4 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Account Email
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  disabled
                  value={user?.email || "user@dealnest.co"}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.02] py-2.5 pl-9 pr-4 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Save Profile Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

