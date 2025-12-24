# Image Optimization Parameters - Quick Reference

## 🚀 Recommended Settings for Your Restaurant Menu App

### Netlify Environment Variables

Add these to **Netlify Dashboard → Site Settings → Environment Variables**:

```bash
# Upload Compression Settings
R2_IMAGE_QUALITY=82
R2_IMAGE_MAX_WIDTH=2048
R2_IMAGE_MAX_HEIGHT=2048
R2_CONVERT_TO_WEBP=false
```

---

## 📋 Parameter Details

### 1. `R2_IMAGE_QUALITY` (1-100)
**Recommended: 82**

- **75-80:** Maximum compression, good for thumbnails
- **82-85:** **Best for food photos** (recommended)
- **90-95:** High quality, larger files
- **100:** No compression, largest files

**Why 82?** Food photos need good color accuracy. 82 provides excellent visual quality with ~70% file size reduction.

---

### 2. `R2_IMAGE_MAX_WIDTH` (pixels)
**Recommended: 2048**

- **1920:** Standard HD displays
- **2048:** **High-res displays** (recommended)
- **2560:** 4K displays (larger files)
- **3840:** Maximum quality (very large files)

**Why 2048?** Covers most modern displays while keeping file sizes reasonable.

---

### 3. `R2_IMAGE_MAX_HEIGHT` (pixels)
**Recommended: 2048**

- **1080:** Standard height
- **2048:** **High-res displays** (recommended)
- **2560:** 4K displays
- **3840:** Maximum quality

**Why 2048?** Matches width for consistent aspect ratio handling.

---

### 4. `R2_CONVERT_TO_WEBP` (true/false)
**Recommended: false**

- **false:** Keep original format (PNG/JPEG), let Next.js convert
- **true:** Convert all to WebP during upload

**Why false?** Next.js Image automatically serves WebP/AVIF when supported. Converting on upload is redundant and can cause compatibility issues.

---

## 🎨 Next.js Image Component Usage

### Category Images (Grid)
```tsx
<Image
  src={category.image_url}
  alt={category.name_en}
  fill
  sizes="(max-width: 768px) 50vw, 33vw"
  className="object-cover"
/>
```

### Thumbnails (Fixed Size)
```tsx
<Image
  src={image_url}
  alt="Description"
  width={96}
  height={96}
  sizes="96px"
  className="object-cover"
/>
```

### Hero/Above-Fold Images
```tsx
<Image
  src={heroImage}
  alt="Hero"
  fill
  sizes="100vw"
  priority
/>
```

---

## 📊 Expected Results

### File Size Reduction
- **Original:** 2-5 MB
- **After Upload Compression:** 200-500 KB (70-85% reduction)
- **After Next.js Optimization (Mobile):** 50-100 KB (90-95% total reduction)

### Performance
- **Storage Costs:** 70-80% reduction
- **Bandwidth:** 50-70% reduction
- **Page Load:** Faster Core Web Vitals scores
- **User Experience:** Images load at appropriate size for device

---

## ⚙️ Alternative Settings

### Maximum Compression (Lowest Costs)
```bash
R2_IMAGE_QUALITY=75
R2_IMAGE_MAX_WIDTH=1920
R2_IMAGE_MAX_HEIGHT=1920
R2_CONVERT_TO_WEBP=false
```

### Maximum Quality (Best Visuals)
```bash
R2_IMAGE_QUALITY=90
R2_IMAGE_MAX_WIDTH=2560
R2_IMAGE_MAX_HEIGHT=2560
R2_CONVERT_TO_WEBP=false
```

### Balanced (Recommended)
```bash
R2_IMAGE_QUALITY=82
R2_IMAGE_MAX_WIDTH=2048
R2_IMAGE_MAX_HEIGHT=2048
R2_CONVERT_TO_WEBP=false
```

---

## ✅ Setup Checklist

- [ ] Add environment variables to Netlify
- [ ] Verify `next.config.ts` has R2 domains configured
- [ ] All images use `next/image` component
- [ ] Test upload and verify compression works
- [ ] Check Network tab to see optimized sizes
- [ ] Monitor R2 storage usage

---

## 🔍 Verification

### Check Upload Compression
1. Upload an image
2. Check server logs for compression stats
3. Verify file size in R2 dashboard

### Check Next.js Optimization
1. Open browser DevTools → Network tab
2. Load a page with images
3. Check image requests - should see:
   - Different sizes for different devices
   - WebP/AVIF format when supported
   - Smaller file sizes than original

---

## 📞 Need Help?

- See `IMAGE_OPTIMIZATION_GUIDE.md` for detailed documentation
- Check Next.js Image docs: https://nextjs.org/docs/app/api-reference/components/image
- Monitor performance in Lighthouse/PageSpeed Insights

