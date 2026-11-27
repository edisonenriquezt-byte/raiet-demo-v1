"""Publish a signed build using a dedicated restricted Supabase Auth account.
Run only in a separate publication job. Never use an administrator/service_role key."""
import base64
import hashlib
import json
import os
import pathlib
import re
import sys
import time
import urllib.error
import urllib.request

base = os.environ["RAIET_STORAGE_URL"].rstrip("/")
if not re.fullmatch(r"https://[a-z0-9]+\.supabase\.co", base):
    raise SystemExit("Invalid storage origin")
key = os.environ["RAIET_STORAGE_PUBLIC_KEY"]
def is_public_key(value):
    if re.fullmatch(r"sb_publishable_[A-Za-z0-9_-]+", value):
        return True
    try:
        parts = value.split(".")
        if len(parts) != 3:
            return False
        payload = parts[1] + "=" * (-len(parts[1]) % 4)
        return json.loads(base64.urlsafe_b64decode(payload)).get("role") == "anon"
    except (ValueError, TypeError, AttributeError):
        return False

if not is_public_key(key):
    raise SystemExit("Only a publishable or legacy anon key is accepted")
publisher = os.environ["RAIET_PUBLISHER_UID"]
email = os.environ["RAIET_PUBLISHER_EMAIL"]
password = os.environ["RAIET_PUBLISHER_PASSWORD"]
if not re.fullmatch(r"[a-fA-F0-9]{8}(?:-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}", publisher):
    raise SystemExit("Invalid dedicated publisher identity")
if base != "https://lhqyibxpstrterlckaax.supabase.co":
    raise SystemExit("Unexpected DEMO storage origin")
bucket = "raiet-demo-versiones-android"
root = base + "/storage/v1/object/"
manifest = json.loads(pathlib.Path("latest.json").read_text())
apk = pathlib.Path("RAIET-DEMO.apk").read_bytes()
version = manifest.get("versionCode")
if type(version) is not int or version < 1 or manifest.get("applicationId") != "com.esabas.raiet.demo":
    raise SystemExit("Invalid official release manifest")
route = f"versions/{version}/RAIET-DEMO.apk"
if manifest.get("apk") != route or hashlib.sha256(apk).hexdigest() != manifest.get("sha256"):
    raise SystemExit("APK does not match manifest")
if len(apk) > 25 * 1024 * 1024:
    raise SystemExit("APK exceeds configured bucket limit")

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

opener = urllib.request.build_opener(NoRedirect())

def request(url, method="GET", data=None, token=None, mime=None, upsert=False):
    if not url.startswith(base + "/"):
        raise SystemExit("Refusing request outside the storage origin")
    headers = {"apikey": key}
    if token:
        headers["Authorization"] = "Bearer " + token
    if method == "GET":
        headers["Cache-Control"] = "no-cache"
        headers["Pragma"] = "no-cache"
    if mime:
        headers["Content-Type"] = mime
    if method == "POST" and "/storage/" in url:
        headers["x-upsert"] = "true" if upsert else "false"
        headers["Cache-Control"] = "no-cache"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with opener.open(req, timeout=90) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read()

def missing(status, body):
    if status == 404:
        return True
    if status == 400:
        try:
            obj = json.loads(body)
            return str(obj.get("error", "")).lower() in ("not found", "object not found") or str(obj.get("message", "")).lower() == "object not found"
        except (ValueError, AttributeError):
            return False
    return False

status, body = request(base + "/auth/v1/token?grant_type=password", "POST",
    json.dumps({"email":email,"password":password}).encode(), mime="application/json")
if status != 200:
    raise SystemExit(f"Publisher authentication failed: HTTP {status}")
session = json.loads(body)
if session.get("user", {}).get("id") != publisher:
    raise SystemExit("Unexpected publisher account")
token = session["access_token"]
print("::add-mask::" + token, flush=True)
refresh = session.get("refresh_token")
if refresh:
    print("::add-mask::" + refresh, flush=True)
status, body = request(base + "/rest/v1/rpc/demo_acceso_habilitado", "POST", b"{}", token, "application/json")
if status != 200 or json.loads(body) is not False:
    request(base + "/auth/v1/logout?scope=local", "POST", token=token)
    raise SystemExit("Publisher must not be an authorized application user")
def get(name):
    return request(root + "authenticated/" + bucket + "/" + name, token=token)
def put(name, content, mime, upsert=False):
    status, _ = request(root + bucket + "/" + name, "POST", content, token, mime, upsert)
    if status not in (200, 201):
        raise SystemExit(f"Storage upload failed: HTTP {status}")
status, body = get("latest.json")
if status == 200:
    previous = json.loads(body).get("versionCode")
    if type(previous) is not int or previous > version:
        raise SystemExit("Refusing to replace newer or malformed manifest")
elif not missing(status, body):
    raise SystemExit(f"Cannot inspect current release: HTTP {status}")
status, body = get(route)
if missing(status, body):
    put(route, apk, "application/vnd.android.package-archive")
elif status != 200 or hashlib.sha256(body).hexdigest() != manifest["sha256"]:
    raise SystemExit("Existing release differs or cannot be read")
status, body = get(route)
if status != 200 or hashlib.sha256(body).hexdigest() != manifest["sha256"]:
    raise SystemExit("Uploaded APK verification failed")
# Advance manifest only after verifying the complete immutable APK.
try:
    put("latest.json", json.dumps(manifest, separators=(",", ":")).encode(), "application/json", True)
    # El almacenamiento puede servir temporalmente la versión anterior tras un upsert.
    # No volver a escribir el objeto durante la comprobación.
    for delay in (0, 2, 4, 8, 16, 30):
        if delay:
            time.sleep(delay)
        status, body = get("latest.json")
        if status == 200:
            received = json.loads(body)
            if received == manifest:
                print("Verified private release:", version)
                break
            if type(received.get("versionCode")) is int and received["versionCode"] > version:
                raise SystemExit("A newer private release is already present")
    else:
        raise SystemExit("Private manifest verification failed after bounded retries")
finally:
    status, _ = request(base + "/auth/v1/logout?scope=local", "POST", token=token)
    if status not in (200, 204):
        print("Publisher session logout could not be confirmed", file=sys.stderr)
