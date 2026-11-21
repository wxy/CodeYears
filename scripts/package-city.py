"""Package a fresh npm build. Requires Python 3; does not publish or upload."""

import argparse
import filecmp
import hashlib
import json
import os
import re
from pathlib import Path
from tempfile import TemporaryDirectory
from zipfile import ZIP_DEFLATED, ZIP_STORED, ZipFile, ZipInfo

root = Path(__file__).resolve().parents[1]
dist = root / "dist"
package = json.loads((root / "package.json").read_text())
manifest = json.loads((dist / "manifest.json").read_text())
version = manifest["version"]
if not re.fullmatch(r"(?:0|[1-9][0-9]{0,4})(?:\.(?:0|[1-9][0-9]{0,4})){0,3}", version):
    raise SystemExit("Invalid Chrome extension version")
parts = [int(part) for part in version.split(".")]
if not any(parts) or max(parts) > 65535 or package["version"] != version:
    raise SystemExit("Version must be nonzero, valid and match package.json")
if manifest["permissions"] != ["activeTab", "scripting", "storage"] or manifest.get("host_permissions"):
    raise SystemExit("Review changed permissions before packaging")
if manifest.get("content_scripts") != [{"matches": ["https://github.com/*"], "js": ["entry.js"], "run_at": "document_idle"}]:
    raise SystemExit("Review changed automatic entry scope before packaging")

if "options_ui" in manifest or manifest["action"].get("default_popup") != "popup.html":
    raise SystemExit("Settings must be served by the toolbar popup")

# An explicit distribution list excludes repository material, source maps and local data.
files = {name: dist / name for name in ("manifest.json", "popup.html", "entry.js", "content.js", "landscape.js", "calendar.js")}
for locale in ("en", "zh_CN"):
    name = f"_locales/{locale}/messages.json"
    files[name] = dist / name
for pattern in ("assets/popup-*.js", "assets/shared-*.js", "assets/city/*.png", "assets/calendar/*.webp", "chunks/*.js"):
    files.update((path.relative_to(dist).as_posix(), path) for path in dist.glob(pattern))
for table in (manifest["icons"], manifest["action"]["default_icon"]):
    files.update((name, dist / name) for name in table.values())
for name in ("LICENSE", "THIRD_PARTY_NOTICES.md", "ASSETS.md", "PRIVACY.md"):
    files[name] = root / name
missing = [name for name, path in files.items() if not path.is_file()]
if missing:
    raise SystemExit(f"Missing distribution files: {missing}")

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--output-dir", type=Path, default=root / "release")
release = parser.parse_args().output_dir.resolve()
release.mkdir(parents=True, exist_ok=True)
archive = release / f"codeyears-{version}-city.zip"
checksum = archive.with_suffix(".zip.sha256")

def install_once(source, destination):
    """Install a complete file without replacing another build with the same version."""
    try:
        os.link(source, destination)
    except FileExistsError:
        if not filecmp.cmp(source, destination, shallow=False):
            raise SystemExit(f"Existing file differs: {destination}. Choose a new version or --output-dir.")


with TemporaryDirectory(dir=release) as directory:
    candidate = Path(directory) / archive.name
    with ZipFile(candidate, "w") as output:
        for name, path in sorted(files.items()):
            info = ZipInfo(name, (1980, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            output.writestr(info, path.read_bytes(), compress_type=ZIP_STORED if name.endswith(".png") else ZIP_DEFLATED, compresslevel=9)
    with ZipFile(candidate) as output:
        if output.testzip() is not None:
            raise SystemExit("ZIP integrity check failed")
    digest = hashlib.sha256(candidate.read_bytes()).hexdigest()
    checksum_bytes = f"{digest}  {archive.name}\n".encode()
    if checksum.exists() and checksum.read_bytes() != checksum_bytes:
        raise SystemExit(f"Existing checksum differs: {checksum}. Choose a new version or --output-dir.")
    install_once(candidate, archive)
    candidate_checksum = Path(directory) / checksum.name
    candidate_checksum.write_bytes(checksum_bytes)
    install_once(candidate_checksum, checksum)
print(f"{archive}: {len(files)} files, {archive.stat().st_size:,} bytes, SHA-256 {digest}")
