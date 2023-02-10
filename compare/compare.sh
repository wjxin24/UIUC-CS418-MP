#!/bin/bash

py "../MP$1/main.py" "../MP$1/mp$1files/mp$1$2.txt"
student="mp$1$2.png"
ref="../MP$1/mp$1files/mp$1$2.png"
magick compare -fuzz 2% $student $ref ae.png
magick composite $student $ref -alpha off -compose difference rawdiff.png
magick convert rawdiff.png -level 0%,8% diff.png
magick convert +append $ref $student ae.png rawdiff.png diff.png look_at_this.png
code look_at_this.png