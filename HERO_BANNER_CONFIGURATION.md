# Hero Banner Configuration - Testing Guide

## ✅ Implementation Complete

The hero banner configuration is **fully implemented** and working as a **configuration-based system** (no user toggle).

---

## 📋 How It Works

### Backend Configuration
In the Event model (`Event.cs` and `EventDto.cs`):
```csharp
public bool UseBackgroundAsHero { get; set; } = false;
```

### Admin Panel Control
In `EventFormPage.jsx`, organizers can toggle:
```
☑️ Use Background as Hero Banner
```

**When ENABLED:**
- Landing page shows the background image as hero banner
- Image covers the full hero section with dark overlay

**When DISABLED (default):**
- Landing page shows gradient background (using primary/secondary colors)
- More modern, animated gradient with particle effects

---

## 🎨 Visual Behavior

### Configuration: `UseBackgroundAsHero = true` ✅
```
┌─────────────────────────────────────┐
│                                     │
│     [Background Image Visible]      │
│                                     │
│     Event Title                     │
│     Event Description               │
│     📅 Date | 📍 Location           │
│                                     │
└─────────────────────────────────────┘
```
- Shows `backgroundImageUrl` or `bannerImageUrl`
- Dark gradient overlay for text readability
- Full-screen background image

### Configuration: `UseBackgroundAsHero = false` ❌ (Default)
```
┌─────────────────────────────────────┐
│                                     │
│   [Animated Gradient Background]    │
│   [Floating Particles & Orbs]       │
│                                     │
│     Event Title                     │
│     Event Description               │
│     📅 Date | 📍 Location           │
│                                     │
└─────────────────────────────────────┘
```
- Shows animated gradient (primary → secondary color)
- Floating particles and blob animations
- More dynamic and modern feel

---

## 🔧 Implementation Details

### Frontend Logic (`EventHero.tsx`)
```typescript
// Determine background mode based on event configuration
const showImageBackground = event.useBackgroundAsHero && backgroundImage;

// Gradient Background
<div className={`transition-opacity ${showImageBackground ? 'opacity-0' : 'opacity-100'}`}>
  <gradient background>
</div>

// Image Background
{backgroundImage && (
  <div className={`transition-opacity ${showImageBackground ? 'opacity-100' : 'opacity-0'}`}>
    <Image src={backgroundImage} />
  </div>
)}
```

**Key Points:**
- ✅ No user toggle button (purely configuration-based)
- ✅ Smooth transitions (1 second fade)
- ✅ Always respects admin's choice
- ✅ Falls back to gradient if no image provided

### API Integration
```typescript
// eventApi.ts interface
interface EventData {
  useBackgroundAsHero?: boolean;
  backgroundImageUrl?: string;
  bannerImageUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}
```

---

## 🧪 Testing Scenarios

### Test 1: Hero Banner Enabled with Image
1. **Admin:** Create event with background image
2. **Admin:** Enable "Use Background as Hero Banner" ✅
3. **Admin:** Save event
4. **Landing Page:** Should show background image as hero
5. **Verify:** No toggle button visible to visitors

### Test 2: Hero Banner Disabled
1. **Admin:** Create event with background image
2. **Admin:** Leave "Use Background as Hero Banner" DISABLED ❌
3. **Admin:** Save event
4. **Landing Page:** Should show animated gradient
5. **Verify:** Background image NOT visible in hero

### Test 3: No Background Image
1. **Admin:** Create event WITHOUT background image
2. **Admin:** Enable "Use Background as Hero Banner" ✅
3. **Admin:** Save event
4. **Landing Page:** Should show gradient (fallback)
5. **Verify:** Gracefully handles missing image

### Test 4: Color Configuration
1. **Admin:** Set primary color (e.g., #1e3a8a - blue)
2. **Admin:** Set secondary color (e.g., #3b82f6 - lighter blue)
3. **Admin:** Disable hero banner
4. **Landing Page:** Gradient should use these colors
5. **Verify:** Gradient flows from primary to secondary

---

## 🎯 Comparison with User Toggle

### ❌ OLD Implementation (Removed)
```typescript
// User could toggle between modes
const [backgroundMode, setBackgroundMode] = useState('gradient');

// Toggle button visible to all visitors
<button onClick={() => setBackgroundMode(...)}>
  Toggle Background
</button>
```

**Problems:**
- Visitors could override admin's design choice
- Inconsistent experience across users
- Extra UI element cluttering the page

### ✅ NEW Implementation (Current)
```typescript
// Configuration-based (no state)
const showImageBackground = event.useBackgroundAsHero && backgroundImage;

// No toggle button - respects admin config only
```

**Benefits:**
- ✅ Admin has full control over design
- ✅ Consistent experience for all visitors
- ✅ Cleaner UI (no toggle button)
- ✅ Predictable behavior

---

## 📊 Configuration Matrix

| Background Image | UseBackgroundAsHero | Result |
|------------------|---------------------|--------|
| ✅ Exists        | ✅ true            | **Image Hero** |
| ✅ Exists        | ❌ false           | **Gradient** |
| ❌ Missing       | ✅ true            | **Gradient (fallback)** |
| ❌ Missing       | ❌ false           | **Gradient** |

---

## 🚀 Production Ready

**Status:** ✅ Fully implemented and tested

**Files Modified:**
1. `Event.cs` - Added `UseBackgroundAsHero` property
2. `EventDto.cs` - Added `UseBackgroundAsHero` field
3. `EventFormPage.jsx` - Added checkbox control
4. `EventHero.tsx` - Implemented configuration-based logic
5. `eventApi.ts` - Added `useBackgroundAsHero` to interface

**No Breaking Changes:**
- Defaults to `false` (gradient mode)
- Backward compatible with existing events
- Gracefully handles missing images

---

## 💡 Design Philosophy

The hero banner configuration follows these principles:

1. **Admin Control** - Event organizers decide the visual presentation
2. **Consistency** - All visitors see the same design
3. **Flexibility** - Easy to change without code updates
4. **Fallback** - Always shows something beautiful (gradient)
5. **Performance** - Both backgrounds preloaded, opacity transitions only

---

## 🎨 Styling Details

### Image Mode
- Full-screen background image
- Dark overlay: `from-black/60 via-black/40 to-black/60`
- Ensures text readability
- Maintains aspect ratio with `object-cover`

### Gradient Mode
- Uses event's `primaryColor` and `secondaryColor`
- Default: Blue gradient (`#1e3a8a → #3b82f6`)
- Animated blob effects
- Floating particles
- Pattern overlay for texture

### Transitions
- Smooth opacity fade: 1000ms duration
- No layout shift during transition
- Both backgrounds always rendered (hidden via opacity)

---

## 📱 Mobile Considerations

Both modes are fully responsive:

**Image Hero:**
- Image scales on mobile
- Dark overlay ensures text readable on any image
- Touch-optimized spacing

**Gradient Hero:**
- Blob animations work on mobile
- Reduced animation on low-power devices
- Maintains performance

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
