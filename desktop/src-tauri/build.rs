fn main() {
    // Let WebKitGTK's calls to drmWaitVBlank land on ours (src/vblank.rs):
    // keep the symbol and put it in the executable's dynamic symbol table.
    if std::env::var("CARGO_CFG_TARGET_OS").as_deref() == Ok("linux") {
        println!("cargo:rustc-link-arg-bins=-Wl,--undefined=drmWaitVBlank");
        println!("cargo:rustc-link-arg-bins=-Wl,--export-dynamic-symbol=drmWaitVBlank");
    }
    tauri_build::build()
}
