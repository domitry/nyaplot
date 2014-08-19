# Nyaplot
![alt text](https://dl.dropboxusercontent.com/u/47978121/gsoc/nya_top.png)

Nyaplot is an interactive plots generator for Ruby users. Its goal is to make it easy to create interactive plots in Ruby and still allows fast prototyping, customizability, and the integration with other scientific gems.

Nyaplot is a compound word from 'Nya' and 'plot.' The word 'Nya' comes from an onomatopoeia of cat's meow in Japanese.

This software has been developed as a product in Google Summer of Code 2014 (GSoC2014). Visit the [website]((http://sciruby.com/blog/)) or [mailing list](https://groups.google.com/forum/#!forum/sciruby-dev) of SciRuby to see the progress of this project.

## Demo

This README.md do not contain any description about usage, so see notebooks below to start using Nyaplot.

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
### Build and install nyaplot
This gem is still under development and is not registered to RubyGems.org. Therefore clone this repository and build gem by yourself to try it.

Clone this repository:

    git clone git@github.com:domitry/nyaplot.git
    
And then build and install using gem command:

    cd nyaplot
    gem build nyaplot.gemspec
    gem install nyaplot-0.0.1.gem


<!--
Add this line to your application's Gemfile:

    gem 'nyaplot'

And then execute:

    $ bundle

Or install it yourself as:

    $ gem install nyaplot
-->

### Install IRuby notebook
Nyaplot do not have any dependency, but we strongly recommend to install [IRuby](https://github.com/minad/iruby) by @minad at the same time.
IRuby is a web-based interactive Ruby environment and Nyaplot is totally designed to work with it.
You can install the gem itself by running `gem install` command, but it has some dependent libraries outside of Ruby-ecosystem.

#### Ubuntu 14.04

Coming soon.

#### Mac OS X

On Mac OS X the IRuby notebook installation is a little bit tricky.
You would be better off using [Anaconda](https://store.continuum.io/cshop/anaconda/) for The IPython notebook dependencies except for **zeromq**.
Please be sure to remove conda zeromq package, and install zeromq with homebrew.

```shell
conda remove zeromq
brew install zeromq
```

#### Windows

We have not try that yet. Please send pull-request if you can install it to Windows.

## Acknowledgments

This software has been developed by [Naoki Nishida](https://github.com/domitry) as a product in Google Summer of Code 2014 (GSoC2014). Visit the [website]((http://sciruby.com/blog/)) or [mailing list](https://groups.google.com/forum/#!forum/sciruby-dev) of SciRuby to see the progress of this project.


## Contributing

1. Fork it ( http://github.com/domitry/nyaplot/fork )
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request
