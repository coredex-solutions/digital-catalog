# Image Optimization Guide

This app uses a **dual optimization strategy** for maximum performance and cost efficiency:

1. **Upload-time compression** - Reduces storage costs and bandwidth
2. **Next.js Image Optimization** - Provides responsive images and modern formats

---

## 📦 Upload-Time Compression Parameters

These settings compress images when uploaded to R2, reducing storage costs.

### Environment Variables (Netlify)

Add these to your Netlify environment variables:

```bash
# Image Quality (1-100)
# Recommended: 82 for food photos (good balance of quality/size)
# Lower = smaller files but lower quality
# Higher = better quality but larger files
R2_IMAGE_QUALITY=82

# Maximum Dimensions (pixels)
# Recommended: 2048 for high-resolution displays
# Images larger than this will be resized maintaining aspect ratio
R2_IMAGE_MAX_WIDTH=2048
R2_IMAGE_MAX_HEIGHT=2048

# Convert to WebP (optional)
# true = Convert all images to WebP format (better compression)
# false = Keep original format (PNG/JPEG)
# Recommended: false (let Next.js handle format conversion)
R2_CONVERT_TO_WEBP=false
```

### Recommended Settings by Use Case

#### **Food Photos (Menu Items)**
```bash
R2_IMAGE_QUALITY=82
R2_IMAGE_MAX_WIDTH=2048
R2_IMAGE_MAX_HEIGHT=2048
R2_CONVERT_TO_WEBP=false
```
**Why:** Food photos need good color accuracy. 82 quality provides excellent visual quality with good compression.

#### **Category Thumbnails**
```bash
R2_IMAGE_QUALITY=80
R2_IMAGE_MAX_WIDTH=1920
R2_IMAGE_MAX_HEIGHT=1080
R2_CONVERT_TO_WEBP=false
```
**Why:** Thumbnails are smaller, so slightly lower quality is acceptable.

#### **Maximum Compression (Lowest Storage Costs)**
```bash
R2_IMAGE_QUALITY=75
R2_IMAGE_MAX_WIDTH=1920
R2_IMAGE_MAX_HEIGHT=1920
R2_CONVERT_TO_WEBP=true
```
**Why:** Aggressive compression for maximum storage savings. Quality is still good for web.

---

## 🖼️ Next.js Image Component Parameters

Next.js Image component automatically optimizes images for different devices and formats.

### Component Usage

```tsx
import Image from "next/image";

// For category images (grid layout)
<Image
  src={category.image_url}
  alt={category.name_en}
  fill
  sizes="(max-width: 768px) 50vw, 33vw"
  className="object-cover"
/>

// For thumbnails (fixed size)
<Image
  src={image_url}
  alt="Description"
  width={96}
  height={96}
  sizes="96px"
  className="object-cover"
/>
```

### Key Props Explained

#### `fill` (for responsive containers)
- Use when image should fill its parent container
- Parent must have `position: relative`
- Requires `sizes` prop

#### `sizes` (critical for performance)
```tsx
// Category grid (2 columns mobile, 3 columns desktop)
sizes="(max-width: 768px) 50vw, 33vw"

// Full width images
sizes="100vw"

// Fixed size thumbnails
sizes="96px"

// Responsive with breakpoints
sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
```

#### `width` & `height` (for fixed dimensions)
- Use for thumbnails, icons, or known dimensions
- Prevents layout shift
- Don't use with `fill`

#### `priority` (for above-the-fold images)
```tsx
<Image
  src={heroImage}
  alt="Hero"
  fill
  priority // Loads immediately, no lazy loading
/>
```

#### `quality` (override default)
```tsx
<Image
  src={image}
  alt="Description"
  fill
  quality={90} // Override default 75 (1-100)
/>
```

### Next.js Config Settings

Already configured in `next.config.ts`:

```typescript
images: {
  formats: ['image/avif', 'image/webp'], // Modern formats
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 60, // Cache for 60 seconds
}
```

**What this means:**
- **AVIF/WebP:** Automatically served when browser supports it (30-50% smaller)
- **Device Sizes:** Responsive breakpoints for different screen sizes
- **Image Sizes:** Thumbnail/icon sizes
- **Cache TTL:** How long optimized images are cached

---

## 🎯 Complete Optimization Strategy

### Upload Flow
1. User uploads image (max 10MB)
2. **Compression happens** (reduces to ~200-500KB typically)
3. Uploaded to R2 with optimized size
4. URL stored in database

### Display Flow
1. Component requests image via Next.js Image
2. **Next.js optimizes on-demand:**
   - Detects device size
   - Serves appropriate size (640px, 1080px, 1920px, etc.)
   - Converts to WebP/AVIF if supported
   - Caches optimized version
3. Browser receives optimized image

### Benefits
- ✅ **Storage:** 70-80% reduction from upload compression
- ✅ **Bandwidth:** 50-70% reduction from Next.js optimization
- ✅ **Performance:** Faster page loads, better Core Web Vitals
- ✅ **User Experience:** Images load at appropriate size for device

---

## 📊 Expected File Sizes

### Original Upload
- Typical: 2-5 MB
- Large: 5-10 MB

### After Upload Compression (R2)
- Typical: 200-500 KB (82 quality)
- Large: 500-800 KB (82 quality)
- **Reduction: 70-85%**

### After Next.js Optimization (Served)
- Mobile (640px): 50-100 KB
- Tablet (1080px): 100-200 KB
- Desktop (1920px): 200-400 KB
- **Additional reduction: 50-70%**

### Total Savings
- **Original → Served: 90-95% reduction**
- Example: 5 MB → 200 KB (96% reduction)

---

## 🔧 Troubleshooting

### Images not optimizing?
1. Check `next.config.ts` has R2 domains in `remotePatterns`
2. Verify images are using `next/image` component
3. Check browser supports WebP/AVIF (modern browsers do)

### Images too large after compression?
- Lower `R2_IMAGE_QUALITY` (try 75-80)
- Reduce `R2_IMAGE_MAX_WIDTH/HEIGHT` (try 1920)

### Images look pixelated?
- Increase `R2_IMAGE_QUALITY` (try 85-90)
- Increase `R2_IMAGE_MAX_WIDTH/HEIGHT` (try 2560)

### Next.js optimization slow?
- First request is slower (optimization happens)
- Subsequent requests are fast (cached)
- Consider using `priority` for above-the-fold images

---

## 📝 Quick Reference

### Recommended Settings (Production)

```bash
# Netlify Environment Variables
R2_IMAGE_QUALITY=82
R2_IMAGE_MAX_WIDTH=2048
R2_IMAGE_MAX_HEIGHT=2048
R2_CONVERT_TO_WEBP=false
```

### Component Usage

```tsx
// Category images
<Image src={url} alt={name} fill sizes="(max-width: 768px) 50vw, 33vw" />

// Thumbnails
<Image src={url} alt={name} width={96} height={96} sizes="96px" />

// Hero/Above-fold
<Image src={url} alt={name} fill sizes="100vw" priority />
```

---

## 🚀 Performance Tips

1. **Use `priority`** for images above the fold
2. **Set correct `sizes`** for responsive images
3. **Use `fill`** for responsive containers
4. **Use `width/height`** for fixed-size images
5. **Monitor Core Web Vitals** to ensure optimization is working

---

## 📈 Monitoring

Check your image optimization:
- **Network tab:** See actual file sizes served
- **Lighthouse:** Check image optimization score
- **R2 Dashboard:** Monitor storage usage
- **Next.js Analytics:** Track image optimization metrics

