#!/usr/bin/env python3
"""Lifts Flutter's 60 fps cap on Linux.

The GTK embedder gives the engine no vsync source, so the engine falls back to
VsyncWaiterFallback, which ticks every 1/60 s whatever the monitor does
(engine/src/flutter/shell/common/vsync_waiter_fallback.cc). This rewrites that
interval in a built bundle's libflutter_linux_gtk.so.

The interval is a compile-time constant: it appears as three immediates plus
the magic multiplier and shift the compiler uses for `% interval`. All of them
are recomputed for the new interval and checked against real division before
anything is written.

Usage: tool/patch_linux_vsync.py build/linux/x64/release/bundle 165
"""
import random
import struct
import sys
from pathlib import Path

OLD_NS = 16_666_666  # int64(1e9 / 60), what FromSecondsF(1.0 / 60.0) gives

# The modulo in AwaitVSync, from `movabs magic, %rdx` to `imul $interval`:
#   48 ba <magic:8>  48 89 f0  48 f7 ea  48 01 f2  48 89 d0
#   48 c1 e8 3f  48 c1 fa <shift:1>  48 01 c2  48 69 c2 <interval:4>
PREFIX = b"\x48\xba"
MIDDLE = b"\x48\x89\xf0\x48\xf7\xea\x48\x01\xf2\x48\x89\xd0\x48\xc1\xe8\x3f\x48\xc1\xfa"
AFTER_SHIFT = b"\x48\x01\xc2\x48\x69\xc2"


def magic(d: int, w: int = 64) -> tuple[int, int]:
    """Signed division magic number and shift (Hacker's Delight, 10-1)."""
    two = 1 << (w - 1)
    anc = two - 1 - two % d
    p = w - 1
    q1, r1 = divmod(two, anc)
    q2, r2 = divmod(two, d)
    while True:
        p += 1
        q1, r1 = 2 * q1, 2 * r1
        if r1 >= anc:
            q1, r1 = q1 + 1, r1 - anc
        q2, r2 = 2 * q2, 2 * r2
        if r2 >= d:
            q2, r2 = q2 + 1, r2 - d
        delta = d - r2
        if not (q1 < delta or (q1 == delta and r1 == 0)):
            break
    return (q2 + 1) % (1 << w), p - w


def emulate(n: int, m: int, s: int) -> int:
    """The machine code's quotient: high half of n*m (signed), plus n, >> s, plus sign bit."""
    ms = m - (1 << 64) if m >= 1 << 63 else m
    hi = (n * ms) >> 64
    hi += n
    hi = ((hi + (1 << 63)) % (1 << 64)) - (1 << 63)  # wrap like a register
    return (hi >> s) + (1 if hi < 0 else 0)


def fits(d: int) -> tuple[int, int] | None:
    m, s = magic(d)
    # The code adds the numerator back, which is only right when the magic
    # number is >= 2^63; otherwise the compiler would have emitted other code.
    if m < 1 << 63 or not 0 < s < 64:
        return None
    rnd = random.Random(d)
    samples = [0, 1, -1, d, -d, d - 1, 1 - d, 10**15, -(10**15)] + [rnd.randint(-(10**16), 10**16) for _ in range(20000)]
    for n in samples:
        q = abs(n) // d * (1 if n >= 0 else -1)  # C truncating division
        if emulate(n, m, s) != q:
            return None
    return m, s


def main() -> None:
    bundle, hz = Path(sys.argv[1]), float(sys.argv[2])
    lib = bundle / "lib" / "libflutter_linux_gtk.so"
    data = bytearray(lib.read_bytes())

    old_m, old_s = magic(OLD_NS)
    old_seq = PREFIX + struct.pack("<Q", old_m) + MIDDLE + bytes([old_s]) + AFTER_SHIFT + struct.pack("<I", OLD_NS)
    at = data.find(old_seq)
    if at < 0 or data.find(old_seq, at + 1) >= 0:
        sys.exit("vsync code not found exactly once; this engine build is not patchable")

    target = round(1e9 / hz)
    for d in sorted(range(target - 2000, target + 2000), key=lambda x: abs(x - target)):
        found = fits(d)
        if found:
            break
    else:
        sys.exit("no interval near the target fits the existing code")
    m, s = found

    # The interval also appears twice right after the modulo (lea, add).
    window = data[at : at + 160]
    old_imm = struct.pack("<I", OLD_NS)
    if window.count(old_imm) != 3:
        sys.exit(f"expected 3 copies of the interval near the modulo, found {window.count(old_imm)}")
    new_seq = PREFIX + struct.pack("<Q", m) + MIDDLE + bytes([s]) + AFTER_SHIFT + struct.pack("<I", d)
    data[at : at + len(new_seq)] = new_seq
    window = data[at : at + 160].replace(old_imm, struct.pack("<I", d))
    data[at : at + 160] = window

    lib.write_bytes(data)
    print(f"frame interval {OLD_NS} ns -> {d} ns ({1e9 / d:.2f} Hz) in {lib}")


if __name__ == "__main__":
    main()
