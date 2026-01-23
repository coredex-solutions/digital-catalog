"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ImageUploadProps {
  previewUrl: string | null;
  onFileSelect: (file: File | null) => void;
  folder: string;
  label?: string;
  className?: string;
}

export function ImageUpload({
  previewUrl,
  onFileSelect,
  folder,
  label = "Image",
  className = "",
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be less than 5MB");
        return;
      }
      onFileSelect(file);
    }
  };

  const handleRemove = () => {
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        {label}
      </label>
      <div className="space-y-4">
        <AnimatePresence>
          {previewUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-navy-700 border-2 border-slate-200 dark:border-navy-600 group"
            >
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 p-2 bg-purple-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple-600"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <label className="flex flex-col items-center justify-center gap-2 w-full px-4 py-6 bg-slate-50 dark:bg-navy-700 border-2 border-dashed border-slate-300 dark:border-navy-600 rounded-xl cursor-pointer hover:border-purple-500 dark:hover:border-purple-500 transition-colors">
          {!previewUrl && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <Upload size={24} className="text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Click to upload or drag and drop
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-500">
                PNG, JPG, GIF up to 5MB
              </span>
            </div>
          )}
          {previewUrl && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <ImageIcon size={16} />
              <span>Change image</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}

