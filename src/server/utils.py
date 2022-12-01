import io
from typing import Iterable, cast


class IterStream(io.RawIOBase):
    def __init__(self, iterable: Iterable[bytes]):
        self.iterator = iter(iterable)
        self.leftover = None

    def readable(self):
        return True

    def readinto(self, b):
        try:
            l = len(b)  # We're supposed to return at most this much
            chunk = self.leftover or next(self.iterator)
            output, self.leftover = chunk[:l], chunk[l:]
            b[: len(output)] = output
            return len(output)

        except StopIteration:
            return 0


def iterable_to_stream(
    iterable: Iterable[bytes], buffer_size=io.DEFAULT_BUFFER_SIZE
) -> io.BytesIO:
    return cast(
        io.BytesIO, io.BufferedReader(IterStream(iterable), buffer_size=buffer_size)
    )
