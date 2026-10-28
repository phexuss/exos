//! Full monitor refresh rate on Linux with the Nvidia driver.
//!
//! WebKitGTK paces rendering with a thread that blocks in libdrm's
//! `drmWaitVBlank` once per frame. Nvidia's proprietary driver doesn't
//! implement that ioctl, so the probe fails and WebKit falls back to a timer
//! hard-coded to 60 fps (Source/WebKit/UIProcess/glib/DisplayVBlankMonitor*).
//!
//! This binary exports its own `drmWaitVBlank` (see build.rs), which the
//! dynamic linker prefers over libdrm's. It forwards to the real one, and only
//! when the driver refuses does it sleep until the next refresh, computed from
//! the CRTC's mode timings. On AMD and Intel the real call succeeds and
//! nothing changes. `EXOS_VBLANK=0` turns the emulation off.
//!
//! Second half: WebKit also rounds page updates to "near 60 fps" by default
//! (PreferPageRenderingUpdatesNear60FPSEnabled), which would turn 165 Hz into
//! 55; `allow_full_refresh` switches that preference off for our webview.

use std::collections::HashMap;
use std::ffi::{c_char, c_int, c_long, c_ulong, c_void, CStr};
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};

const DRM_VBLANK_RELATIVE: u32 = 0x1;
const DRM_VBLANK_HIGH_CRTC_MASK: u32 = 0x3e;
const DRM_VBLANK_HIGH_CRTC_SHIFT: u32 = 1;
const DRM_VBLANK_EVENT: u32 = 0x400_0000;
const DRM_VBLANK_SECONDARY: u32 = 0x2000_0000;
const DRM_VBLANK_SIGNAL: u32 = 0x4000_0000;
/// Keeps emulated sequence numbers clear of small values WebKit might compare against.
const SEQUENCE_OFFSET: u64 = 1 << 24;

#[repr(C)]
#[derive(Clone, Copy)]
pub struct VBlankRequest {
    kind: u32,
    sequence: u32,
    signal: c_ulong,
}

#[repr(C)]
#[derive(Clone, Copy)]
pub struct VBlankReply {
    kind: u32,
    sequence: u32,
    tval_sec: c_long,
    tval_usec: c_long,
}

/// libdrm's `drmVBlank`.
#[repr(C)]
pub union DrmVBlank {
    request: VBlankRequest,
    reply: VBlankReply,
}

#[repr(C)]
struct ModeRes {
    count_fbs: c_int,
    fbs: *mut u32,
    count_crtcs: c_int,
    crtcs: *mut u32,
    count_connectors: c_int,
    connectors: *mut u32,
    count_encoders: c_int,
    encoders: *mut u32,
    min_width: u32,
    max_width: u32,
    min_height: u32,
    max_height: u32,
}

#[repr(C)]
struct ModeInfo {
    clock: u32,
    hdisplay: u16,
    hsync_start: u16,
    hsync_end: u16,
    htotal: u16,
    hskew: u16,
    vdisplay: u16,
    vsync_start: u16,
    vsync_end: u16,
    vtotal: u16,
    vscan: u16,
    vrefresh: u32,
    flags: u32,
    kind: u32,
    name: [c_char; 32],
}

#[repr(C)]
struct ModeCrtc {
    crtc_id: u32,
    buffer_id: u32,
    x: u32,
    y: u32,
    width: u32,
    height: u32,
    mode_valid: c_int,
    mode: ModeInfo,
    gamma_size: c_int,
}

type WaitFn = unsafe extern "C" fn(c_int, *mut DrmVBlank) -> c_int;
type GetResourcesFn = unsafe extern "C" fn(c_int) -> *mut ModeRes;
type FreeResourcesFn = unsafe extern "C" fn(*mut ModeRes);
type GetCrtcFn = unsafe extern "C" fn(c_int, u32) -> *mut ModeCrtc;
type FreeCrtcFn = unsafe extern "C" fn(*mut ModeCrtc);

fn lookup(handle: *mut c_void, name: &CStr) -> Option<usize> {
    let p = unsafe { libc::dlsym(handle, name.as_ptr()) } as usize;
    (p != 0).then_some(p)
}

fn real_wait() -> Option<WaitFn> {
    static REAL: OnceLock<Option<usize>> = OnceLock::new();
    let p = (*REAL.get_or_init(|| lookup(libc::RTLD_NEXT, c"drmWaitVBlank")))?;
    Some(unsafe { std::mem::transmute::<usize, WaitFn>(p) })
}

fn enabled() -> bool {
    static ON: OnceLock<bool> = OnceLock::new();
    *ON.get_or_init(|| std::env::var("EXOS_VBLANK").map(|v| v != "0").unwrap_or(true))
}

fn crtc_index(kind: u32) -> u32 {
    if kind & DRM_VBLANK_HIGH_CRTC_MASK != 0 {
        (kind & DRM_VBLANK_HIGH_CRTC_MASK) >> DRM_VBLANK_HIGH_CRTC_SHIFT
    } else if kind & DRM_VBLANK_SECONDARY != 0 {
        1
    } else {
        0
    }
}

/// One refresh of a mode: htotal × vtotal pixels at `clock` kHz.
fn frame_period(clock_khz: u32, htotal: u16, vtotal: u16, vscan: u16) -> Option<Duration> {
    if clock_khz == 0 || htotal == 0 || vtotal == 0 {
        return None;
    }
    let mut nanos = u64::from(htotal) * u64::from(vtotal) * 1_000_000 / u64::from(clock_khz);
    if vscan > 1 {
        nanos *= u64::from(vscan);
    }
    // Anything outside 24-500 Hz means we misread the mode; let WebKit keep its timer.
    (2_000_000..=41_700_000).contains(&nanos).then(|| Duration::from_nanos(nanos))
}

fn query_period(fd: c_int, index: u32) -> Option<Duration> {
    let get_res: GetResourcesFn = unsafe { std::mem::transmute(lookup(libc::RTLD_DEFAULT, c"drmModeGetResources")?) };
    let free_res: FreeResourcesFn = unsafe { std::mem::transmute(lookup(libc::RTLD_DEFAULT, c"drmModeFreeResources")?) };
    let get_crtc: GetCrtcFn = unsafe { std::mem::transmute(lookup(libc::RTLD_DEFAULT, c"drmModeGetCrtc")?) };
    let free_crtc: FreeCrtcFn = unsafe { std::mem::transmute(lookup(libc::RTLD_DEFAULT, c"drmModeFreeCrtc")?) };
    unsafe {
        let res = get_res(fd);
        if res.is_null() {
            return None;
        }
        let crtc_id = if (index as c_int) < (*res).count_crtcs && !(*res).crtcs.is_null() {
            Some(*(*res).crtcs.add(index as usize))
        } else {
            None
        };
        free_res(res);
        let crtc = get_crtc(fd, crtc_id?);
        if crtc.is_null() {
            return None;
        }
        let m = &(*crtc).mode;
        let period = if (*crtc).mode_valid != 0 { frame_period(m.clock, m.htotal, m.vtotal, m.vscan) } else { None };
        free_crtc(crtc);
        period
    }
}

fn period_for(fd: c_int, index: u32) -> Option<Duration> {
    static PERIODS: Mutex<Vec<(u32, Option<Duration>)>> = Mutex::new(Vec::new());
    if let Some((_, p)) = PERIODS.lock().unwrap().iter().find(|(i, _)| *i == index) {
        return *p;
    }
    let p = query_period(fd, index);
    PERIODS.lock().unwrap().push((index, p));
    p
}

/// Ticks every `period` from a fixed start. Returns how long to sleep for the
/// `n`-th tick from now (0 = the current one, no wait) and that tick's number.
fn next_tick(start: Instant, now: Instant, period: Duration, n: u32) -> (Duration, u64) {
    let elapsed = now.saturating_duration_since(start).as_nanos() as u64;
    let p = period.as_nanos() as u64;
    let current = elapsed / p;
    let target = current + u64::from(n);
    let wait = (target * p).saturating_sub(elapsed);
    (Duration::from_nanos(wait), target)
}

fn emulate(fd: c_int, vbl: &mut DrmVBlank) -> Option<()> {
    static STARTS: Mutex<Option<HashMap<u32, Instant>>> = Mutex::new(None);
    let req = unsafe { vbl.request };
    let index = crtc_index(req.kind);
    let period = period_for(fd, index)?;
    let start = *STARTS.lock().unwrap().get_or_insert_with(HashMap::new).entry(index).or_insert_with(Instant::now);
    // Relative asks for `sequence` refreshes from now; WebKit's absolute
    // requests mean "the next one", which is all a free-running clock can offer.
    let n = if req.kind & DRM_VBLANK_RELATIVE != 0 { req.sequence } else { 1 };
    let (wait, tick) = next_tick(start, Instant::now(), period, n);
    if !wait.is_zero() {
        std::thread::sleep(wait);
    }
    let mut ts = libc::timespec { tv_sec: 0, tv_nsec: 0 };
    unsafe { libc::clock_gettime(libc::CLOCK_MONOTONIC, &mut ts) };
    vbl.reply = VBlankReply {
        kind: req.kind,
        sequence: (tick + SEQUENCE_OFFSET) as u32,
        tval_sec: ts.tv_sec as c_long,
        tval_usec: (ts.tv_nsec / 1000) as c_long,
    };
    Some(())
}

/// Replaces libdrm's function for this process; see the module docs.
///
/// # Safety
/// Same contract as libdrm's `drmWaitVBlank`: `vbl` points to a valid `drmVBlank`.
#[no_mangle]
pub unsafe extern "C" fn drmWaitVBlank(fd: c_int, vbl: *mut DrmVBlank) -> c_int {
    let Some(real) = real_wait() else {
        *libc::__errno_location() = libc::ENOSYS;
        return -1;
    };
    if vbl.is_null() || !enabled() {
        return real(fd, vbl);
    }
    let req = (*vbl).request;
    let ret = real(fd, vbl);
    if ret == 0 || req.kind & (DRM_VBLANK_EVENT | DRM_VBLANK_SIGNAL) != 0 {
        return ret;
    }
    let errno = *libc::__errno_location();
    // EPERM means the screen is off; WebKit handles that itself.
    if errno == libc::EPERM || errno == libc::EINTR {
        return ret;
    }
    // The real call may have rewritten the request; put it back before emulating.
    (*vbl).request = req;
    match emulate(fd, &mut *vbl) {
        Some(()) => 0,
        None => {
            *libc::__errno_location() = errno;
            ret
        }
    }
}

/// Turns off WebKit's "round to about 60 fps" preference for this webview.
/// The feature API arrived in WebKitGTK 2.42; on older versions this does nothing.
pub fn allow_full_refresh(settings: *mut c_void) {
    type AllFeatures = unsafe extern "C" fn() -> *mut c_void;
    type ListLen = unsafe extern "C" fn(*mut c_void) -> usize;
    type ListGet = unsafe extern "C" fn(*mut c_void, usize) -> *mut c_void;
    type Identifier = unsafe extern "C" fn(*mut c_void) -> *const c_char;
    type SetEnabled = unsafe extern "C" fn(*mut c_void, *mut c_void, c_int);
    type Unref = unsafe extern "C" fn(*mut c_void);

    let sym = |name: &CStr| lookup(libc::RTLD_DEFAULT, name);
    let (Some(all), Some(len), Some(get), Some(ident), Some(set), Some(unref)) = (
        sym(c"webkit_settings_get_all_features"),
        sym(c"webkit_feature_list_get_length"),
        sym(c"webkit_feature_list_get"),
        sym(c"webkit_feature_get_identifier"),
        sym(c"webkit_settings_set_feature_enabled"),
        sym(c"webkit_feature_list_unref"),
    ) else {
        return;
    };
    unsafe {
        let all: AllFeatures = std::mem::transmute(all);
        let len: ListLen = std::mem::transmute(len);
        let get: ListGet = std::mem::transmute(get);
        let ident: Identifier = std::mem::transmute(ident);
        let set: SetEnabled = std::mem::transmute(set);
        let unref: Unref = std::mem::transmute(unref);
        let list = all();
        if list.is_null() {
            return;
        }
        for i in 0..len(list) {
            let feature = get(list, i);
            let id = ident(feature);
            if !id.is_null() && CStr::from_ptr(id).to_bytes() == b"PreferPageRenderingUpdatesNear60FPSEnabled" {
                set(settings, feature, 0);
            }
        }
        unref(list);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mode_timings_give_the_refresh_period() {
        // 2560x1440 @ 165 Hz: 645 MHz pixel clock, 2720 x 1437 total -> 6.06 ms.
        let p = frame_period(645_000, 2720, 1437, 0).unwrap();
        assert!((6_050_000..6_070_000).contains(&(p.as_nanos() as u64)), "{p:?}");
        // 1920x1080 @ 60: 148.5 MHz, 2200 x 1125 -> 16.67 ms.
        let p = frame_period(148_500, 2200, 1125, 0).unwrap();
        assert_eq!(p.as_micros(), 16_666);
        assert!(frame_period(0, 2200, 1125, 0).is_none());
    }

    #[test]
    fn ticks_land_on_the_grid() {
        let start = Instant::now();
        let period = Duration::from_millis(6);
        let (wait, tick) = next_tick(start, start + Duration::from_millis(13), period, 1);
        assert_eq!((wait, tick), (Duration::from_millis(5), 3));
        let (wait, tick) = next_tick(start, start + Duration::from_millis(13), period, 0);
        assert_eq!((wait, tick), (Duration::ZERO, 2));
        let (wait, _) = next_tick(start, start + Duration::from_millis(12), period, 1);
        assert_eq!(wait, Duration::from_millis(6));
    }

    #[test]
    fn crtc_bits_decode() {
        assert_eq!(crtc_index(DRM_VBLANK_RELATIVE), 0);
        assert_eq!(crtc_index(DRM_VBLANK_RELATIVE | DRM_VBLANK_SECONDARY), 1);
        assert_eq!(crtc_index(DRM_VBLANK_RELATIVE | (3 << DRM_VBLANK_HIGH_CRTC_SHIFT)), 3);
    }
}
