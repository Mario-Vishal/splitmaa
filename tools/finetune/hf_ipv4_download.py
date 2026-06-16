#!/usr/bin/env python3
"""Download Hugging Face model files while forcing IPv4 on Windows."""

from __future__ import annotations

import argparse
import os
import socket
from pathlib import Path


def force_ipv4() -> None:
    original_getaddrinfo = socket.getaddrinfo

    def ipv4_getaddrinfo(*args, **kwargs):
        return [info for info in original_getaddrinfo(*args, **kwargs) if info[0] == socket.AF_INET]

    socket.getaddrinfo = ipv4_getaddrinfo  # type: ignore[assignment]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-id", default="google/functiongemma-270m-it")
    parser.add_argument("--revision", default=None)
    parser.add_argument("--local-dir", type=Path, default=None)
    parser.add_argument("--max-workers", type=int, default=1)
    parser.add_argument("--all-files", action="store_true", help="Download every file in the repo, including LiteRT artifacts.")
    parser.add_argument("--no-force-ipv4", action="store_true")
    args = parser.parse_args()

    os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")
    os.environ.setdefault("HF_HUB_ENABLE_HF_TRANSFER", "0")

    if not args.no_force_ipv4:
        force_ipv4()

    from huggingface_hub import snapshot_download

    kwargs: dict[str, object] = {
        "repo_id": args.repo_id,
        "max_workers": args.max_workers,
    }
    if args.revision:
        kwargs["revision"] = args.revision
    if args.local_dir:
        kwargs["local_dir"] = str(args.local_dir)
    if not args.all_files:
        kwargs["ignore_patterns"] = ["*.litertlm", "*.task"]

    print(f"Downloading {args.repo_id} with max_workers={args.max_workers}...")
    path = snapshot_download(**kwargs)
    print(f"Downloaded snapshot: {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
