#!/usr/bin/env python3
"""Log in to Hugging Face while forcing IPv4 DNS resolution on Windows.

Some Windows networks resolve huggingface.co over IPv6 first and reset the TLS
connection. This helper keeps the token out of shell history and uses the same
`huggingface_hub.login(...)` storage as the normal `hf auth login` command.
"""

from __future__ import annotations

import getpass
import socket


def force_ipv4() -> None:
    original_getaddrinfo = socket.getaddrinfo

    def ipv4_getaddrinfo(*args, **kwargs):
        return [info for info in original_getaddrinfo(*args, **kwargs) if info[0] == socket.AF_INET]

    socket.getaddrinfo = ipv4_getaddrinfo  # type: ignore[assignment]


def main() -> int:
    force_ipv4()

    from huggingface_hub import HfApi, login

    token = getpass.getpass("Paste Hugging Face token: ")
    login(token=token, add_to_git_credential=False)
    user = HfApi().whoami(token=token)
    print(f"Logged in as: {user.get('name') or user.get('fullname') or user.get('email')}")

    try:
        HfApi().model_info("google/functiongemma-270m-it", token=token)
        print("Verified access to google/functiongemma-270m-it")
    except Exception as exc:
        print(f"Login worked, but model access check failed: {type(exc).__name__}: {exc}")
        print("Make sure you accepted the model license on Hugging Face.")
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
