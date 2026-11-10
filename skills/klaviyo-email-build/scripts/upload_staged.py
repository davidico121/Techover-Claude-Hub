#!/usr/bin/env python3
"""POST files to Shopify staged-upload targets from the sandbox.
Usage: python3 -I upload_staged.py targets.json
targets.json = [{"src": "/abs/path/file.jpg", "ct": "image/jpeg", "key": "...", "date": "...",
                 "cred": "...", "sig": "...", "policy": "..."}]   (values copied EXACTLY from stagedUploadsCreate;
                 "acl" is always private, algorithm GOOG4-RSA-SHA256, success_action_status 201)
Prints HTTP status per file; 201 = success.
"""
import json, subprocess, sys, os
for t in json.load(open(sys.argv[1])):
    cmd = ["curl", "-sS", "-o", "/dev/null", "-w", os.path.basename(t["src"]) + " %{http_code}\n",
           "https://shopify-staged-uploads.storage.googleapis.com/",
           "-F", "Content-Type=" + t["ct"], "-F", "success_action_status=201", "-F", "acl=private",
           "-F", "key=" + t["key"], "-F", "x-goog-date=" + t["date"], "-F", "x-goog-credential=" + t["cred"],
           "-F", "x-goog-algorithm=GOOG4-RSA-SHA256", "-F", "x-goog-signature=" + t["sig"],
           "-F", "policy=" + t["policy"], "-F", "file=@" + t["src"]]
    r = subprocess.run(cmd, capture_output=True, text=True)
    print(r.stdout.strip() or ("ERR " + r.stderr.strip()[:200]))
