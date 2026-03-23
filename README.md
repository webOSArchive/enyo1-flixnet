# FlixNet

![Flixnet Icon](enyo-app/icon.png)

Flixnet client for legacy Palm/HP webOS devices, and PWA platforms, depends on back-end service listed below.

Tested on Pre3 and Touchpad.

Uses [Flixnet Service](https://github.com/webOSArchive/flixnet-service) which leverages a list of Public Domain movies that have been archived by the Internet Archive, and is hosted by [webOSArchive](http://www.webosarchive.org) for the webOS community without guarantee of privacy or performance. Illegal or illicit use strictly prohibited. 

You can also self-host the services, see the [instructions here](https://github.com/webOSArchive/flixnet-service).

## What is This?

This is an app for the defunct mobile webOS platform, made by Palm and later acquired by HP. It runs on devices like the Palm Pre or Pixi, or the HP Pre3 or TouchPad. 

webOS technology was acquired by LG and repurposed for TVs and IoT devices, but they made significant changes and this app will not run on those platforms.

Releases of this app, and many other new and restored apps, can be found in the [webOS Archive App Museum](http://appcatalog.webosarchive.org).

## Why?

Aside from being a fan of the platform, the author thinks consumers have lost out now that the smart phone ecosystem has devolved into a duopoly.
Apple and Google take turns copying each other, and consumers line up to buy basically the same new phone every year. The era when webOS, Blackberry and Windows Phone were serious competitors was marked by creativity in form factor and software development, which has been lost. This app represents a (futile) attempt to keep webOS mobile devices useful for as long as possible.

The website [http://www.webosarchive.org](http://www.webosarchive.org) recovers, archives and maintains material related to development, and hosts services that restore functionality to webOS devices. A small but active [community](http://www.webosarchive.org/discord) of users take advantage of these services to keep their retro devices alive.

## How?

Mobile webOS was truly a web-derived platform. Based on Linux, and able to run properly compiled Linux binaries, developers could get raw resources access (including GPU) through a PDK (Plug-in Development Kit) but most apps were written in some flavor of Javascript, interacting with a WebKit-based browser. The toolkits were heavily optimized for the devices, and web-based apps usually felt pretty close to native. Services could be written using NodeJS and talk to each other through API calls structured to look like web service calls. App front-ends were usually written in either the Mojo (pre-tablet) or Enyo (tablet and newer phones) Javascript frameworks. Enyo apps can often be run with only minor modification in any WebKit based browser (eg: Safari or Chrome).

You can learn more about these frameworks at the restored [SDK](http://sdk.webosarchive.org).

webOS devices can be found cheaply on eBay, and while the phones will cease to be useful as phones when the 3G shutdown is through, both the phones and the Touchpad can be used around the home for a variety of [fun and useful things](http://www.webosarchive.org/docs/thingstotry/).

If you have a device, instructions for activating, getting online and getting apps installed can be found in the [webOS Archive Docs section](http://www.webosarchive.org/docs/activate/).

## The Bootplate

This app that is based on a [Enyo1 bootplate](https://github.com/webosarchive/enyo1-bootplate) -- a template for a minimal Enyo1 web application.
You would normally use this to setup your local environment then go and modify the files to build your own application.

Enyo was an open-source Javascript framework created for the Palm/HP TouchPad, and was later replaced with the cross platform [Enyo2](https://github.com/enyojs/enyo) (aka EnyoJS). While Enyo 1.0 was designed for webOS devices, with a few considerations, apps can run on LuneOS, in Chrome (or Chromium-based) browsers on the web, or with a little help from a Cordova wrapper, on modern Android phones.

If you want run webOS apps on other browsers (and you really [should stop using Chromium](https://www.theverge.com/2018/1/4/16805216/google-chrome-only-sites-internet-explorer-6-web-standards)), check out the [Enyo2 Bootplate](https://github.com/webosarchive/enyo2-bootplate).

You can learn more about legacy webOS at [webOS Archive](http://www.webosarchive.org/) or by exploring my other repos.
