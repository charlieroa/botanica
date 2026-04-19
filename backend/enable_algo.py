"""Modifica common.ini del terminal MT5 para forzar AutoTrading.

El terminal en C:\\Program Files\\MetaTrader 5\\ tiene su config en:
  %APPDATA%\\MetaQuotes\\Terminal\\D0E8209F77C8CF37AD8BF550E51FF075\\config\\common.ini

Claves a cambiar en [Experts]:
  Enabled=1           (activa AutoTrading del terminal)
  AllowDllImport=1    (permite imports de DLL)
"""
import os
import re
from pathlib import Path


def patch_common_ini(ini_path: Path) -> dict:
    if not ini_path.exists():
        return {"ok": False, "error": f"no existe {ini_path}"}

    raw = ini_path.read_bytes()
    # detectar BOM UTF-16 LE
    is_utf16 = raw.startswith(b"\xff\xfe")
    encoding = "utf-16-le" if is_utf16 else "utf-8"

    text = raw.decode(encoding, errors="strict")
    if is_utf16:
        # descartar BOM al inicio
        if text.startswith("\ufeff"):
            text = text[1:]

    original = text
    changes = []

    def replace(pattern: str, repl: str, label: str):
        nonlocal text
        new_text, n = re.subn(pattern, repl, text, flags=re.MULTILINE)
        if n > 0 and new_text != text:
            changes.append(label)
        text = new_text

    replace(r"^Enabled=0\s*$", "Enabled=1", "Experts.Enabled=1")
    replace(r"^AllowDllImport=0\s*$", "AllowDllImport=1", "Experts.AllowDllImport=1")

    if text == original:
        return {"ok": True, "changed": False, "message": "ya estaba activado"}

    # reescribir preservando encoding + BOM
    out = text.encode(encoding)
    if is_utf16:
        out = b"\xff\xfe" + out

    # backup
    backup = ini_path.with_suffix(".ini.bak")
    if not backup.exists():
        backup.write_bytes(raw)

    ini_path.write_bytes(out)
    return {"ok": True, "changed": True, "changes": changes, "backup": str(backup)}


if __name__ == "__main__":
    appdata = Path(os.environ["APPDATA"])
    base = appdata / "MetaQuotes" / "Terminal"
    # buscar el terminal que corresponde a C:\Program Files\MetaTrader 5
    target_hash = None
    for sub in base.iterdir():
        origin = sub / "origin.txt"
        if origin.exists():
            try:
                content = origin.read_bytes().decode("utf-16-le", errors="ignore")
                if "C:\\Program Files\\MetaTrader 5" in content and "Terminal" not in content.split("MetaTrader 5")[1][:10]:
                    target_hash = sub.name
                    break
            except Exception:
                continue

    if not target_hash:
        # fallback: el hash que ya sabemos
        target_hash = "D0E8209F77C8CF37AD8BF550E51FF075"

    ini = base / target_hash / "config" / "common.ini"
    print(f"Editando: {ini}")
    result = patch_common_ini(ini)
    print(result)
