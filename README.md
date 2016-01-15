# Nyaplot
[![Build Status](https://travis-ci.org/domitry/nyaplot.svg?branch=master)](https://travis-ci.org/domitry/nyaplot)
[![Gem Version](https://badge.fury.io/rb/nyaplot.svg)](http://badge.fury.io/rb/nyaplot)

![alt text](https://dl.dropboxusercontent.com/u/47978121/gsoc/nya_top.png)

Nyaplot is an interactive plots generator for Ruby users. Its goal is to make it easy to create interactive plots in Ruby and still allows fast prototyping, customizability, and the integration with other scientific gems.

Nyaplot is a compound word from 'Nya' and 'plot.' The word 'Nya' comes from an onomatopoeia of cat's meow in Japanese.

This software has been developed as a product in Google Summer of Code 2014 (GSoC2014). Visit the [website]((http://sciruby.com/blog/)) or [mailing list](https://groups.google.com/forum/#!forum/sciruby-dev) of SciRuby to see the progress of this project.

**Attention: Nyaplotjs was banned by rawgit.js and nyaplot v0.1.3 was released to fix that. Please update your nyaplot and re-excute each notebooks.**

## Demo

+ [Movie demo on YouTube](https://www.youtube.com/watch?v=ZxjqsIluM88)
+ [Nyaplot Tutorial & Case study](http://nbviewer.ipython.org/github/domitry/nyaplot/blob/master/examples/notebook/Index.ipynb)

Visit [nyaplot-notebooks on GitHub](https://github.com/domitry/nyaplot-notebooks) to see more example.

## Documents

Documents are [here](http://rubydoc.info/github/domitry/nyaplot/master/frames).

## Extensions

Nyaplot has an extension system to make it easy to add more normal and different types of diagrams.
Libraries shown below are already bundled with this gem and you can use them by adding 'require'.

Each extension consists of its back-end written in JavaScript and a small Ruby wrapper for it. 

### Nyaplot3D

Nyaplot3D enables us to create interactive 3D charts with Ruby.
Its back-end library is [Elegans](https://github.com/domitry/elegans), a 3D plots generator written in JavaScript.

![Nyaplot3D](https://dl.dropboxusercontent.com/u/47978121/gsoc/nyaplot3d_top.png)

To learn more, see [the notebook](http://nbviewer.ipython.org/github/domitry/Nyaplot/blob/master/examples/notebook/3DPlot.ipynb).

### Bionya

Bionya is an extension library for Nyaplot that allows us to create plots for Biology. The main content of Bionya is the circular plot, that is usually used to visualize information of genes like relationship among them. This library is inspired by [circos](http://circos.ca/).

![Bionya](https://dl.dropboxusercontent.com/u/47978121/gsoc/bionya_top.png)

See [this notebook](http://nbviewer.ipython.org/github/domitry/nyaplot/blob/master/examples/notebook/Bionya.ipynb) to learn more.

### Mapnya

Mapnya is an extension library for map visualization.

![Mapnya](https://dl.dropboxusercontent.com/u/47978121/gsoc/mapnya_top.png)

See [this notebook](http://nbviewer.ipython.org/github/domitry/nyaplot/blob/master/examples/notebook/Mapnya.ipynb) to learn more.

## Installation
### Install nyaplot
<!--
### Build and install nyaplot
This gem is still under development and is not registered to RubyGems.org. Therefore clone this repository and build gem by yourself to try it.

Clone this repository:

    git clone git@github.com:domitry/nyaplot.git
    
And then build and install using gem command:

    cd nyaplot
    gem build nyaplot.gemspec
    gem install nyaplot-0.0.1.gem
-->

Add this line to your application's Gemfile:

    gem 'nyaplot'

And then execute:

    $ bundle

Or install it yourself as:

    $ gem install nyaplot


### Install IRuby notebook
Nyaplot do not have any dependency, but we strongly recommend to install [IRuby](https://github.com/minad/iruby) by @minad at the same time.
IRuby is a web-based interactive Ruby environment and Nyaplot is totally designed to work with it.
You can install the gem itself by running `gem install` command, but it has some dependent libraries outside of Ruby-ecosystem.

#### Ubuntu 14.10

There are various ways to install Python and IPython notebook, but [Anaconda](https://store.continuum.io/cshop/anaconda/) is highly recommended.

IRuby requires IPython >= 1.1 and libzmq >= 3.2, so update IPython and install libzmq3 before installing IRuby.

```shell
conda update ipython
sudo apt-get install libzmq3-dev
```
And then try to run `gem install iruby`.

If the code above does not work, try below.

```shell
conda update zeromq
conda update pyzmq
```

#### Mac OS X

On Mac OS X the IRuby notebook installation is a little bit tricky.
You would be better off using [Anaconda](https://store.continuum.io/cshop/anaconda/) for The IPython notebook dependencies except for **zeromq**.
Please be sure to remove conda zeromq package, and install zeromq with homebrew.

```shell
conda remove zeromq
brew install zeromq
```

#### Windows

First, install IPython and its dependencies using [Enthought Canopy](https://www.enthought.com/). There are various ways to install IPython, but Canopy may be the most useful to Windows users.

Then install IRuby by running `gem install iruby`.

After that, install ZeroMQ from [here](http://zeromq.org/area:download). Be sure to install stable release of the version **3.2.?**.  
**Attention: install 32bit version of Zeromq even if your Windows is built for 64-bit.**

Add the path to the directory of ZeroMQ binaries (Maybe the path is `Program Files (x86)/ZeroMQ 3.2.4/bin`) to environment variables `PATH`.

Then rename `libzmq-v100-mt-3_2_4.dll` to `libzmq.dll`. It maybe in `Program Files (x86)/ZeroMQ 3.2.4/bin`.

At last, pure IRuby do not work on Windows, so please apply [patches I sent before](https://github.com/minad/iruby/pull/30) to IRuby.

## Acknowledgments

This software has been developed by [Naoki Nishida](https://github.com/domitry) as a product in Google Summer of Code 2014 (GSoC2014). Visit the [website]((http://sciruby.com/blog/)) or [mailing list](https://groups.google.com/forum/#!forum/sciruby-dev) of SciRuby to see the progress of this project.


## Contributing

1. Fork it ( http://github.com/domitry/nyaplot/fork )
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request
