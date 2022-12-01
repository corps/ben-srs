#!/usr/bin/env python
from .src.server.endpoints import *

with app.open_store():
    app.store.migrate()

if __name__ == "__main__":
    app.run()
