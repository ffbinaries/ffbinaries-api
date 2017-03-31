# ffbinaries.com

This is the small API running on ffbinaries.com


# Components

The components of the ffmpeg suite are: ffmpeg, ffprobe, ffserver and ffplay.

|          | Mac | Linux | Windows |
|----------|-----|-------|---------|
| ffmpeg   | v   | v     | v       |
| ffprobe  | v   | v     | v       |
| ffserver | v   | v     |         |
| ffplay   | v   | v*    | v       |

* Only linux-32 and linux-64 builds are available for ffplay


## Running the server locally

You can run a local copy of it with `node .`.

You may want to update the `BASEDIR` in `constants.js` for API to serve correct links.


## Command line client

There's a CLI client available for this at https://www.npmjs.com/package/ffbinaries


## Binaries used

All binaries provided by ffbinaries are hosted on GitHub
(https://github.com/vot/ffbinaries-prebuilt/releases) and are simply repackaged
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
