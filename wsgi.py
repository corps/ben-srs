#!/usr/bin/env python
import logging

from sentry_sdk.integrations.flask import FlaskIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
import os.path
import sentry_sdk

sentry_dsn_path = "/run/secrets/bensrs-dsn"

if os.path.exists(sentry_dsn_path):
    print(f"initializing with secret from {sentry_dsn_path}")
    # Ensure that warnings are enabled
    os.environ["PYTHONWARNINGS"] = "default"

    # Ensure that logging captures warnings issued by warnings.warn()
    logging.captureWarnings(True)

    with open(sentry_dsn_path, "r") as file:
        sentry_sdk.init(
            dsn=file.read().strip(),
            traces_sample_rate=1.0,
            integrations=[
                FlaskIntegration(),
                LoggingIntegration(
                    level=logging.INFO,
                    event_level=logging.WARNING,
                ),
            ],
        )

from .src.server.endpoints import *

with app.open_store():
    app.store.migrate()

if __name__ == "__main__":
    app.run()
