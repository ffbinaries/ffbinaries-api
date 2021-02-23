# FFbinaries.com


[![FFbinaries.com](https://img.shields.io/website-up-down-green-red/https/ffbinaries.com.svg?label=ffbinaries.com)](https://ffbinaries.com)

Web API running on [FFbinaries.com](https://ffbinaries.com).

It provides links to precompiled binaries of FFmpeg suite for Linux, Mac and Windows.


## Running the server locally

You can run a local copy of the API with `node .`.

Specify port with `-port`, networking (local/private/public) with `-network`
and base url with `-url`.


## Command line client

There's a CLI client available for this at https://www.npmjs.com/package/ffbinaries

## Binaries used

All binaries provided by FFbinaries are hosted on GitHub
(https://github.com/ffbinaries/ffbinaries-prebuilt/releases) and are simply repackaged
versions of packages provided by other people (see Credits section).

Repackaging was done in order to provide consistent archive format
and ship all components as individual downloads.

## Online documentation

* [ffmpeg](http://ffmpeg.org/ffmpeg.html)
* [ffplay](http://ffmpeg.org/ffplay.html)
* [ffprobe](http://ffmpeg.org/ffprobe.html)
* [ffserver](http://ffmpeg.org/ffserver.html)


## Credits

Original binaries compiled by:

* OS X version: [https://evermeet.cx/ffmpeg/](https://evermeet.cx/ffmpeg/)
* Linux version: [http://johnvansickle.com/ffmpeg/](http://johnvansickle.com/ffmpeg/)
* Windows version: [http://ffmpeg.zeranoe.com/builds/](http://ffmpeg.zeranoe.com/builds/)


## Licences

This project provides precompiled binaries only.

Please respect the licences of all software here - see http://ffmpeg.org/legal.html.
